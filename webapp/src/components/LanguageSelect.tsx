import { languageLabels, t, type Language } from "../i18n";
import { haptics } from "../lib/haptics";
import { play } from "../lib/sound";
import { Row } from "./Row";
import { Screen } from "./Screen";

const OPTIONS: { lang: Language; code: string; native: string }[] = [
  { lang: "uz", code: "UZ", native: languageLabels.uz },
  { lang: "ru", code: "RU", native: languageLabels.ru },
  { lang: "en", code: "EN", native: languageLabels.en },
];

/**
 * Language chooser.
 *
 * Flag *emoji* used to sit here — they render as a letter pair on Windows and
 * in some Telegram clients, which is exactly the kind of detail that makes a
 * page look like a mock-up. Two-letter codes in the brand's own circle are
 * deterministic everywhere. The choice is remembered by the bot as well, so
 * the follow-up messages arrive in the same language.
 */
export function LanguageSelect({ onSelect }: { onSelect: (lang: Language) => void }) {
  return (
    <Screen showBrand heading={t("uz", "languageTitle")} subheading={t("uz", "languageSubtitle")}>
      <div className="row-list">
        {OPTIONS.map((o, i) => (
          <Row
            key={o.lang}
            index={i}
            icon={<span className="lang-code">{o.code}</span>}
            title={o.native}
            desc={t("uz", "languageNote")}
            onClick={() => {
              haptics.select();
              play("tap");
              onSelect(o.lang);
            }}
          />
        ))}
      </div>
    </Screen>
  );
}
