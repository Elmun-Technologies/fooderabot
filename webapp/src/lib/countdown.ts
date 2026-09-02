import { useEffect, useState } from "react";

/**
 * Single source of truth for "when does the expo happen".
 *
 * The countdown is used by the hero, the sticky top bar and the mobile CTA
 * bar; previously each of those computed its own copy and updated on a
 * 30 s timer, which made the numbers feel dead. One hook, one tick.
 *
 * Timezone note: the venue is in Samarkand (UTC+5, no DST), so a fixed
 * offset is safe and avoids the user's local timezone leaking into the
 * "days left" number.
 */
export const EVENT_START_MS = Date.parse("2026-10-20T09:00:00+05:00");
export const EVENT_END_MS = Date.parse("2026-10-22T18:00:00+05:00");

export type CountdownPhase = "before" | "live" | "done";

export interface CountdownParts {
  phase: CountdownPhase;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Milliseconds until the opening ceremony (negative once we are live). */
  deltaMs: number;
}

function parts(now: number): CountdownParts {
  const deltaMs = EVENT_START_MS - now;
  if (deltaMs <= 0) {
    const after = Date.now() - EVENT_START_MS;
    return {
      phase: Date.now() < EVENT_END_MS ? "live" : "done",
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      deltaMs: -after,
    };
  }
  return {
    phase: "before",
    days: Math.floor(deltaMs / 86_400_000),
    hours: Math.floor((deltaMs % 86_400_000) / 3_600_000),
    minutes: Math.floor((deltaMs % 3_600_000) / 60_000),
    seconds: Math.floor((deltaMs % 60_000) / 1000),
    deltaMs,
  };
}

/**
 * Ticks every second while the tab is visible (a hidden tab costs CPU for
 * no reason) and re-syncs the moment it becomes visible again.
 */
export function useCountdown(): CountdownParts {
  const [value, setValue] = useState<CountdownParts>(() => parts(Date.now()));

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const sync = () => setValue(parts(Date.now()));
    const start = () => {
      if (timer) return;
      sync();
      timer = setInterval(sync, 1000);
    };
    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") stop();
      else start();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return value;
}

/** "43 kun 06:12:38" — compact string for the sticky bar / share text. */
export function formatShort(c: CountdownParts, labels: { d: string; h: string; m: string; s: string }): string {
  if (c.phase === "live") return "";
  if (c.phase === "done") return "";
  const p = (n: number) => String(n).padStart(2, "0");
  if (c.days > 0) return `${c.days} ${labels.d} · ${p(c.hours)}:${p(c.minutes)}:${p(c.seconds)}`;
  return `${p(c.hours)}:${p(c.minutes)}:${p(c.seconds)}`;
}

/**
 * Local wall clock of the host city. Shown in the venue block so the page
 * reads as "an event that is happening somewhere, right now" instead of a
 * static brochure. Asia/Tashkent, no DST.
 */
export function useSamarkandClock(): string {
  const [time, setTime] = useState(() => nowInTashkent());
  useEffect(() => {
    const id = setInterval(() => setTime(nowInTashkent()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

function nowInTashkent(): string {
  const d = new Date(Date.now() + 5 * 3_600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())}`;
}

/** True during working hours (Mon–Fri 09:00–19:00 Tashkent) — powers the
 *  "manager is online / will answer tomorrow" microcopy. */
export function isOfficeOpen(): boolean {
  const d = new Date(Date.now() + 5 * 3_600_000);
  const day = d.getUTCDay();
  const hour = d.getUTCHours();
  return day >= 1 && day <= 5 && hour >= 9 && hour < 19;
}
