import en from "./locales/en.json";
import ru from "./locales/ru.json";
import uz from "./locales/uz.json";

export type Language = "uz" | "ru" | "en";
export type TranslationKey = keyof typeof uz;

const dictionaries: Record<Language, Record<TranslationKey, string>> = { uz, ru, en };

export function t(language: Language, key: TranslationKey): string {
  return dictionaries[language][key] ?? dictionaries.uz[key] ?? key;
}

export const languageLabels: Record<Language, string> = {
  uz: "O'zbekcha",
  ru: "Русский",
  en: "English",
};
