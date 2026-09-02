/**
 * Self-contained check for the public live feed (no database, no test runner):
 *
 *   npm run check:live
 *
 * It stubs the Prisma client inside the module cache, boots the real Express app
 * and asserts the three things that actually matter for the landing page:
 *
 *   1. GET /api/webapp/live answers JSON with the exact shape the webapp
 *      (webapp/src/lib/live.ts) reads — one drifted field and every counter on
 *      the page silently disappears;
 *   2. the "booths left" number is measured (total − booked) and the block is
 *      hidden when the organiser sets SITE_STAND_INVENTORY=0;
 *   3. the cache is real: two requests in a row cost one round of queries.
 *
 * Run it after touching services/liveStats.ts or the /live route.
 */

process.env.BOT_TOKEN ??= "123:test";
process.env.WEBAPP_URL ??= "http://localhost:5173";
process.env.DATABASE_URL ??= "postgresql://stub";
process.env.SITE_STAND_INVENTORY ??= "38";
process.env.LIVE_STATS_CACHE_MS ??= "60000";

let queryCount = 0;

const fakePrisma = {
  registration: {
    async count({ where }: { where?: Record<string, unknown> } = {}) {
      queryCount++;
      const type = where?.type as string | undefined;
      if (type === "STAND") return 11;
      if (type === "GUEST") return 27;
      if (where?.leadTier === "HOT") return 4;
      if (where?.createdAt) return 2;
      return 38;
    },
    async groupBy({ by }: { by: string[] }) {
      queryCount++;
      const key = by[0];
      if (key === "city") {
        return [
          { city: "Toshkent", _count: { _all: 6 } },
          { city: "Samarqand", _count: { _all: 3 } },
        ];
      }
      if (key === "companyActivity") {
        return [{ companyActivity: "Ichimliklar", _count: { _all: 5 } }];
      }
      return [{ spaceNeeded: "Premium stend · 18 m²", _count: { _all: 7 } }];
    },
    async findMany() {
      queryCount++;
      return [
        { type: "STAND", city: "Toshkent", createdAt: new Date(Date.now() - 4 * 60_000), user: { firstName: "Aziz" } },
        { type: "GUEST", city: null, createdAt: new Date(Date.now() - 55 * 60_000), user: { firstName: null } },
      ];
    },
  },
};

/* ---- put the stub where the modules under test will find it ---- */
const dbPath = require.resolve("../src/db");
require.cache[dbPath] = {
  id: dbPath,
  filename: dbPath,
  loaded: true,
  exports: { prisma: fakePrisma },
} as NodeModule & { exports: unknown };

const { getLiveSnapshot, invalidateLiveSnapshot } = require("../src/services/liveStats") as typeof import("../src/services/liveStats");
const { config } = require("../src/config") as typeof import("../src/config");
const { createServer } = require("../src/api/server") as typeof import("../src/api/server");

const failures: string[] = [];
function check(name: string, condition: boolean, extra = "") {
  if (condition) console.log(`  ok   ${name}`);
  else {
    console.log(`  FAIL ${name}${extra ? ` — ${extra}` : ""}`);
    failures.push(name);
  }
}

async function main() {
  console.log("1. snapshot shape (what webapp/src/lib/live.ts destructures)");
  invalidateLiveSnapshot();
  const snap = await getLiveSnapshot();
  for (const field of [
    "generatedAt",
    "stand",
    "guest",
    "today",
    "last7d",
    "hot",
    "inventory",
    "cities",
    "categories",
    "standTypes",
    "recent",
  ] as const) {
    check(`"${field}" present`, field in snap);
  }
  check("stand counted from the DB", snap.stand === 11, String(snap.stand));
  check("booked → remaining is measured", snap.inventory?.remaining === 38 - 11, JSON.stringify(snap.inventory));
  check("recent rows expose an initial only", snap.recent.every((r) => r.initial.length === 1));
  check("no phone/email/utm leak into the public feed", !JSON.stringify(snap).match(/phone|email|utm/i));

  console.log("\n2. cache: the second read must not touch the database");
  const before = queryCount;
  await getLiveSnapshot();
  check("cached (0 extra queries)", queryCount === before, `${queryCount - before} extra`);

  console.log("\n3. route: GET /api/webapp/live over HTTP");
  const server = createServer();
  const http = require("node:http") as typeof import("node:http");
  const listener = http.createServer(server);
  await new Promise<void>((resolve) => listener.listen(0, "127.0.0.1", resolve));
  const port = (listener.address() as { port: number }).port;
  const res = await fetch(`http://127.0.0.1:${port}/api/webapp/live`);
  const body = (await res.json()) as Record<string, unknown>;
  check("200", res.status === 200, String(res.status));
  check("ok:true", body.ok === true);
  check("cache-control set", /max-age=\d+/.test(String(res.headers.get("cache-control"))), String(res.headers.get("cache-control")));
  check("payload carries the counters", typeof body.stand === "number" && typeof body.today === "number");
  await new Promise<void>((resolve) => listener.close(() => resolve()));

  console.log("\n4. SITE_STAND_INVENTORY=0 → the counter block is hidden");
  // `config` is a singleton read once at import time, so the env var is
  // patched on the object itself — same effect as restarting with
  // SITE_STAND_INVENTORY=0, which is what an operator would actually do.
  (config as { liveStats: { totalStands: number } }).liveStats.totalStands = 0;
  const noInv = await getLiveSnapshot(true);
  check("inventory is null, not zero-filled", noInv.inventory === null, JSON.stringify(noInv.inventory));

  if (failures.length) {
    console.error(`\n✗ check:live failed (${failures.length})`);
    process.exit(1);
  }
  console.log("\n✓ live feed OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
