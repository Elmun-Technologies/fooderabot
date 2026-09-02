import { useEffect, useState } from "react";
import { t, type Language } from "../../i18n";
import { isSoundEnabled, play, setSoundEnabled, unlockAudio } from "../../lib/sound";
import { Icon } from "./Icons";

/**
 * Sound on/off toggle for the landing.
 *
 * The audio engine itself is unlocked on the first user gesture (the iOS
 * Safari rule), so tapping this for the first time also primes the
 * AudioContext — every subsequent `play()` in the app then works.
 *
 * Two fixes over the previous version: the label is translated (it used to be
 * hardcoded English) and the state icon is a stroke glyph instead of an emoji,
 * in line with the "no emoji as icons" rule of the brand.
 */
export function SoundToggle({ language }: { language: Language }) {
  const [on, setOn] = useState<boolean>(() => isSoundEnabled());
  useEffect(() => {
    setOn(isSoundEnabled());
  }, []);

  function toggle() {
    const next = !on;
    setOn(next);
    setSoundEnabled(next);
    if (next) {
      unlockAudio();
      play("success");
    }
  }

  return (
    <button type="button" className="edl-sound" onClick={toggle} aria-pressed={on} title={t(language, "soundHint")}>
      <Icon name={on ? "soundOn" : "soundOff"} size={15} />
      <span>{t(language, on ? "soundOn" : "soundOff")}</span>
    </button>
  );
}
