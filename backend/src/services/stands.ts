import { prisma } from "../db";

/**
 * Public floor-plan feed. Deliberately narrow: code, geometry, and status
 * only — never a company/tenant name, so the map never leaks who is next to
 * whom before contracts are signed (see Stand in schema.prisma).
 */
export interface PublicStand {
  code: string;
  zone: string;
  sqm: number;
  x: number;
  y: number;
  w: number;
  h: number;
  status: "AVAILABLE" | "REQUESTED" | "BOOKED";
}

const CACHE_MS = 20_000;
let cache: { at: number; value: PublicStand[] } | null = null;

export async function getPublicStands(): Promise<PublicStand[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.value;
  const rows = await prisma.stand.findMany({
    orderBy: [{ zone: "asc" }, { code: "asc" }],
    select: { code: true, zone: true, sqm: true, x: true, y: true, w: true, h: true, status: true },
  });
  cache = { at: Date.now(), value: rows };
  return rows;
}

export function invalidateStandsCache(): void {
  cache = null;
}
