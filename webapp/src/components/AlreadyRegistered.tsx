import { t, type Language } from "../i18n";
import { ResultScreen } from "./ResultScreen";

export function AlreadyRegistered({ language }: { language: Language }) {
  return (
    <ResultScreen
      icon="✓"
      title={t(language, "alreadyRegisteredTitle")}
      text={t(language, "alreadyRegisteredText")}
    />
  );
}
