/**
 * Stage-3 sound engine.
 *
 * Three very short tones are synthesised on the fly with the WebAudio
 * API, so we never need to ship a single byte of audio. Each tone is
 * built with OscillatorNode + GainNode envelopes — nothing in the
 * DOM, nothing downloaded, and zero kilobytes added to the bundle.
 *
 * The AudioContext is created lazily and only on the FIRST user gesture
 * (otherwise iOS Safari will silently refuse to play anything). Until
 * that first gesture, every `play()` call is a no-op so we never
 * leak AudioContext instances or warn the user.
 *
 * The user can mute all sounds at any time via the toggle in the
 * landing footer. The preference is persisted in localStorage under
 * `foodera.sound` (default: "on"). When `prefers-reduced-motion` is
 * set, sounds are also muted (a beep is a physical event).
 */

export type SoundName = "tap" | "success" | "transition";

const STORAGE_KEY = "foodera.sound";
const QUERY = "(prefers-reduced-motion: reduce)";

let ctx: AudioContext | null = null;
let unlocked = false;
let enabled = readPreference();

function readPreference(): boolean {
  if (typeof window === "undefined") return true;
  const stored = window.localStorage?.getItem(STORAGE_KEY);
  if (stored === "off") return false;
  if (stored === "on") return true;
  // Default: on, but check reduced-motion up-front.
  return !window.matchMedia?.(QUERY).matches;
}

function persistPreference(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? "on" : "off");
  } catch {
    // Storage might be disabled (private mode) — that's fine, the
    // in-memory flag still works for the current session.
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

/**
 * Call this from a user gesture (click/tap) to "unlock" the audio
 * context on iOS. The SoundToggle component does this for us; if
 * you wire another entry point (e.g. a play CTA), call it there too.
 */
export function unlockAudio(): void {
  if (unlocked) return;
  const c = getCtx();
  if (!c) return;
  // A near-silent buffer is the documented trick to unlock iOS.
  const buf = c.createBuffer(1, 1, 22050);
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(c.destination);
  src.start(0);
  if (c.state === "suspended") void c.resume();
  unlocked = true;
}

export function isSoundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(value: boolean): void {
  enabled = value;
  persistPreference(value);
}

function tone(freq: number, durMs: number, type: OscillatorType, peak: number, sweepTo?: number): void {
  if (!enabled) return;
  if (!unlocked) return; // wait for the first user gesture
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, sweepTo), t0 + durMs / 1000);
  }
  // Envelope: short attack, longer release. Peak is the max gain (0..1).
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durMs / 1000);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + durMs / 1000 + 0.01);
}

const PLAYERS: Record<SoundName, () => void> = {
  tap: () => tone(560, 45, "sine", 0.06),
  success: () => {
    tone(660, 90, "sine", 0.08);
    setTimeout(() => tone(990, 140, "sine", 0.07), 60);
  },
  transition: () => tone(380, 120, "sine", 0.05, 520),
};

export function play(name: SoundName): void {
  PLAYERS[name]();
}
