/**
 * IP allowlist middleware (Stage 7).
 *
 * If `ADMIN_IP_ALLOWLIST` is set, only requests from listed IPs
 * reach the admin router. Each entry may be:
 *   - a single IPv4/IPv6 address (exact match)
 *   - a CIDR block (e.g. 10.0.0.0/8, 2001:db8::/32)
 *   - "any" to explicitly disable the check
 *
 * Empty / unset = allow all (current behaviour, useful for first
 * deploys and local dev). The check is IPv4/IPv6 agnostic.
 *
 * We match against `req.ip` which honours `app.set("trust proxy", 1)`,
 * so the real client IP is taken from `X-Forwarded-For` in
 * production.
 */

import type { Request, Response, NextFunction } from "express";

type Entry =
  | { kind: "any" }
  | { kind: "exact"; ip: string }
  | { kind: "cidr"; base: bigint; bits: number; family: 4 | 6 };

let cached: { raw: string; entries: Entry[] } | null = null;
let cachedAt = 0;
const CACHE_MS = 30 * 1000;

function parseIpv4(s: string): bigint | null {
  const parts = s.split(".");
  if (parts.length !== 4) return null;
  let n = 0n;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isFinite(v) || v < 0 || v > 255) return null;
    n = (n << 8n) | BigInt(v);
  }
  return n;
}

function parseIpv6(s: string): bigint | null {
  if (s === "::") return 0n;
  const halves = s.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const fill = 8 - left.length - right.length;
  if (fill < 0) return null;
  const groups: number[] = [];
  for (const g of left.concat(Array(fill).fill("0")).concat(right)) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return null;
    groups.push(parseInt(g, 16));
  }
  let n = 0n;
  for (const g of groups) n = (n << 16n) | BigInt(g);
  return n;
}

function parse(raw: string): Entry[] {
  const out: Entry[] = [];
  for (const item of raw.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean)) {
    if (item.toLowerCase() === "any") {
      out.push({ kind: "any" });
      continue;
    }
    if (item.includes("/")) {
      const [addr, prefixStr] = item.split("/");
      const prefix = Number(prefixStr);
      if (!addr || !Number.isFinite(prefix)) continue;
      if (addr.includes(":")) {
        const n = parseIpv6(addr);
        if (n === null) continue;
        const shift = 128 - prefix;
        const mask = shift === 128 ? 0n : (~0n << BigInt(shift)) & ((1n << 128n) - 1n);
        out.push({ kind: "cidr", base: n & mask, bits: prefix, family: 6 });
      } else {
        const n = parseIpv4(addr);
        if (n === null) continue;
        const shift = 32 - prefix;
        const mask = shift === 32 ? 0n : ((~0n << BigInt(shift)) & 0xffffffffn);
        out.push({ kind: "cidr", base: n & mask, bits: prefix, family: 4 });
      }
      continue;
    }
    out.push({ kind: "exact", ip: item });
  }
  return out;
}

function loadAllowlist(): { raw: string; entries: Entry[] } {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_MS) return cached;
  const raw = process.env.ADMIN_IP_ALLOWLIST ?? "";
  cached = { raw, entries: parse(raw) };
  cachedAt = now;
  return cached;
}

export function ipAllowlistMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const list = loadAllowlist();
    if (list.entries.length === 0) return next();
    if (list.entries.some((e) => e.kind === "any")) return next();

    const ip = req.ip ?? "unknown";
    const normalized = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
    const v4 = parseIpv4(normalized);
    const v6 = v4 === null ? parseIpv6(normalized) : null;
    const num = v4 ?? v6;

    const ok = list.entries.some((e) => {
      if (e.kind === "exact") return e.ip === ip || e.ip === normalized;
      if (e.kind === "cidr" && num !== null) {
        if (e.family === 4 && v4 === null) return false;
        if (e.family === 6 && v6 === null) return false;
        const totalBits = e.family === 4 ? 32 : 128;
        const shift = totalBits - e.bits;
        const mask = shift === totalBits ? 0n : ((~0n << BigInt(shift)) & ((1n << BigInt(totalBits)) - 1n));
        return (num & mask) === e.base;
      }
      return false;
    });

    if (!ok) {
      res.status(403).json({ error: "Forbidden (IP not in allowlist)" });
      return;
    }
    next();
  };
}
