import { t, type Language } from "../i18n";
import { SHARE_URL } from "../lib/event";
import { buildSummaryRows, type RegistrationDetails } from "../lib/registrationSummary";
import { tg } from "../lib/telegram";
import { ResultScreen } from "./ResultScreen";

export function SuccessScreen({
  language,
  details,
}: {
  language: Language;
  details: RegistrationDetails;
}) {
  function share() {
    const text = encodeURIComponent(t(language, "shareText"));
    const url = encodeURIComponent(SHARE_URL);
    tg.openTelegramLink(`https://t.me/share/url?url=${url}&text=${text}`);
  }

  if (details.type === "STAND") {
    return (
      <ResultScreen
        icon="✓"
        title={t(language, "successStandTitle")}
        text={t(language, "successStandText")}
        details={buildSummaryRows(language, details)}
        nextSteps={[
          t(language, "whatNextStand1"),
          t(language, "whatNextStand2"),
          t(language, "whatNextStand3"),
        ]}
        action={
          <>
            <button type="button" className="button" onClick={share}>
              {t(language, "shareButton")}
            </button>
            <button type="button" className="button button--secondary" onClick={() => tg.close()}>
              {t(language, "closeApp")}
            </button>
          </>
        }
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
      nextSteps={
        willAttend
          ? [t(language, "whatNextGuest1"), t(language, "whatNextGuest2"), t(language, "whatNextGuest3")]
          : undefined
      }
      action={
        <>
          <button type="button" className="button" onClick={share}>
            {t(language, "shareButton")}
          </button>
          <button type="button" className="button button--secondary" onClick={() => tg.close()}>
            {t(language, "closeApp")}
          </button>
        </>
      }
    />
  );
}
