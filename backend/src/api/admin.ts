import { Router } from "express";
import { prisma } from "../db";
import {
  SESSION_COOKIE,
  SESSION_TTL,
  hashSessionToken,
  isRateLimited,
  newSessionToken,
  recordHit,
  verifyPassword,
} from "../lib/auth";

/**
 * Stage 4 admin API. Auth is intentionally minimal:
 *  - username + password (PBKDF2-hashed, see lib/auth.ts)
 *  - httpOnly session cookie, sha256-hashed in the DB
 *  - 5 attempts / minute / IP rate-limit on /login
 *  - every mutating action writes to AuditLog
 *
 * The router is mounted at /api/admin. Cookies are set with
 * SameSite=Lax; secure flag is auto-set when the request is HTTPS,
 * which is always the case in production (Fly terminates TLS).
 */

export const adminRouter = Router();

function getClientIp(req: import("express").Request): string {
  const xf = req.header("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  return req.ip ?? "unknown";
}

function setSessionCookie(res: import("express").Response, token: string) {
  // In production (Fly) the API is HTTPS-only so `secure: true` is correct.
  // For local dev we relax to `false` so the cookie survives on http://.
  const isProd = process.env.NODE_ENV === "production";
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: SESSION_TTL,
  });
}

async function loadSessionUser(req: import("express").Request) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const tokenHash = hashSessionToken(token);
  const session = await prisma.adminSession.findUnique({
    where: { tokenHash },
    include: { adminUser: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  // Touch lastSeenAt on every authenticated call so the audit log
  // can show "this admin is active".
  await prisma.adminSession.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  }).catch(() => undefined);
  return session.adminUser;
}

async function requireAdmin(req: import("express").Request, res: import("express").Response) {
  const user = await loadSessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return user;
}

async function writeAudit(
  adminUserId: string | null,
  action: string,
  req: import("express").Request,
  target?: string,
  meta?: unknown,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      adminUserId: adminUserId ?? undefined,
      action,
      target,
      meta: meta as never,
      ip: getClientIp(req),
      userAgent: req.header("user-agent") ?? undefined,
    },
  });
}

// --------------------------------------------------------------------------
// Auth
// --------------------------------------------------------------------------

adminRouter.post("/login", async (req, res) => {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many attempts, try again in a minute" });
  }
  recordHit(ip);

  const body = (req.body ?? {}) as Record<string, unknown>;
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const user = await prisma.adminUser.findUnique({ where: { username } });
  if (!user) {
    await writeAudit(null, "login_failed", req, undefined, { username, reason: "no_such_user" });
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const parts = user.passwordHash.split("$");
  if (parts.length !== 2) {
    return res.status(500).json({ error: "Corrupt password record" });
  }
  const [salt, hash] = parts;
  if (!verifyPassword(password, salt, hash)) {
    await writeAudit(user.id, "login_failed", req, user.id, { reason: "bad_password" });
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const { raw, hash: tokenHash } = newSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL);
  await prisma.adminSession.create({
    data: {
      adminUserId: user.id,
      tokenHash,
      userAgent: req.header("user-agent") ?? undefined,
      ip,
      expiresAt,
    },
  });
  await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await writeAudit(user.id, "login_success", req, user.id);
  setSessionCookie(res, raw);
  res.json({ ok: true, user: { id: user.id, username: user.username, role: user.role } });
});

adminRouter.post("/logout", async (req, res) => {
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) {
    const tokenHash = hashSessionToken(token);
    const session = await prisma.adminSession.findUnique({ where: { tokenHash } });
    if (session) {
      await prisma.adminSession.delete({ where: { id: session.id } });
      await writeAudit(session.adminUserId, "logout", req, session.adminUserId);
    }
  }
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ ok: true });
});

adminRouter.get("/me", async (req, res) => {
  const user = await loadSessionUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  res.json({ id: user.id, username: user.username, role: user.role, lastLoginAt: user.lastLoginAt });
});

// --------------------------------------------------------------------------
// Dashboard
// --------------------------------------------------------------------------

adminRouter.get("/dashboard", async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalLeads, todayLeads, weekLeads, hotLeads, byTierRaw, byLangRaw, byStatusRaw, recentEvents, lastAudit] =
    await Promise.all([
      prisma.registration.count(),
      prisma.registration.count({ where: { createdAt: { gte: oneDayAgo } } }),
      prisma.registration.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      prisma.registration.count({ where: { leadTier: "HOT" } }),
      prisma.registration.groupBy({ by: ["leadTier"], _count: { _all: true } }),
      prisma.registration.groupBy({ by: ["language"], _count: { _all: true } }),
      prisma.registration.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.event.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { adminUser: true } }),
    ]);

  const byTier: Record<string, number> = {};
  for (const r of byTierRaw) byTier[r.leadTier ?? "UNSCORED"] = r._count._all;
  const byLang: Record<string, number> = {};
  for (const r of byLangRaw) byLang[r.language ?? "unknown"] = r._count._all;
  const byStatus: Record<string, number> = {};
  for (const r of byStatusRaw) byStatus[r.status] = r._count._all;

  // Funnel counts: each step at least once in the last week.
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const [appOpens, landings, roleSelects, submits] = await Promise.all([
    prisma.event.count({ where: { name: "app_open", createdAt: { gte: lastWeek } } }),
    prisma.event.count({ where: { name: "screen_view", screen: "landing", createdAt: { gte: lastWeek } } }),
    prisma.event.count({ where: { name: "screen_view", screen: "role", createdAt: { gte: lastWeek } } }),
    prisma.event.count({ where: { name: "submit_success", createdAt: { gte: lastWeek } } }),
  ]);

  await writeAudit(user.id, "dashboard_view", req);

  res.json({
    leads: { total: totalLeads, today: todayLeads, thisWeek: weekLeads, hot: hotLeads },
    breakdown: { tier: byTier, language: byLang, status: byStatus },
    funnel: { appOpens, landings, roleSelects, submits },
    recentEvents: recentEvents.map((e: any) => ({ id: String(e.id), name: e.name, screen: e.screen, createdAt: e.createdAt })),
    audit: lastAudit.map((a: any) => ({
      id: String(a.id),
      action: a.action,
      admin: a.adminUser?.username ?? null,
      target: a.target,
      ip: a.ip,
      createdAt: a.createdAt,
    })),
  });
});

// --------------------------------------------------------------------------
// Audit
// --------------------------------------------------------------------------

adminRouter.get("/audit", async (req, res) => {
  const user = await requireAdmin(req, res);
  if (!user) return;
  const limit = Math.min(Number(req.query.limit ?? 50), 200);
  const items = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { adminUser: true },
  });
  res.json({
    items: items.map((a: any) => ({
      id: String(a.id),
      action: a.action,
      admin: a.adminUser?.username ?? null,
      target: a.target,
      meta: a.meta,
      ip: a.ip,
      createdAt: a.createdAt,
    })),
  });
});
