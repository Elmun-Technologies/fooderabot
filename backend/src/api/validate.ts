import type { SubmitRegistrationBody } from "../types";

const LANGUAGES = ["uz", "ru", "en"];
const TYPES = ["STAND", "GUEST"];
const PHONE_RE = /^\+?[\d\s\-()]{9,20}$/;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.trim().length <= 500;
}

function isValidPhone(v: unknown): boolean {
  return typeof v === "string" && PHONE_RE.test(v.trim()) && v.replace(/\D/g, "").length >= 9;
}

/** Returns an error message, or null if the body is valid. */
export function validateSubmitBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return "Invalid body";
  const b = body as Record<string, unknown>;

  if (!TYPES.includes(b.type as string)) return "Invalid registration type";
  if (!LANGUAGES.includes(b.language as string)) return "Invalid language";
  if (!isNonEmptyString(b.position)) return "Position is required";
  if (!isNonEmptyString(b.fullName)) return "Full name is required";

  if (b.phone !== undefined && !isValidPhone(b.phone)) return "Invalid phone number";

  if (b.type === "STAND") {
    if (!isValidPhone(b.phone)) return "Phone number is required for stand registrations";
    if (!isNonEmptyString(b.companyName)) return "Company name is required for stand registrations";
    if (!isNonEmptyString(b.companyYears)) return "Company years is required for stand registrations";
    if (!isNonEmptyString(b.companyActivity)) return "Company activity is required for stand registrations";
    if (!isNonEmptyString(b.spaceNeeded)) return "Booth type is required for stand registrations";
    if (!isNonEmptyString(b.city)) return "City is required for stand registrations";
  }

  if (b.type === "GUEST") {
    if (typeof b.willAttend !== "boolean") return "willAttend is required for guest registrations";
  }

  if (b.companyName !== undefined && typeof b.companyName !== "string") return "Invalid company name";

  if (b.standCode !== undefined && (typeof b.standCode !== "string" || b.standCode.trim().length > 20)) {
    return "Invalid stand code";
  }

  return null;
}

export function toSubmitBody(body: unknown): SubmitRegistrationBody {
  const b = body as Record<string, unknown>;
  return {
    type: b.type as SubmitRegistrationBody["type"],
    language: b.language as SubmitRegistrationBody["language"],
    position: String(b.position).trim(),
    fullName: String(b.fullName).trim(),
    phone: typeof b.phone === "string" && b.phone.trim() ? b.phone.trim() : undefined,
    companyName: b.companyName ? String(b.companyName).trim() : undefined,
    companyYears: b.companyYears ? String(b.companyYears).trim() : undefined,
    companyActivity: b.companyActivity ? String(b.companyActivity).trim() : undefined,
    spaceNeeded: b.spaceNeeded ? String(b.spaceNeeded).trim() : undefined,
    willAttend: typeof b.willAttend === "boolean" ? b.willAttend : undefined,
    city: typeof b.city === "string" && b.city.trim() ? b.city.trim() : undefined,
    standCode: typeof b.standCode === "string" && b.standCode.trim() ? b.standCode.trim() : undefined,
  };
}
