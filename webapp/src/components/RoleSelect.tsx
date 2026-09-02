import { t, type Language } from "../i18n";
import type { RegistrationType } from "../lib/api";
import { EVENT } from "../lib/event";
import { Hero } from "./Hero";
import { Screen } from "./Screen";

const BENEFITS = [
  { icon: "↔", labelKey: "benefitPartners" },
  { icon: "▣", labelKey: "benefitProducts" },
  { icon: "◎", labelKey: "benefitMarkets" },
  { icon: "⌁", labelKey: "benefitConnections" },
  { icon: "✦", labelKey: "benefitDirections" },
] as const;

/**
 * The "landing page" of the mini app, mirroring sofexpo.uz/foodera-expo:
 * hero → CTA → trust → market stats → benefits → countries.
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

      {EVENT.scarcity.premiumStandsLeft > 0 ? (
        <p className="scarcity">🔥 {t(language, "scarcityLine").replace("{n}", String(EVENT.scarcity.premiumStandsLeft))}</p>
      ) : null}

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
          <span className="stat__value">$58–78B</span>
          <span className="stat__label">{t(language, "statMarket")}</span>
        </div>
        <div className="stat">
          <span className="stat__value">{t(language, "statRetailValue")}</span>
          <span className="stat__label">{t(language, "statRetailLabel")}</span>
        </div>
        <div className="stat">
          <span className="stat__value">6</span>
          <span className="stat__label">{t(language, "statCountries")}</span>
        </div>
      </div>

      <div className="benefits">
        <p className="section-title">{t(language, "benefitsTitle")}</p>
        <div className="benefits__list">
          {BENEFITS.map((b) => (
            <div className="benefit" key={b.labelKey}>
              <span className="benefit__icon">{b.icon}</span>
              <span>{t(language, b.labelKey)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="countries">
        <p className="section-title">{t(language, "countriesTitle")}</p>
        <div className="countries__flags">
          {EVENT.countries.map((c) => (
            <span className="countries__item" key={c.code}>
              <img src={c.flag} alt={c.code} width={34} height={34} loading="lazy" />
              <span className="countries__code">{c.code}</span>
              <span className="countries__market">{c.market}</span>
            </span>
          ))}
        </div>
      </div>
    </Screen>
  );
}
