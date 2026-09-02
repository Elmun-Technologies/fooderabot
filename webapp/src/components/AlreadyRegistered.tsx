import { t, type Language } from "../i18n";
import { buildSummaryRows, type RegistrationDetails } from "../lib/registrationSummary";
import { tg } from "../lib/telegram";
import { ResultScreen } from "./ResultScreen";

export function AlreadyRegistered({ language, details }: { language: Language; details: RegistrationDetails }) {
  return (
    <ResultScreen
      icon="✓"
      title={t(language, "alreadyRegisteredTitle")}
      text={t(language, "alreadyRegisteredText")}
      details={buildSummaryRows(language, details)}
      action={
        <button type="button" className="button button--secondary" onClick={() => tg.close()}>
          {t(language, "closeApp")}
        </button>
      }
    />
  );
}
