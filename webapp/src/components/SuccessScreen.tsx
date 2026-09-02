import { t, type Language } from "../i18n";
import type { RegistrationType } from "../lib/api";
import { ResultScreen } from "./ResultScreen";

export function SuccessScreen({
  language,
  type,
  willAttend,
}: {
  language: Language;
  type: RegistrationType;
  willAttend?: boolean;
}) {
  if (type === "STAND") {
    return <ResultScreen icon="✓" title={t(language, "successStandTitle")} text={t(language, "successStandText")} />;
  }

  return (
    <ResultScreen
      icon={willAttend ? "🎉" : "✓"}
      variant={willAttend ? "gold" : "primary"}
      title={t(language, "successGuestTitle")}
      text={t(language, willAttend ? "successGuestTextAttend" : "successGuestTextNotSure")}
    />
  );
}
