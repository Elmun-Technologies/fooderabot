import { t, type Language } from "../i18n";
import type { RegistrationType } from "../lib/api";
import { EVENT } from "../lib/event";
import { Hero } from "./Hero";
import { Screen } from "./Screen";

/**
 * The "landing page" of the mini app: brand, event facts, social proof,
 * and the single most important question — stand or guest.
 */
export function RoleSelect({
  language,
  onBack,
  onSelect,
}: {
  language: Language;
  onBack: () => void;
  onSelect: (role: RegistrationType) => void;
}) {
  return (
    <Screen onBack={onBack}>
      <Hero language={language} />

      <h1 className="heading heading--compact">{t(language, "roleTitle")}</h1>

      <div className="role-cards">
        <button type="button" className="role-card" onClick={() => onSelect("STAND")}>
          <span className="role-card__icon">🏢</span>
          <span className="role-card__body">
            <span className="role-card__title">{t(language, "roleStand")}</span>
            <span className="role-card__desc">{t(language, "roleStandDesc")}</span>
            <span className="role-card__hint">📋 {t(language, "roleStandHint")}</span>
          </span>
          <span className="role-card__chevron">›</span>
        </button>

        <button type="button" className="role-card role-card--guest" onClick={() => onSelect("GUEST")}>
          <span className="role-card__icon">🎟</span>
          <span className="role-card__body">
            <span className="role-card__title">{t(language, "roleGuest")}</span>
            <span className="role-card__desc">{t(language, "roleGuestDesc")}</span>
            <span className="role-card__hint">🎟 {t(language, "roleGuestHint")}</span>
          </span>
          <span className="role-card__chevron">›</span>
        </button>
      </div>

      <p className="trust">{t(language, "trustLine")}</p>

      <div className="stats">
        <div className="stat">
          <span className="stat__value">125M+</span>
          <span className="stat__label">{t(language, "statConsumers")}</span>
        </div>
        <div className="stat">
          <span className="stat__value">6</span>
          <span className="stat__label">{t(language, "statCountries")}</span>
        </div>
        <div className="stat">
          <span className="stat__value">$58–78B</span>
          <span className="stat__label">{t(language, "statMarket")}</span>
        </div>
      </div>

      <div className="countries">
        <p className="countries__title">{t(language, "countriesTitle")}</p>
        <div className="countries__flags">
          {EVENT.countries.map((c) => (
            <span className="countries__item" key={c.code}>
              <img src={c.flag} alt={c.code} width={30} height={30} loading="lazy" />
              <span>{c.code}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="gallery">
        <p className="gallery__title">{t(language, "galleryTitle")}</p>
        <div className="gallery__strip">
          {EVENT.gallery.map((src) => (
            <img src={src} alt="" key={src} loading="lazy" />
          ))}
        </div>
      </div>
    </Screen>
  );
}
