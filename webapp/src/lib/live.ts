import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE, DEMO } from "./api";
import { EVENT } from "./event";

/**
 * Live data layer.
 *
 * The landing page used to shout static claims ("125M+ iste'molchi",
 * "tez kunda e'lon qilinadi") that nothing backed up. This module pulls the
 * *real* state of the campaign from the backend — how many booths are taken,
 * who registered in the last hour, which cities are already in — and the UI
 * renders whatever actually exists.
 *
 * Contract:
 *   - the endpoint is public (no initData) and cached server-side (60 s),
 *   - the client polls every 45 s while the tab is visible,
 *   - any failure yields `null` and every live widget renders its honest
 *     static fallback. A missing number must never be replaced by a made-up
 *     one — that is exactly the "fake" feeling we are removing.
 *   - in a DEV build without Telegram initData we serve a clearly-marked
 *     fixture so the page can be reviewed (and demoed) outside the bot.
 */

export interface LiveCity {
  city: string;
  count: number;
}

export interface LiveRecent {
  /** First initial only — the endpoint never exposes a full name. */
  initial: string;
  city: string | null;
  type: "STAND" | "GUEST";
  minutesAgo: number;
}

export interface LiveStats {
  /** Epoch ms of the server-side snapshot (or fixture generation). */
  generatedAt: number;
  stand: number;
  guest: number;
  today: number;
  last7d: number;
  hot: number;
  /** Physical booth inventory; null when the organiser has not configured it. */
  inventory: { total: number; booked: number; remaining: number; label: string } | null;
  cities: LiveCity[];
  categories: { label: string; count: number }[];
  /** How many leads picked each booth type (STAND registrations only). */
  standTypes: { label: string; count: number }[];
  recent: LiveRecent[];
  /** "api" = real numbers, "dev" = local preview fixture. */
  source: "api" | "dev";
}

const TIMEOUT_MS = 8_000;

export async function fetchLiveStats(signal?: AbortSignal): Promise<LiveStats | null> {
  if (DEMO) return devFixture();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  if (signal) signal.addEventListener("abort", () => controller.abort(), { once: true });
  try {
    const res = await fetch(`${API_BASE}/api/webapp/live`, {
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as LiveStats & { ok?: boolean };
    if (!data || typeof data !== "object" || typeof data.stand !== "number") return null;
    return { ...data, source: "api" };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------------------------------------------------------------------- */
/* dev fixture — only reachable from `import.meta.env.DEV` builds         */
/* ---------------------------------------------------------------------- */

const DEV_CITIES = ["Toshkent", "Samarqand", "Buxoro", "Farg'ona", "Namangan", "Andijon"];
const DEV_RECENT: Array<Omit<LiveRecent, "minutesAgo">> = [
  { initial: "A", city: "Toshkent", type: "STAND" },
  { initial: "D", city: "Samarqand", type: "GUEST" },
  { initial: "M", city: "Buxoro", type: "STAND" },
  { initial: "R", city: "Toshkent", type: "STAND" },
  { initial: "S", city: "Namangan", type: "GUEST" },
  { initial: "N", city: "Farg'ona", type: "STAND" },
];

/** A deterministic-but-moving snapshot: the same seed every minute, so the
 *  preview visibly ticks without thrashing on every poll. */
function devFixture(): LiveStats {
  const minute = Math.floor(Date.now() / 60_000);
  const stand = 24 + (minute % 7);
  const guest = 61 + (minute % 11);
  const total = EVENT.inventory.totalStands;
  return {
    generatedAt: Date.now(),
    source: "dev",
    stand,
    guest,
    today: 2 + (minute % 5),
    last7d: 18 + (minute % 9),
    hot: 6 + (minute % 4),
    inventory: {
      total,
      booked: stand,
      remaining: Math.max(0, total - stand),
      label: EVENT.inventory.label,
    },
    cities: DEV_CITIES.map((city, i) => ({ city, count: Math.max(1, stand - i * 3) })).sort(
      (a, b) => b.count - a.count,
    ),
    categories: [],
    standTypes: [
      { label: "Premium stend · 18 m²", count: 9 + (minute % 3) },
      { label: "Standart stend · 9 m²", count: 6 + (minute % 2) },
      { label: "Faqat maydon · 36 m²+", count: 3 },
      { label: "Hali aniq emas — maslahat kerak", count: 2 },
    ],
    recent: DEV_RECENT.map((r, i) => ({ ...r, minutesAgo: 3 + i * 27 + (minute % 12) })),
  };
}

/* ---------------------------------------------------------------------- */

export interface UseLiveStats {
  stats: LiveStats | null;
  /** true until the first snapshot (real or fixture) resolves */
  loading: boolean;
  refresh: () => void;
}

export function useLiveStats(intervalMs = 45_000): UseLiveStats {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const alive = useRef(true);

  const load = useCallback(async () => {
    const next = await fetchLiveStats();
    if (!alive.current) return;
    if (next) setStats(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    alive.current = true;
    void load();
    let timer: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (timer) return;
      timer = setInterval(() => void load(), intervalMs);
    };
    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") stop();
      else {
        void load();
        start();
      }
    };
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      alive.current = false;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, load]);

  const refresh = useCallback(() => void load(), [load]);

  return { stats, loading, refresh };
}

/** "5 daq. oldin" — relative time in the page language. */
export function minutesAgoLabel(minutes: number, language: "uz" | "ru" | "en"): string {
  const m = Math.max(0, Math.round(minutes));
  if (language === "ru") {
    if (m < 1) return "только что";
    if (m < 60) return `${m} мин назад`;
    return `${Math.round(m / 60)} ч назад`;
  }
  if (language === "en") {
    if (m < 1) return "just now";
    if (m < 60) return `${m} min ago`;
    return `${Math.round(m / 60)} h ago`;
  }
  if (m < 1) return "hozir";
  if (m < 60) return `${m} daq. oldin`;
  return `${Math.round(m / 60)} soat oldin`;
}
