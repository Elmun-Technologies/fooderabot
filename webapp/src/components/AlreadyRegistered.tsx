import { t, type Language } from "../i18n";
import type { RegistrationType } from "../lib/api";
import { ResultScreen } from "./ResultScreen";

export function AlreadyRegistered({
  language,
  details,
}: {
  language: Language;
  details: { type?: RegistrationType; fullName?: string; position?: string; companyName?: string };
}) {
  const rows = [
    details.fullName ? { label: t(language, "fullName"), value: details.fullName } : null,
    details.position ? { label: t(language, "position"), value: details.position } : null,
    details.companyName ? { label: t(language, "companyName"), value: details.companyName } : null,
    details.type
      ? { label: t(language, "summaryType"), value: t(language, details.type === "STAND" ? "typeStand" : "typeGuest") }
      : null,
  ].filter((r): r is { label: string; value: string } => r !== null);

  return (
    <ResultScreen
      icon="✓"
      title={t(language, "alreadyRegisteredTitle")}
      text={t(language, "alreadyRegisteredText")}
      details={rows}
    />
  );
}
