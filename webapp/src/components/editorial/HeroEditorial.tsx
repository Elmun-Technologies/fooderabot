import { useEffect, useState } from "react";
import { t, type Language } from "../../i18n";
import { haptics } from "../../lib/haptics";
import { play, unlockAudio } from "../../lib/sound";
import { Reveal } from "./Reveal";

const EVENT_START_MS = new Date("2026-10-20T09:00:00+05:00").getTime();

function useCountdown() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, EVENT_START_MS - now);
  return {
    d: Math.floor(diff / 86_400_000),
    h: Math.floor((diff % 86_400_000) / 3_600_000),
    m: Math.floor((diff % 3_600_000) / 60_000),
  };
}

interface HeroEditorialProps {
  language: Language;
  onPrimary: () => void;
  onSecondary: () => void;
}

/**
 * Editorial B2B hero: deep navy + warm gold, asymmetric, single confident
 * headline, dual CTA (primary "Book a stand" + secondary "Talk to a
 * manager"). Background art is the existing hero illustration, dimmed
 * and graded navy for the dark surface.
 */
export function HeroEditorial({ language, onPrimary, onSecondary }: HeroEditorialProps) {
  const { d, h, m } = useCountdown();
  return (
    <section className="edl-hero">
      <img className="edl-hero__art" src="/assets/hero-illustration.jpg" alt="" draggable={false} />
      <div className="edl-hero__scrim" aria-hidden="true" />
      <div className="edl__container">
        <Reveal>
          <div className="edl-hero__top">
            <div className="edl-hero__brand">
              <img className="edl-hero__logo" src="/logo.png" alt="FOODERA EXPO 2026" />
              <span>FOODERA</span>
            </div>
            <span className="edl-hero__date">{t(language, "heroEventDate")}</span>
          </div>
        </Reveal>

        <Reveal delay={1}>
          <p className="edl__eyebrow">{t(language, "landingKicker")}</p>
        </Reveal>

        <Reveal delay={2}>
          <h1 className="edl-hero__title">{t(language, "landingTitleEditorial")}</h1>
        </Reveal>

        <Reveal delay={3}>
          <p className="edl-hero__sub">{t(language, "landingSubtitle")}</p>
        </Reveal>

        <Reveal delay={4}>
          <div className="edl-countdown" role="timer" aria-label={t(language, "cdLabel")}>
            <span className="edl-countdown__label">{t(language, "cdLabel")}</span>
            <div className="edl-countdown__cell">
              <span className="edl-countdown__num">{d}</span>
              <span className="edl-countdown__lbl">{t(language, "cdDays")}</span>
            </div>
            <div className="edl-countdown__sep" aria-hidden="true" />
            <div className="edl-countdown__cell">
              <span className="edl-countdown__num">{String(h).padStart(2, "0")}</span>
              <span className="edl-countdown__lbl">{t(language, "cdHours")}</span>
            </div>
            <div className="edl-countdown__sep" aria-hidden="true" />
            <div className="edl-countdown__cell">
              <span className="edl-countdown__num">{String(m).padStart(2, "0")}</span>
              <span className="edl-countdown__lbl">{t(language, "cdMins")}</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={4}>
          <div className="edl-hero__ctas">
            <button
              type="button"
              className="edl-btn edl-btn--primary edl-btn--full"
              onClick={() => {
                haptics.confirm();
                unlockAudio();
                play("tap");
                onPrimary();
              }}
            >
              {t(language, "landingCtaPrimary")}
            </button>
            <button
              type="button"
              className="edl-btn edl-btn--secondary edl-btn--full"
              onClick={() => {
                haptics.tap();
                onSecondary();
              }}
            >
              {t(language, "landingCtaSecondary")}
            </button>
            <p className="edl-hero__trust">{t(language, "landingTrust")}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
