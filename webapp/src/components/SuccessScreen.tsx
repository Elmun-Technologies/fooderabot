import { t, type Language } from "../i18n";
import { buildSummaryRows, type RegistrationDetails } from "../lib/registrationSummary";
import { ResultScreen } from "./ResultScreen";

export function SuccessScreen({
  language,
  details,
}: {
  language: Language;
  details: RegistrationDetails;
}) {
  if (details.type === "STAND") {
    return (
      <ResultScreen
        icon="✓"
        title={t(language, "successStandTitle")}
        text={t(language, "successStandText")}
        details={buildSummaryRows(language, details)}
      />
    );
  }

  const willAttend = details.willAttend;
  return (
    <ResultScreen
      icon={willAttend ? "🎉" : "✓"}
      variant={willAttend ? "gold" : "primary"}
      title={t(language, "successGuestTitle")}
      text={t(language, willAttend ? "successGuestTextAttend" : "successGuestTextNotSure")}
      details={buildSummaryRows(language, details)}
    />
  );
}
