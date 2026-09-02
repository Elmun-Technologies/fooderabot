import { tg } from "./telegram";

/**
 * Tiny analytics client. The webapp is mostly inside Telegram so we
 * already know the user, but we still want a low-ceremony API that:
 *  - knows the current screen automatically (set by App.tsx on render)
 *  - batches up to 10 events or flushes every 5 s
 *  - survives a page close (sendBeacon on visibilitychange)
 *  - no-ops in the local dev DEMO mode so the stub backend isn't pummeled
 *
 * Server-side, the same shape is recorded in services/analytics.ts and
 * the Event table. The dashboard (Stage 5) will pivot/funnel off that
 * table.
 */

const ANON_KEY = "foodera.anonId";

function getOrCreateAnonymousId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = window.localStorage.getItem(ANON_KEY);
    if (!id) {
      id = "a_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      window.localStorage.setItem(ANON_KEY, id);
    }
    return id;
  } catch {
    return "a_" + Math.random().toString(36).slice(2, 10);
  }
}

export interface TrackEvent {
  name: string;
  screen?: string;
  props?: Record<string, unknown>;
}

const QUEUE: TrackEvent[] = [];
const MAX_BATCH = 10;
const FLUSH_MS = 5_000;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let currentScreen: string | undefined;
let installed = false;

function startTimer() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flush();
  }, FLUSH_MS);
}

function ensureInstalled() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  // Flush when the tab is about to be hidden so we don't lose the
  // last few screen_view / cta_click events on navigation away.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") void flush(true);
  });
  window.addEventListener("pagehide", () => void flush(true));
}

export function setScreen(name: string): void {
  currentScreen = name;
}

export function track(name: string, props?: Record<string, unknown>): void {
  if (!name) return;
  if (typeof window === "undefined") return;
  if (import.meta.env.DEV && !tg.initData) return; // local demo: no-op
  ensureInstalled();
  QUEUE.push({ name, screen: currentScreen, props });
  if (QUEUE.length >= MAX_BATCH) {
    void flush();
  } else {
    startTimer();
  }
}

function endpoint(): string {
  const base =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    (typeof window !== "undefined"
      ? (window as { __FOODERABOT_API_BASE__?: string }).__FOODERABOT_API_BASE__
      : undefined) ??
    "";
  return `${base}/api/webapp/track`;
}

async function flush(beacon = false): Promise<void> {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (QUEUE.length === 0) return;
  const batch = QUEUE.splice(0, QUEUE.length);
  const anonymousId = getOrCreateAnonymousId();
  const payload = JSON.stringify({ anonymousId, events: batch });

  if (beacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      const ok = navigator.sendBeacon(endpoint(), new Blob([payload], { type: "application/json" }));
      if (ok) return;
    } catch {
      // fall through to fetch
    }
  }

  try {
    await fetch(endpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-telegram-init-data": tg.initData },
      body: payload,
      keepalive: true,
    });
  } catch {
    // Re-queue on failure so the next tick retries — but cap the queue
    // to one screen of events to avoid runaway memory.
    if (QUEUE.length < MAX_BATCH * 2) QUEUE.unshift(...batch);
  }
}
