export type RegistrationType = "STAND" | "GUEST";
export type Language = "uz" | "ru" | "en";

export interface SubmitRegistrationBody {
  type: RegistrationType;
  language: Language;
  position: string;
  fullName: string;
  /** Required for STAND, optional for GUEST. E.164-ish free form, 9–15 digits. */
  phone?: string;
  companyName?: string;
  companyYears?: string;
  companyActivity?: string;
  /** Booth type label, e.g. "Premium stend · 18 m²" (legacy rows: plain number). */
  spaceNeeded?: string;
  willAttend?: boolean;
  /** Stage-2: city the company operates from (STAND only, required). */
  city?: string;
  /** The exact booth picked on the real floor plan (Stand.code), STAND only, optional. */
  standCode?: string;
}
