import { t, type Language } from "../i18n";
import { EVENT, daysUntilEvent } from "../lib/event";

/** Branded hero card with the event photo, logo, dates and countdown. */
export function Hero({ language }: { language: Language }) {
  const days = daysUntilEvent();
  const showCountdown = days > 0 && days < 400;

  return (
    <div className="hero">
      <img className="hero__photo" src={EVENT.heroImage} alt={EVENT.name} loading="eager" />
      <div className="hero__overlay" />
      <div className="hero__content">
        <img className="hero__logo" src="/logo.png" alt={EVENT.name} width={40} height={40} />
        <p className="hero__tagline">{t(language, "heroTagline")}</p>
        <div className="hero__meta">
          <span className="hero__pill">📅 {t(language, "heroDatePlace")}</span>
        </div>
        {showCountdown ? (
          <div className="hero__countdown">⏳ {t(language, "daysLeft").replace("{n}", String(days))}</div>
        ) : null}
      </div>
    </div>
  );
}
