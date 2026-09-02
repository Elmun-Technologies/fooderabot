export type RegistrationType = "STAND" | "GUEST";
export type Language = "uz" | "ru" | "en";

export interface SubmitRegistrationBody {
  type: RegistrationType;
  language: Language;
  position: string;
  fullName: string;
  companyName?: string;
  companyYears?: string;
  companyActivity?: string;
  spaceNeeded?: string;
  willAttend?: boolean;
}
