import { t, type Language } from "../i18n";
import { Screen } from "./Screen";

export function Landing({ language, onContinue }: { language: Language; onContinue: () => void }) {
  return (
    <Screen showBrand>
      <div className="landing">
        <p className="landing__kicker">{t(language, "landingKicker")}</p>
        <h1 className="landing__title">{t(language, "landingTitle")}</h1>
        <p className="landing__meta">{t(language, "heroDatePlace")}</p>

        <div className="landing__stats">
          <span className="landing__stat">{t(language, "landingStat1")}</span>
          <span className="landing__stat">{t(language, "landingStat2")}</span>
          <span className="landing__stat">{t(language, "landingStat3")}</span>
        </div>
      </div>

      <div className="actions">
        <button type="button" className="button" onClick={onContinue}>
          {t(language, "landingCta")}
        </button>
      </div>
    </Screen>
  );
}
