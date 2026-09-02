import { useEffect, useState } from "react";
import { isSoundEnabled, play, setSoundEnabled, unlockAudio } from "../../lib/sound";

/**
 * Minimal sound on/off toggle for the editorial footer. The actual audio
 * engine is unlocked on the first user interaction (Telegram/Apple rule
 * for iOS Safari), so tapping this button for the first time also primes
 * the AudioContext — every subsequent play() in the app will work.
 */
export function SoundToggle() {
  const [on, setOn] = useState<boolean>(() => isSoundEnabled());
  // Re-read on mount in case another tab changed the preference.
  useEffect(() => {
    setOn(isSoundEnabled());
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    setSoundEnabled(next);
    if (next) {
      // User is turning sound on: unlock the context (gesture) and
      // confirm with a success tone so they know it worked.
      unlockAudio();
      play("success");
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Mute sound" : "Enable sound"}
      title={on ? "Ovozni o'chirish" : "Ovozni yoqish"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "transparent",
        border: "1px solid var(--line-on-dark)",
        color: "var(--ink-on-dark)",
        padding: "6px 12px",
        borderRadius: 999,
        fontFamily: "var(--font-text)",
        fontSize: "var(--fs-xs)",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "var(--tracking-eyebrow)",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        transition: "border-color 140ms var(--ease-out), color 140ms var(--ease-out)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--gold)";
        (e.currentTarget as HTMLElement).style.color = "var(--gold)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--line-on-dark)";
        (e.currentTarget as HTMLElement).style.color = "var(--ink-on-dark)";
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 14, lineHeight: 1 }}>
        {on ? "🔊" : "🔇"}
      </span>
      <span>{on ? "Sound on" : "Sound off"}</span>
    </button>
  );
}
