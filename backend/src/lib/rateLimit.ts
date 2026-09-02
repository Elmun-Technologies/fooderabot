/**
 * Tiny in-memory rate limiter (Stage 6).
 *
 * Sliding window per IP. Lives in process memory; if we ever scale to
 * multiple machines we'd swap this for a Redis-backed counter, but a
 * single Fly instance is the explicit production target and the
 * /api/webapp/track surface doesn't justify the extra dep just yet.
 *
 * Each endpoint that calls into this gets its own named bucket so the
 * numbers stay meaningful in the logs and the limits can be tuned
 * independently.
 */

interface Bucket {
  windowMs: number;
  max: number;
  hits: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitConfig {
  key: string;
  windowMs: number;
  max: number;
}

const DEFAULT: RateLimitConfig = { key: "default", windowMs: 60_000, max: 60 };

export function makeRateLimiter(config: Partial<RateLimitConfig> & { key: string }) {
  const cfg: RateLimitConfig = { ...DEFAULT, ...config };
  buckets.set(cfg.key, { windowMs: cfg.windowMs, max: cfg.max, hits: [] });

  return function isLimited(ip: string): { limited: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    const b = buckets.get(cfg.key);
    if (!b) return { limited: false, remaining: cfg.max, resetMs: 0 };
    const fresh = b.hits.filter((t) => now - t < b.windowMs);
    if (fresh.length >= b.max) {
      const oldest = fresh[0] ?? now;
      return { limited: true, remaining: 0, resetMs: Math.max(0, b.windowMs - (now - oldest)) };
    }
    fresh.push(now);
    buckets.set(cfg.key, { ...b, hits: fresh });
    return { limited: false, remaining: cfg.max - fresh.length, resetMs: b.windowMs };
  };
}

/** Best-effort client IP, x-forwarded-for aware. */
export function clientIp(req: { header(name: string): string | undefined; ip?: string }): string {
  const xf = req.header("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  return req.ip ?? "unknown";
}
