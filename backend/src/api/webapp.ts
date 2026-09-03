import { Router } from "express";
import { config } from "../config";
import { prisma } from "../db";
import { recordEvent, isValidEventName } from "../services/analytics";
import { clientIp, makeRateLimiter } from "../lib/rateLimit";
import { validateInitData } from "../lib/validateInitData";
import { AlreadyRegisteredError, StandUnavailableError, checkRegistration, submitRegistration } from "../services/registration";
import { getLiveSnapshot } from "../services/liveStats";
import { getPublicStands } from "../services/stands";
import { toSubmitBody, validateSubmitBody } from "./validate";

export const webappRouter = Router();

/**
 * Per-IP rate limit for the analytics track endpoint.
 * 60 events / 60s = ~1 event/second, comfortable for the batched
 * analytics client which flushes at 10 events or every 5s.
 */
const trackLimiter = makeRateLimiter({ key: "track", windowMs: 60_000, max: 60 });
/** Anti-spam: a single IP can submit at most 10 registrations / minute. */
const submitLimiter = makeRateLimiter({ key: "submit", windowMs: 60_000, max: 10 });
/**
 * The public live-stats feed is polled by every open landing page (one request
 * per 45 s per visitor), so it gets its own, generous limit. The values behind
 * it are cached in services/liveStats.ts, so a spike costs one query set.
 */
const liveLimiter = makeRateLimiter({ key: "live", windowMs: 60_000, max: 40 });

/** Resolve the Telegram user (if any) from the initData header, then look
 *  up the matching User row so we can attach UTM context to the event. */
async function getTrackedUser(req: import("express").Request): Promise<{ userId?: number; utm?: { source?: string; medium?: string; campaign?: string; content?: string; term?: string } }> {
  const initData = req.header("x-telegram-init-data") ?? "";
  const validated = validateInitData(initData, config.botToken);
  if (!validated) return {};
  const dbUser = await prisma.user.findUnique({ where: { telegramId: BigInt(validated.user.id) } });
  if (!dbUser) return {};
  return {
    userId: dbUser.id,
    utm: {
      source: dbUser.utmSource ?? undefined,
      medium: dbUser.utmMedium ?? undefined,
      campaign: dbUser.utmCampaign ?? undefined,
      content: dbUser.utmContent ?? undefined,
      term: dbUser.utmTerm ?? undefined,
    },
  };
}

function getValidatedUser(req: import("express").Request) {
  const initData = req.header("x-telegram-init-data") ?? "";
  return validateInitData(initData, config.botToken);
}

/** Unauthenticated liveness probe so clients can preflight connectivity. */
webappRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/**
 * GET /api/webapp/live — public landing-page feed.
 *
 * No initData: the landing page runs before the user is identified (and for
 * visitors who never open the form at all). It carries only aggregate counts
 * plus a short "someone just registered" list of initials, and answers 503 ->
 * null-shaped payload on failure so the page can quietly fall back to its
 * static copy.
 */
webappRouter.get("/live", async (req, res) => {
  const limit = liveLimiter(clientIp(req));
  if (limit.limited) {
    res.setHeader("Retry-After", String(Math.ceil(limit.resetMs / 1000)));
    return res.status(429).json({ error: "Too many requests" });
  }
  try {
    const snapshot = await getLiveSnapshot();
    res.setHeader("cache-control", "public, max-age=45, stale-while-revalidate=60");
    res.json({ ok: true, ...snapshot });
  } catch (err) {
    console.error("Failed to build live snapshot", err);
    res.status(503).json({ error: "Live data unavailable" });
  }
});

/**
 * GET /api/webapp/stands — public real floor-plan feed.
 *
 * Same trust level as /live: no auth, cheap to poll, cached server-side.
 * Reuses the /live rate limiter bucket since both are landing-page reads.
 */
webappRouter.get("/stands", async (req, res) => {
  const limit = liveLimiter(clientIp(req));
  if (limit.limited) {
    res.setHeader("Retry-After", String(Math.ceil(limit.resetMs / 1000)));
    return res.status(429).json({ error: "Too many requests" });
  }
  try {
    const stands = await getPublicStands();
    res.setHeader("cache-control", "public, max-age=15, stale-while-revalidate=30");
    res.json({ ok: true, stands });
  } catch (err) {
    console.error("Failed to load stands", err);
    res.status(503).json({ error: "Stands unavailable" });
  }
});

webappRouter.get("/check", async (req, res) => {
  const validated = getValidatedUser(req);
  if (!validated) return res.status(401).json({ error: "Invalid Telegram init data" });

  const result = await checkRegistration(validated.user);
  res.json(result);
});

webappRouter.post("/submit", async (req, res) => {
  const validated = getValidatedUser(req);
  if (!validated) return res.status(401).json({ error: "Invalid Telegram init data" });

  const ip = clientIp(req);
  const limit = submitLimiter(ip);
  if (limit.limited) {
    res.setHeader("Retry-After", String(Math.ceil(limit.resetMs / 1000)));
    return res.status(429).json({ error: "Too many submissions, slow down" });
  }

  const validationError = validateSubmitBody(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  try {
    const registration = await submitRegistration(validated.user, toSubmitBody(req.body));
    res.json({ ok: true, id: registration.id });
  } catch (err) {
    if (err instanceof AlreadyRegisteredError) {
      return res.status(409).json({ error: "Already registered" });
    }
    if (err instanceof StandUnavailableError) {
      return res.status(409).json({ error: "Stand no longer available", code: "STAND_TAKEN" });
    }
    console.error("Failed to submit registration", err);
    res.status(500).json({ error: "Internal error" });
  }
});

/**
 * Stage 4 analytics endpoint.
 * The client (webapp/src/lib/analytics.ts) always batches: it POSTs
 * `{ anonymousId, events: [{ name, screen, props }, ...] }`. A bare single
 * event (no `events[]`) is also accepted for any other caller.
 *
 * Auth is optional: we accept initData when present (then we attach the
 * matching userId + UTM) and otherwise fall back to a client-supplied
 * `anonymousId` (set by the webapp in localStorage). Either side MUST be
 * provided — see isValidEventName + the missing_id check.
 */
webappRouter.post("/track", async (req, res) => {
  // Stage 6: per-IP rate limit. The client already batches so 60/min
  // is plenty; without this a runaway client could fill the Event table.
  const ip = clientIp(req);
  const limit = trackLimiter(ip);
  if (limit.limited) {
    res.setHeader("Retry-After", String(Math.ceil(limit.resetMs / 1000)));
    return res.status(429).json({ ok: false, reason: "rate_limited" });
  }

  const body = (req.body ?? {}) as Record<string, unknown>;
  const { userId, utm } = await getTrackedUser(req);
  const anonymousId = typeof body.anonymousId === "string" ? body.anonymousId.slice(0, 64) : undefined;

  const rawEvents = (Array.isArray(body.events) ? body.events : [body]).slice(0, 20);
  let recorded = 0;
  for (const raw of rawEvents) {
    const e = (raw ?? {}) as Record<string, unknown>;
    const screen = typeof e.screen === "string" ? e.screen.slice(0, 64) : undefined;
    const name = typeof e.name === "string" ? e.name : "";
    const props = e.props;
    try {
      const result = await recordEvent({ name, screen, props, anonymousId, userId, utm });
      if (result.recorded) recorded++;
    } catch (err) {
      console.error("Failed to record event", err);
    }
  }
  res.json({ ok: true, recorded });
});

/** Health check used by the in-app analytics library to know the track
 *  endpoint is reachable. Always 200 so a network blip doesn't stop the
 *  app from working. */
webappRouter.get("/track", (_req, res) => {
  res.json({ ok: true });
});

// Re-export so other modules (e.g. tests) can reuse the helper.
export { isValidEventName };
