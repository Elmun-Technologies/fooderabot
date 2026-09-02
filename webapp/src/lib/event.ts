import type { Language, TranslationKey } from "../i18n";
import { t } from "../i18n";

/** Event facts mirrored from sofexpo.uz/foodera-expo */
export const EVENT = {
  name: "FOODERA EXPO 2026",
  /** Local time, Samarkand */
  startDate: new Date("2026-10-20T00:00:00+05:00"),
  heroImage: "assets/gallery/gallery-2.jpg",
  gallery: [
    "assets/gallery/gallery-1.jpg",
    "assets/gallery/gallery-2.jpg",
    "assets/gallery/gallery-3.jpg",
    "assets/gallery/gallery-4.jpg",
  ],
  countries: [
    { code: "UZ", flag: "assets/flags/uz.png" },
    { code: "KZ", flag: "assets/flags/kz.png" },
    { code: "KG", flag: "assets/flags/kg.png" },
    { code: "TJ", flag: "assets/flags/tj.png" },
    { code: "TM", flag: "assets/flags/tm.png" },
    { code: "AF", flag: "assets/flags/af.png" },
  ],
} as const;

/** Days until the expo starts; negative once it has started. */
export function daysUntilEvent(): number {
  const ms = EVENT.startDate.getTime() - Date.now();
  return Math.ceil(ms / 86_400_000);
}

export interface OptionDef {
  key: string;
  icon?: string;
  labelKey: TranslationKey;
}

/** Business categories — mirrors the categories on sofexpo.uz/foodera-expo. */
export const CATEGORY_OPTIONS: OptionDef[] = [
  { key: "drinks", icon: "🥤", labelKey: "catDrinks" },
  { key: "tea_coffee", icon: "☕", labelKey: "catTeaCoffee" },
  { key: "grocery", icon: "🫙", labelKey: "catGrocery" },
  { key: "confectionery", icon: "🍰", labelKey: "catConfectionery" },
  { key: "dairy", icon: "🧀", labelKey: "catDairy" },
  { key: "meat", icon: "🍗", labelKey: "catMeat" },
  { key: "frozen", icon: "❄️", labelKey: "catFrozen" },
  { key: "canned", icon: "🥫", labelKey: "catCanned" },
  { key: "oil_sauces", icon: "🫒", labelKey: "catOilSauces" },
  { key: "deli", icon: "🍽", labelKey: "catDeli" },
  { key: "organic", icon: "🌿", labelKey: "catOrganic" },
  { key: "equipment", icon: "📦", labelKey: "catEquipment" },
  { key: "other", icon: "❓", labelKey: "catOther" },
];

export const POSITION_OPTIONS: OptionDef[] = [
  { key: "director", labelKey: "posDirector" },
  { key: "marketing", labelKey: "posMarketing" },
  { key: "pr", labelKey: "posPr" },
  { key: "export", labelKey: "posExport" },
  { key: "purchase", labelKey: "posPurchase" },
  { key: "other", labelKey: "posOther" },
];

export const YEARS_OPTIONS: OptionDef[] = [
  { key: "under_1", labelKey: "yearsUnder1" },
  { key: "1_3", labelKey: "years1to3" },
  { key: "3_10", labelKey: "years3to10" },
  { key: "10_plus", labelKey: "years10plus" },
];

export const STAND_TYPE_OPTIONS: OptionDef[] = [
  { key: "premium", icon: "✨", labelKey: "standPremium" },
  { key: "standard", icon: "🏢", labelKey: "standStandard" },
  { key: "area", icon: "📐", labelKey: "standArea" },
  { key: "unsure", icon: "💬", labelKey: "standUnsure" },
];

/** Localized label of an option (what the user saw — stored in the DB/CRM as-is). */
export function optionLabel(language: Language, option: OptionDef): string {
  return t(language, option.labelKey);
}

/** Link used by the "share with friends" button (override with VITE_SHARE_URL). */
export const SHARE_URL = import.meta.env.VITE_SHARE_URL ?? "https://t.me/FooderaExpoBot";
