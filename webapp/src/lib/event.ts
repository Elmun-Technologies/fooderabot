import type { Language, TranslationKey } from "../i18n";
import { t } from "../i18n";

/** Event facts mirrored from sofexpo.uz/foodera-expo */
export const EVENT = {
  /** Organizer contact (from sofexpo.uz). */
  contact: {
    phone: "+998 55 705 0 705",
    phoneHref: "tel:+998557050705",
    telegram: "https://t.me/sofexpo",
  },
} as const;

export interface OptionDef {
  key: string;
  labelKey: TranslationKey;
}

/** Business categories — mirrors the categories on sofexpo.uz/foodera-expo. */
export const CATEGORY_OPTIONS: OptionDef[] = [
  { key: "drinks", labelKey: "catDrinks" },
  { key: "tea_coffee", labelKey: "catTeaCoffee" },
  { key: "grocery", labelKey: "catGrocery" },
  { key: "confectionery", labelKey: "catConfectionery" },
  { key: "dairy", labelKey: "catDairy" },
  { key: "meat", labelKey: "catMeat" },
  { key: "frozen", labelKey: "catFrozen" },
  { key: "canned", labelKey: "catCanned" },
  { key: "oil_sauces", labelKey: "catOilSauces" },
  { key: "deli", labelKey: "catDeli" },
  { key: "organic", labelKey: "catOrganic" },
  { key: "equipment", labelKey: "catEquipment" },
  { key: "other", labelKey: "catOther" },
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
  { key: "premium", labelKey: "standPremium" },
  { key: "standard", labelKey: "standStandard" },
  { key: "area", labelKey: "standArea" },
  { key: "unsure", labelKey: "standUnsure" },
];

/** Stage-2: home city — used both by the form and by the lead scoring engine
 *  (Tashkent and Samarkand count as "home market" and bump the score by 5). */
export const CITY_OPTIONS: OptionDef[] = [
  { key: "Toshkent", labelKey: "cityTashkent" },
  { key: "Samarqand", labelKey: "citySamarkand" },
  { key: "Buxoro", labelKey: "cityBukhara" },
  { key: "Andijon", labelKey: "cityAndijan" },
  { key: "Farg'ona", labelKey: "cityFergana" },
  { key: "Namangan", labelKey: "cityNamangan" },
  { key: "Boshqa", labelKey: "cityOther" },
];

/** Localized label of an option (what the user saw — stored in the DB/CRM as-is). */
export function optionLabel(language: Language, option: OptionDef): string {
  return t(language, option.labelKey);
}

/** Link used by the "share with friends" button (override with VITE_SHARE_URL). */
export const SHARE_URL = import.meta.env.VITE_SHARE_URL ?? "https://t.me/FooderaExpoBot";
