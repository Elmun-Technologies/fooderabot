import { t, type Language } from "../i18n";
import { Screen } from "./Screen";

export function AlreadyRegistered({ language }: { language: Language }) {
  return (
    <Screen>
      <div className="center">
        <div className="badge-icon">✅</div>
        <h1 className="screen__title">{t(language, "alreadyRegisteredTitle")}</h1>
        <p className="screen__subtitle">{t(language, "alreadyRegisteredText")}</p>
      </div>
    </Screen>
  );
}
