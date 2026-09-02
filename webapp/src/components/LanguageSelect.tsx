import { t, type Language } from "../i18n";
import { Row } from "./Row";
import { Screen } from "./Screen";

const OPTIONS: { lang: Language; flag: string; label: string }[] = [
  { lang: "uz", flag: "🇺🇿", label: "O'zbekcha" },
  { lang: "ru", flag: "🇷🇺", label: "Русский" },
  { lang: "en", flag: "🇬🇧", label: "English" },
];

export function LanguageSelect({ onSelect }: { onSelect: (lang: Language) => void }) {
  return (
    <Screen showBrand heading={t("uz", "languageTitle")} subheading={t("uz", "languageSubtitle")}>
      <div className="row-list">
        {OPTIONS.map((o) => (
          <Row key={o.lang} icon={o.flag} title={o.label} onClick={() => onSelect(o.lang)} />
        ))}
      </div>
    </Screen>
  );
}
