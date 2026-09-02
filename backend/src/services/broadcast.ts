/**
 * Marketing broadcast engine (Stage 7).
 *
 * Send a single message to a large audience of users. The flow is:
 *
 *   1. Composer (`/api/admin/broadcasts`) creates a `Broadcast` row with
 *      a `segment` JSON filter (language, type, leadTier, city, days
 *      since, hasPhone) — `computeAudience()` resolves it to a list of
 *      `telegramId` numbers.
 *   2. The same endpoint creates one `BroadcastRecipient` row per user
 *      in `PENDING` status and flips the broadcast to `RUNNING`.
 *   3. `runBroadcastJob()` (called every 30s by the scheduler) pulls
 *      PENDING recipients, sends them through `telegram.sendMessage`
 *      with a 40ms gap between calls (brief: ≤25 msg/s = 40ms), and
 *      marks SENT / FAILED / BLOCKED. This rate keeps the broadcast
 *      well under Telegram's 30 msg/s global limit and avoids 429s.
 *   4. Once all recipients are processed, the broadcast flips to
 *      `DONE`. Failed recipients are logged but the broadcast is still
 *      DONE — Telegram-side errors are terminal (blocked, chat not
 *      found, etc).
 *
 * The optional `image` field (Telegram `file_id` uploaded by the admin
 * via `uploadImageToTelegram()`) is sent as a `sendPhoto` call before
 * the text message, mirroring how a real human would post to a group.
 */

import { prisma } from "../db";
import { bot } from "../bot/bot";
import type { Language } from "../types";

const telegram = bot.telegram;

// =====================================================================
// Segment filter
// =====================================================================

/**
 * Filter shape produced by the admin UI "segment" picker. Each key
 * combines to a single SQL filter (all conditions are AND). `daysSince`
 * is "created in the last N days" — handy for "recent activity" presets.
 */
export type BroadcastSegment = {
  language?: "uz" | "ru" | "en";
  type?: "STAND" | "GUEST";
  leadTier?: "HOT" | "WARM" | "COLD";
  city?: string;
  hasPhone?: boolean;
  hasRegistration?: boolean;
  daysSince?: number; // include only users / registrations created in last N days
};

type ResolvedAudience = {
  userIds: number[];
  telegramIds: bigint[];
};

const TIER_SET = new Set(["HOT", "WARM", "COLD"]);

/**
 * Resolve a segment filter to a list of `User` rows. We run one big
 * query joining `User` + `Registration` (left) — 1 round-trip regardless
 * of segment complexity.
 */
export async function computeAudience(segment: BroadcastSegment): Promise<ResolvedAudience> {
  const where: any = {};

  if (segment.language) where.language = segment.language;
  if (segment.hasRegistration === true) where.registration = { isNot: null };
  if (segment.hasRegistration === false) where.registration = null;

  if (segment.type) {
    where.registration = { ...(where.registration ?? {}), type: segment.type };
  }
  if (segment.leadTier) {
    if (!TIER_SET.has(segment.leadTier)) {
      throw new Error(`Invalid leadTier: ${segment.leadTier}`);
    }
    where.registration = { ...(where.registration ?? {}), leadTier: segment.leadTier };
  }
  if (segment.city) {
    where.registration = { ...(where.registration ?? {}), city: segment.city };
  }
  if (segment.hasPhone === true) {
    where.registration = { ...(where.registration ?? {}), NOT: { phone: null } };
  } else if (segment.hasPhone === false) {
    where.registration = { ...(where.registration ?? {}), phone: null };
  }
  if (segment.daysSince) {
    const since = new Date(Date.now() - segment.daysSince * 24 * 60 * 60 * 1000);
    where.registration = { ...(where.registration ?? {}), createdAt: { gte: since } };
  }

  const users: Array<{ id: number; telegramId: bigint }> = await prisma.user.findMany({
    where,
    select: { id: true, telegramId: true },
    take: 50_000, // safety cap
  });

  return {
    userIds: users.map((u: { id: number; telegramId: bigint }) => u.id),
    telegramIds: users.map((u: { id: number; telegramId: bigint }) => u.telegramId),
  };
}

// =====================================================================
// Text helper
// =====================================================================

function textFor(language: Language | null, uz: string, ru: string, en: string): string {
  if (language === "ru") return ru;
  if (language === "en") return en;
  return uz;
}

// =====================================================================
// Telegram upload
// =====================================================================

/**
 * Upload a local image (Buffer + filename) to Telegram and return the
 * `file_id` that the broadcaster can use later. The admin posts the
 * image through the composer, we hand it to the bot account, and
 * Telegram stores the file on its CDN — subsequent sends are cheap
 * (just a file_id lookup) and work for every recipient.
 */
export async function uploadImageToTelegram(buffer: Buffer, filename: string): Promise<string> {
  // Telegraf's bot instance exposes `telegram.uploadFile` for this
  // exact use-case (multipart form-data, returns file_id). This is
  // distinct from `sendPhoto`, which actually delivers the photo to a
  // chat. We only want the file_id here.
  // @ts-ignore — `uploadFile` is in @types/telegraf but not always
  // surfaced by the type defs we ship.
  const res = await telegram.uploadFile(filename, { source: buffer });
  // Res shape: { file_id, file_unique_id, file_size, file_path? }
  if (!res || typeof res !== "object" || !("file_id" in res)) {
    throw new Error("Telegram did not return a file_id for the uploaded image");
  }
  return (res as { file_id: string }).file_id;
}

// =====================================================================
// Dispatcher
// =====================================================================

const SEND_DELAY_MS = 40; // ≤25 msg/s (brief) — keeps us safely under
                           // Telegram's 30 msg/s global limit.
const BATCH_SIZE = 200;   // recipients per scheduler tick

export interface BroadcastJobSummary {
  broadcastId: string;
  total: number;
  sent: number;
  failed: number;
  blocked: number;
  done: boolean;
}

/**
 * Send a single batch of pending recipients for one broadcast. Safe
 * to call repeatedly — the status check ensures we only act on rows
 * that are still PENDING. Returns a snapshot of progress so the
 * scheduler can log it.
 */
export async function processBatch(broadcastId: string): Promise<BroadcastJobSummary> {
  const broadcast = await prisma.broadcast.findUnique({
    where: { id: broadcastId },
    include: { recipients: { where: { status: "PENDING" }, take: BATCH_SIZE } },
  });
  if (!broadcast) throw new Error(`Broadcast ${broadcastId} not found`);

  let sent = 0;
  let failed = 0;
  let blocked = 0;

  for (const recipient of broadcast.recipients) {
    if (!recipient.telegramId) {
      await prisma.broadcastRecipient.update({
        where: { id: recipient.id },
        data: { status: "FAILED", error: "Missing telegramId" },
      });
      failed++;
      continue;
    }

    const language: Language = await prisma.user
      .findUnique({ where: { id: recipient.userId ?? -1 }, select: { language: true } })
      .then((u: { language: string | null } | null) => (u?.language as Language) ?? "uz")
      .catch(() => "uz" as Language);

    const text = textFor(language, broadcast.textUz, broadcast.textRu, broadcast.textEn);

    try {
      if (broadcast.imageFileId) {
        // Send photo first, then caption (Telegram's caption max is
        // 1024 chars, so we send text as a second message to be safe).
        await telegram.sendPhoto(Number(recipient.telegramId), broadcast.imageFileId, {
          caption: text.length > 1024 ? text.slice(0, 1020) + "…" : text,
        });
        if (text.length > 1024) {
          await telegram.sendMessage(Number(recipient.telegramId), text);
        }
      } else {
        await telegram.sendMessage(Number(recipient.telegramId), text);
      }
      await prisma.broadcastRecipient.update({
        where: { id: recipient.id },
        data: { status: "SENT", sentAt: new Date() },
      });
      sent++;
    } catch (err: any) {
      const message = err?.message ?? String(err);
      // 403 = user blocked the bot, 400 chat not found, 429 = rate
      // limited. Anything 4xx other than 429 is terminal.
      const isBlocked = /blocked|forbidden|chat not found|deactivated/i.test(message);
      const status = isBlocked ? "BLOCKED" : "FAILED";
      if (isBlocked) blocked++;
      else failed++;
      await prisma.broadcastRecipient
        .update({
          where: { id: recipient.id },
          data: { status, error: message.slice(0, 500) },
        })
        .catch(() => {
          // Best-effort; the broadcast is still progressing.
        });
    }

    // Soft delay between sends — brief's ≤25 msg/s constraint.
    await new Promise((r) => setTimeout(r, SEND_DELAY_MS));
  }

  // Roll up counts on the broadcast row.
  const totals = await prisma.broadcastRecipient.groupBy({
    where: { broadcastId },
    by: ["status"],
    _count: { _all: true },
  });
  const sentCount = totals.find((t: { status: string; _count: { _all: number } }) => t.status === "SENT")?._count._all ?? 0;
  const failedCount = totals.find((t: { status: string; _count: { _all: number } }) => t.status === "FAILED")?._count._all ?? 0;
  const blockedCount = totals.find((t: { status: string; _count: { _all: number } }) => t.status === "BLOCKED")?._count._all ?? 0;
  const pendingCount = totals.find((t: { status: string; _count: { _all: number } }) => t.status === "PENDING")?._count._all ?? 0;
  const done = pendingCount === 0;

  await prisma.broadcast.update({
    where: { id: broadcastId },
    data: {
      sentCount,
      failedCount,
      status: done ? "DONE" : "RUNNING",
      finishedAt: done ? new Date() : null,
    },
  });

  return {
    broadcastId,
    total: broadcast.recipients.length + sentCount + failedCount + blockedCount,
    sent: sentCount,
    failed: failedCount,
    blocked: blockedCount,
    done,
  };
}

/**
 * Sweep all RUNNING broadcasts and process one batch per broadcast per
 * tick. Called by the scheduler every 30s. If multiple broadcasts are
 * running concurrently, we still respect the per-message delay, so
 * worst-case we send ~50 msg/tick which is well under Telegram's limit.
 */
export async function runBroadcastJob(): Promise<BroadcastJobSummary[]> {
  const running = await prisma.broadcast.findMany({
    where: { status: "RUNNING" },
    select: { id: true },
  });

  const out: BroadcastJobSummary[] = [];
  for (const b of running) {
    try {
      out.push(await processBatch(b.id));
    } catch (err) {
      console.error(`[broadcast] processBatch failed for ${b.id}`, err);
    }
  }
  return out;
}

/**
 * Activate a broadcast by computing its audience, materialising one
 * `BroadcastRecipient` per user, and flipping the status to RUNNING.
 * Returns the resolved audience size.
 */
export async function startBroadcast(
  broadcastId: string,
  segment: BroadcastSegment,
): Promise<{ audienceSize: number }> {
  const audience = await computeAudience(segment);
  if (audience.userIds.length === 0) {
    // No recipients — mark DONE so the UI doesn't get stuck.
    await prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: "DONE", totalCount: 0, finishedAt: new Date() },
    });
    return { audienceSize: 0 };
  }

  await prisma.$transaction([
    prisma.broadcastRecipient.deleteMany({ where: { broadcastId } }),
    prisma.broadcastRecipient.createMany({
      data: audience.userIds.map((userId, i) => ({
        broadcastId,
        userId,
        telegramId: audience.telegramIds[i],
        status: "PENDING",
      })),
    }),
    prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: "RUNNING", startedAt: new Date(), totalCount: audience.userIds.length },
    }),
  ]);

  return { audienceSize: audience.userIds.length };
}

// =====================================================================
// Scheduler
// =====================================================================

const BROADCAST_TICK_MS = 30 * 1000; // 30s — same cadence as follow-up

/**
 * Pickup loop: any SCHEDULED broadcast whose scheduledAt has passed
 * gets materialised and flipped to RUNNING, then we tick the
 * dispatcher. Kept separate from the dispatcher tick so the latter
 * stays a tight loop (no need to scan for SCHEDULED rows 24/7).
 */
export async function _runScheduledBroadcastPicker(): Promise<void> {
  try {
    const due = await prisma.broadcast.findMany({
      where: { status: "SCHEDULED", scheduledAt: { lte: new Date() } },
      select: { id: true, segment: true },
    });
    for (const b of due) {
      try {
        await startBroadcast(b.id, b.segment as BroadcastSegment);
      } catch (err) {
        console.error(`[broadcast] scheduled start failed for ${b.id}`, err);
      }
    }
    if (due.length > 0) {
      await runBroadcastJob();
    }
  } catch (err) {
    console.error("[broadcast] scheduled-tick failed", err);
  }
}

export function startBroadcastScheduler(): void {
  // Tick immediately so freshly-created RUNNING broadcasts don't have
  // to wait a full 30s for their first send.
  runBroadcastJob().catch((err) => console.error("[broadcast] tick failed", err));
  // Scheduled-broadcast pickup runs less often (every minute) to keep
  // the scan small while still picking up time-sensitive posts.
  _runScheduledBroadcastPicker().catch((err) => console.error("[broadcast] picker failed", err));
  setInterval(() => {
    runBroadcastJob().catch((err) => console.error("[broadcast] tick failed", err));
  }, BROADCAST_TICK_MS);
  setInterval(() => {
    _runScheduledBroadcastPicker().catch((err) => console.error("[broadcast] picker failed", err));
  }, 60 * 1000);
}
