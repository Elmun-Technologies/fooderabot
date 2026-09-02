import { t, type Language } from "../i18n";
import type { RegistrationType } from "../lib/api";
import { Screen } from "./Screen";

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
    return (
      <Screen>
        <div className="center">
          <div className="badge-icon">✅</div>
          <h1 className="screen__title">{t(language, "successStandTitle")}</h1>
          <p className="screen__subtitle">{t(language, "successStandText")}</p>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <div className="center">
        <div className="badge-icon">{willAttend ? "🎉" : "✅"}</div>
        <h1 className="screen__title">{t(language, "successGuestTitle")}</h1>
        <p className="screen__subtitle">{t(language, willAttend ? "successGuestTextAttend" : "successGuestTextNotSure")}</p>
      </div>
    </Screen>
  );
}
