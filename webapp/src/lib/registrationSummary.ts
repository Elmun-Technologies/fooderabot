import { t, type Language } from "../i18n";
import type { RegistrationType } from "./api";

export interface RegistrationDetails {
  type?: RegistrationType;
  fullName?: string;
  position?: string;
  companyName?: string;
  companyYears?: string;
  companyActivity?: string;
  spaceNeeded?: string;
  willAttend?: boolean;
  phone?: string;
}

export function buildSummaryRows(language: Language, d: RegistrationDetails): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];

  if (d.type) rows.push({ label: t(language, "summaryType"), value: t(language, d.type === "STAND" ? "typeStand" : "typeGuest") });
  if (d.fullName) rows.push({ label: t(language, "fullName"), value: d.fullName });
  if (d.position) rows.push({ label: t(language, "positionTitle"), value: d.position });
  if (d.companyName) rows.push({ label: t(language, "companyName"), value: d.companyName });
  if (d.phone) rows.push({ label: t(language, "summaryPhone"), value: d.phone });

  if (d.type === "STAND") {
    if (d.companyYears) rows.push({ label: t(language, "shortCompanyYears"), value: d.companyYears });
    if (d.companyActivity) rows.push({ label: t(language, "shortCompanyActivity"), value: d.companyActivity });
    if (d.spaceNeeded) {
      // New values are labels like "Premium stend · 18 m²"; legacy rows are plain numbers ("12").
      const value = /m²|m2/i.test(d.spaceNeeded) ? d.spaceNeeded : `${d.spaceNeeded} m²`;
      rows.push({ label: t(language, "shortSpaceNeeded"), value });
    }
  }

  if (d.type === "GUEST" && d.willAttend !== undefined) {
    rows.push({ label: t(language, "shortWillAttend"), value: t(language, d.willAttend ? "yes" : "no") });
  }

  return rows;
}
