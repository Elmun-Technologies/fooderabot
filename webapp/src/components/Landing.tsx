import { useEffect, useState } from "react";
import { t, type Language } from "../i18n";
import { IconBuyers, IconExport, IconHandshake } from "./Icons";

const EVENT_START_MS = new Date("2026-10-20T09:00:00+05:00").getTime();
const FLAGS = ["uz", "kz", "kg", "tj", "tm", "af"] as const;

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

/**
 * First screen = event landing: brand hero over the expo illustration, live
 * countdown, social proof (market stats + the six country flags) and three
 * concrete reasons to join, then a single confident CTA.
 */
export function Landing({ language, onContinue }: { language: Language; onContinue: () => void }) {
  const { d, h, m } = useCountdown();

  return (
    <div className="screen landing">
      <div className="hero">
        <img className="hero__art" src="/assets/hero-illustration.jpg" alt="" draggable={false} />
        <div className="hero__scrim" />
        <div className="hero__top">
          <span className="hero__logo">
            <img src="/logo.png" alt="FOODERA EXPO 2026" />
          </span>
        </div>
        <div className="hero__body">
          <p className="hero__kicker">{t(language, "landingKicker")}</p>
          <h1 className="hero__title">{t(language, "landingTitle")}</h1>
          <div className="hero__meta">
            <span className="pill">📅 {t(language, "dateShort")}</span>
            <span className="pill">📍 {t(language, "venueShort")}</span>
          </div>
          <div className="countdown" role="timer" aria-label={t(language, "cdLabel")}>
            <div className="countdown__cell">
              <b>{d}</b>
              <i>{t(language, "cdDays")}</i>
            </div>
            <div className="countdown__sep" />
            <div className="countdown__cell">
              <b>{String(h).padStart(2, "0")}</b>
              <i>{t(language, "cdHours")}</i>
            </div>
            <div className="countdown__sep" />
            <div className="countdown__cell">
              <b>{String(m).padStart(2, "0")}</b>
              <i>{t(language, "cdMins")}</i>
            </div>
          </div>
          <p className="countdown__label">{t(language, "cdLabel")}</p>
        </div>
      </div>

      <div className="landing__body">
        <div className="stats">
          <div className="stat">
            <b>{t(language, "stat1Value")}</b>
            <i>{t(language, "stat1Label")}</i>
          </div>
          <div className="stat">
            <b>{t(language, "stat2Value")}</b>
            <i>{t(language, "stat2Label")}</i>
          </div>
          <div className="stat">
            <b>{t(language, "stat3Value")}</b>
            <i>{t(language, "stat3Label")}</i>
          </div>
        </div>

        <div className="flags">
          <div className="flags__row">
            {FLAGS.map((f) => (
              <img key={f} src={`/assets/flags/${f}.png`} alt={f.toUpperCase()} loading="lazy" />
            ))}
          </div>
          <span>{t(language, "flagsLabel")}</span>
        </div>

        <h2 className="why__title">{t(language, "whyTitle")}</h2>
        <div className="why">
          <div className="why__card">
            <span className="why__icon why__icon--blue">
              <IconBuyers />
            </span>
            <b>{t(language, "why1Title")}</b>
            <i>{t(language, "why1Text")}</i>
          </div>
          <div className="why__card">
            <span className="why__icon why__icon--gold">
              <IconHandshake />
            </span>
            <b>{t(language, "why2Title")}</b>
            <i>{t(language, "why2Text")}</i>
          </div>
          <div className="why__card">
            <span className="why__icon why__icon--green">
              <IconExport />
            </span>
            <b>{t(language, "why3Title")}</b>
            <i>{t(language, "why3Text")}</i>
          </div>
        </div>
      </div>

      <div className="actions landing__cta">
        <button type="button" className="button button--big" onClick={onContinue}>
          {t(language, "landingCta")}
        </button>
        <p className="actions__trust">{t(language, "submitTrust")}</p>
      </div>
    </div>
  );
}
