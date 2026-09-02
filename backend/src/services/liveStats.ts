import { prisma } from "../db";
import { config } from "../config";

/**
 * Public, cacheable "what is happening right now" snapshot for the landing page.
 *
 * This is deliberately NOT the admin dashboard payload:
 *   - no emails, no phone numbers, no full names (a single initial only),
 *   - no UTM, no CRM status,
 *   - only rows from the last `RECENT_WINDOW_HOURS` are listed at all.
 *
 * It is a marketing surface, so it is also rate limited (route level) and
 * cached: the numbers are allowed to be a minute old, and recomputing five
 * aggregates for every visitor on a campaign spike would be silly.
 */

const RECENT_WINDOW_HOURS = 72;
const RECENT_LIMIT = 12;

interface LiveSnapshot {
  generatedAt: number;
  stand: number;
  guest: number;
  today: number;
  last7d: number;
  hot: number;
  inventory: { total: number; booked: number; remaining: number; label: string } | null;
  cities: { city: string; count: number }[];
  categories: { label: string; count: number }[];
  standTypes: { label: string; count: number }[];
  recent: { initial: string; city: string | null; type: "STAND" | "GUEST"; minutesAgo: number }[];
}

let cache: { at: number; value: LiveSnapshot } | null = null;
let inflight: Promise<LiveSnapshot> | null = null;

/** Start of the current day in Tashkent (UTC+5, no DST — fixed offset is safe). */
function startOfToday(): Date {
  const now = new Date();
  const local = new Date(now.getTime() + 5 * 3_600_000);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - 5 * 3_600_000);
}

function initialOf(registration: { user: { firstName: string | null } }): string {
  const name = (registration.user.firstName ?? "").trim();
  return name ? Array.from(name)[0]!.toUpperCase() : "A";
}

async function compute(): Promise<LiveSnapshot> {
  const todayStart = startOfToday();
  const weekStart = new Date(Date.now() - 7 * 86_400_000);
  const recentStart = new Date(Date.now() - RECENT_WINDOW_HOURS * 3_600_000);

  const [stand, guest, today, last7d, hot, byCity, byCategory, byStandType, recent] = await Promise.all([
    prisma.registration.count({ where: { type: "STAND" } }),
    prisma.registration.count({ where: { type: "GUEST" } }),
    prisma.registration.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.registration.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.registration.count({ where: { leadTier: "HOT" } }),
    prisma.registration.groupBy({
      by: ["city"],
      where: { city: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { _all: "desc" } },
      take: 8,
    }),
    prisma.registration.groupBy({
      by: ["companyActivity"],
      where: { companyActivity: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { _all: "desc" } },
      take: 8,
    }),
    prisma.registration.groupBy({
      by: ["spaceNeeded"],
      where: { type: "STAND", spaceNeeded: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { _all: "desc" } },
      take: 6,
    }),
    prisma.registration.findMany({
      where: { createdAt: { gte: recentStart } },
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      select: {
        type: true,
        city: true,
        createdAt: true,
        user: { select: { firstName: true } },
      },
    }),
  ]);

  const total = config.liveStats.totalStands;
  const inventory = total > 0
    ? { total, booked: stand, remaining: Math.max(0, total - stand), label: config.liveStats.standLabel }
    : null;

  return {
    generatedAt: Date.now(),
    stand,
    guest,
    today,
    last7d,
    hot,
    inventory,
    // Explicit parameter shapes: the groupBy result types come from the
    // generated Prisma client, and spelling the projection out here keeps this
    // file compiling even when a checkout has not run `prisma generate`.
    cities: byCity.map((c: { city: unknown; _count: { _all: number } }) => ({
      city: String(c.city),
      count: c._count._all,
    })),
    categories: byCategory.map((c: { companyActivity: unknown; _count: { _all: number } }) => ({
      label: String(c.companyActivity),
      count: c._count._all,
    })),
    standTypes: byStandType.map((c: { spaceNeeded: unknown; _count: { _all: number } }) => ({
      label: String(c.spaceNeeded),
      count: c._count._all,
    })),
    recent: recent.map((r: { type: "STAND" | "GUEST"; city: string | null; createdAt: Date; user: { firstName: string | null } }) => ({
      initial: initialOf(r),
      city: r.city,
      type: r.type,
      minutesAgo: Math.max(0, Math.round((Date.now() - r.createdAt.getTime()) / 60_000)),
    })),
  };
}

export async function getLiveSnapshot(force = false): Promise<LiveSnapshot> {
  const ttl = config.liveStats.cacheMs;
  if (!force && cache && Date.now() - cache.at < ttl) return cache.value;
  // De-dupe concurrent requests: on a campaign spike the first visitor pays
  // for the aggregates, everyone else gets the same promise.
  if (inflight) return inflight;
  inflight = compute()
    .then((value) => {
      cache = { at: Date.now(), value };
      return value;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Used by tests and by the admin panel after a bulk import. */
export function invalidateLiveSnapshot(): void {
  cache = null;
}
