import { languageLabels, type Language } from "../i18n";
import { OptionCard } from "./OptionCard";
import { Screen } from "./Screen";

export function LanguageSelect({ onSelect }: { onSelect: (lang: Language) => void }) {
  return (
    <Screen title="Tilni tanlang / Выберите язык / Choose a language">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(Object.keys(languageLabels) as Language[]).map((lang) => (
          <OptionCard key={lang} title={languageLabels[lang]} onClick={() => onSelect(lang)} />
        ))}
      </div>
    </Screen>
  );
}
