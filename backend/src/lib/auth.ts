import crypto from "node:crypto";

/**
 * Admin auth: password hashing + session token helpers.
 *
 * MVP-grade security (Stage 4):
 *  - password is hashed with PBKDF2 (Node built-in, no native deps) +
 *    a per-admin random salt. Not bcrypt, but better than a plain
 *    SHA-256 and 100% zero-dependency, so we don't have to ship a
 *    native module that breaks the Fly Docker image.
 *  - session tokens are 32 random bytes hex-encoded. The raw token
 *    goes into the cookie; only its sha256 hash is stored in the DB
 *    so a leak of AdminSession rows cannot impersonate users.
 *
 * Hardening plan (Stage 6):
 *  - bump iterations or move to argon2id
 *  - add IP allow-list
 *  - add 2FA
 */

const ITERATIONS = 120_000;
const KEYLEN = 32;
const DIGEST = "sha256";
const SESSION_BYTES = 32;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt ?? crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password.normalize("NFKC"), useSalt, ITERATIONS, KEYLEN, DIGEST)
    .toString("hex");
  return { hash, salt: useSalt };
}

/** Combine salt + hash into a single string for storage. */
export function packPassword(parts: { hash: string; salt: string }): string {
  return `${parts.salt}$${parts.hash}`;
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const { hash } = hashPassword(password, salt);
  if (hash.length !== expectedHash.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(expectedHash, "hex"));
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
