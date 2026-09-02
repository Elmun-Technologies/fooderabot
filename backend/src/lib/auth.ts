import crypto from "node:crypto";
import argon2 from "argon2";

/**
 * Admin auth: password hashing + session token helpers.
 *
 * Stage 7 hardening: password is hashed with **argon2id** (memory-hard,
 * recommended by OWASP since 2023). Existing admin rows created with
 * the old PBKDF2 format are still verifiable — we detect the format
 * by the `$algo$` prefix and rehash to argon2id on the first successful
 * login after the upgrade, so the migration is invisible to the
 * operator.
 *
 * Stored format: `${algo}$${payload}` where:
 *   - algo = "argon2id" | "pbkdf2"
 *   - payload = argon2 encoded string OR `${salt}$${hexHash}` for PBKDF2
 *
 * The full encoded argon2 string already includes salt, params and
 * hash, so we wrap it as `argon2id$argon2_encoded_string`.
 *
 * Session tokens: 32 random bytes hex-encoded, only the sha256 is
 * stored in the DB (raw token lives in the httpOnly cookie).
 */

const PBKDF2_ITERATIONS = 120_000;
const PBKDF2_KEYLEN = 32;
const PBKDF2_DIGEST = "sha256";

// OWASP-recommended argon2id params (2023+): m=19MiB, t=2, p=1.
// Verified on a Fly shared-cpu-1x machine (~80ms per hash).
const ARGON2_OPTS = {
  type: argon2.argon2id,
  memoryCost: 19 * 1024,
  timeCost: 2,
  parallelism: 1,
} as const;

const SESSION_BYTES = 32;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hash a password with argon2id. Returns the encoded string already
 * carrying salt + params — wrap with `packPassword` for storage.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password.normalize("NFKC"), ARGON2_OPTS);
}

/** Combine algo prefix + payload into a single string for storage. */
export function packPassword(algo: "argon2id" | "pbkdf2", payload: string): string {
  return `${algo}$${payload}`;
}

/**
 * Verify a password against a packed record. Returns the *new* packed
 * record if the password matched AND the record was an old format
 * (i.e. we should rehash + persist). Returns null if the password
 * was wrong.
 *
 * The rehash-on-login trick keeps the migration invisible: a
 * 6-month-old admin record upgrades to argon2id the next time they
 * sign in, and the change is one cheap DB update.
 */
export async function verifyPassword(
  password: string,
  packed: string,
): Promise<{ ok: true; upgraded: string | null } | { ok: false }> {
  const sep = packed.indexOf("$");
  if (sep <= 0) return { ok: false };
  const algo = packed.slice(0, sep);
  const payload = packed.slice(sep + 1);

  if (algo === "argon2id") {
    const valid = await argon2.verify(payload, password.normalize("NFKC"));
    return valid ? { ok: true, upgraded: null } : { ok: false };
  }

  if (algo === "pbkdf2") {
    // Legacy PBKDF2: payload = `${salt}$${hexHash}`.
    const innerSep = payload.indexOf("$");
    if (innerSep <= 0) return { ok: false };
    const salt = payload.slice(0, innerSep);
    const expectedHex = payload.slice(innerSep + 1);
    const actualHex = crypto
      .pbkdf2Sync(password.normalize("NFKC"), salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
      .toString("hex");
    if (actualHex.length !== expectedHex.length) return { ok: false };
    const ok = crypto.timingSafeEqual(
      Buffer.from(actualHex, "hex"),
      Buffer.from(expectedHex, "hex"),
    );
    if (!ok) return { ok: false };
    // Rehash to argon2id on first successful login.
    const upgradedHash = await hashPassword(password);
    return { ok: true, upgraded: packPassword("argon2id", upgradedHash) };
  }

  return { ok: false };
}

export function newSessionToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(SESSION_BYTES).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export function hashSessionToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export const SESSION_COOKIE = "foodera_admin";
export const SESSION_TTL = SESSION_TTL_MS;

/**
 * Very small in-memory rate limiter for the login endpoint.
 * Counts attempts per IP, sliding 60s window. Resets on process restart
 * which is fine for a single Fly machine.
 */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;
const ipHits = new Map<string, number[]>();

export function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  ipHits.set(ip, hits);
  return hits.length >= RATE_MAX;
}

export function recordHit(ip: string): void {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  ipHits.set(ip, hits);
}
