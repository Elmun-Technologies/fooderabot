import { tg } from "./telegram";

/**
 * Centralised haptic feedback helper. All UI surfaces call this instead of
 * `tg.HapticFeedback` directly so we can:
 *   - silently no-op when the Telegram client does not support haptics,
 *   - no-op when the user has reduced-motion enabled (haptic is a
 *     physical motion, and they asked for less of it),
 *   - keep a single place to log/analyse taps later if we want to.
 *
 * `prefers-reduced-motion` is *not* a CSS-only signal in JS land, so we
 * also short-circuit when the media query matches.
 */

const QUERY = "(prefers-reduced-motion: reduce)";
let prefersReduced = false;

function refreshPref() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
  prefersReduced = window.matchMedia(QUERY).matches;
}
refreshPref();
if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  window.matchMedia(QUERY).addEventListener?.("change", (e) => {
    prefersReduced = e.matches;
  });
}

function h<T>(fn: () => T): T | undefined {
  if (prefersReduced) return;
  const hf = tg.HapticFeedback;
  if (!hf) return;
  try {
    return fn();
  } catch {
    // Haptics throwing must never break a button — swallow.
  }
}

export const haptics = {
  /** Tiny "tap" feedback for chip / button selections. */
  tap(): void {
    h(() => hfImpact("light"));
  },

  /** A slightly heavier "I'm sure" feedback for primary actions (next, submit). */
  confirm(): void {
    h(() => hfImpact("medium"));
  },

  /** A click of a chip or radio-style choice (lighter than a button). */
  select(): void {
    h(() => hfSelection());
  },

  /** Successful flow completion — used on submit success. */
  success(): void {
    h(() => hfNotify("success"));
  },

  /** Failure — used on submit error, validation error. */
  error(): void {
    h(() => hfNotify("error"));
  },

  /** Warning — used on already-registered, etc. */
  warning(): void {
    h(() => hfNotify("warning"));
  },
};

function hfImpact(style: "light" | "medium" | "heavy" | "rigid" | "soft") {
  tg.HapticFeedback!.impactOccurred(style);
}
function hfSelection() {
  tg.HapticFeedback!.selectionChanged();
}
function hfNotify(type: "error" | "success" | "warning") {
  tg.HapticFeedback!.notificationOccurred(type);
}
