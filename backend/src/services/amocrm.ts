import { config } from "../config";
import type { SubmitRegistrationBody } from "../types";

interface CustomFieldValue {
  field_id: number;
  values: { value: string | number }[];
}

function field(fieldIdEnv: string | undefined, value: string | number | undefined | null): CustomFieldValue | null {
  if (!fieldIdEnv || value === undefined || value === null || value === "") return null;
  const field_id = Number(fieldIdEnv);
  if (!Number.isFinite(field_id)) return null;
  return { field_id, values: [{ value }] };
}

interface RegistrationForCrm extends SubmitRegistrationBody {
  telegramId: number;
  telegramUsername?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

function buildLeadName(r: RegistrationForCrm): string {
  const kind = r.type === "STAND" ? "Stend" : "Mehmon";
  const who = r.companyName || r.fullName;
  return `Foodera Expo — ${kind} — ${who}`;
}

function buildNote(r: RegistrationForCrm): string {
  const lines = [
    `Ro'yxatdan o'tish turi: ${r.type === "STAND" ? "Stend bilan qatnashish" : "Mehmon sifatida tashrif"}`,
    `Til: ${r.language}`,
    `Ism Familiya: ${r.fullName}`,
    `Lavozim: ${r.position}`,
    r.phone ? `Telefon: ${r.phone}` : null,
    r.companyName ? `Kompaniya nomi: ${r.companyName}` : null,
    r.companyYears ? `Faoliyat yuritish muddati: ${r.companyYears}` : null,
    r.companyActivity ? `Faoliyat turi: ${r.companyActivity}` : null,
    // New values are booth-type labels ("Premium stend · 18 m²"); legacy rows are plain numbers.
    r.spaceNeeded ? `Stend turi: ${/m²|m2/i.test(r.spaceNeeded) ? r.spaceNeeded : `${r.spaceNeeded} m²`}` : null,
    r.willAttend !== undefined ? `Tadbirga kelishni tasdiqladi: ${r.willAttend ? "Ha" : "Yo'q"}` : null,
    r.telegramUsername ? `Telegram: @${r.telegramUsername}` : `Telegram ID: ${r.telegramId}`,
    r.utmSource ? `UTM source: ${r.utmSource}` : null,
    r.utmMedium ? `UTM medium: ${r.utmMedium}` : null,
    r.utmCampaign ? `UTM campaign: ${r.utmCampaign}` : null,
  ].filter(Boolean);
  return lines.join("\n");
}

async function amoFetch(path: string, init: RequestInit): Promise<any> {
  if (!config.amocrm.baseUrl || !config.amocrm.accessToken) {
    throw new Error("amoCRM is not configured (AMOCRM_BASE_URL / AMOCRM_ACCESS_TOKEN missing)");
  }
  const res = await fetch(`${config.amocrm.baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.amocrm.accessToken}`,
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`amoCRM request failed: ${res.status} ${res.statusText} ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export async function createLeadForRegistration(
  r: RegistrationForCrm,
): Promise<{ leadId: number; contactId?: number }> {
  const f = config.amocrm.fields;

  const leadCustomFields = [
    field(f.position, r.position),
    field(f.phone, r.phone),
    field(f.companyName, r.companyName),
    field(f.companyYears, r.companyYears),
    field(f.companyActivity, r.companyActivity),
    field(f.spaceNeeded, r.spaceNeeded),
    field(f.language, r.language),
    field(f.regType, r.type),
    field(f.willAttend, r.willAttend === undefined ? undefined : r.willAttend ? "Ha" : "Yo'q"),
    field(f.utmSource, r.utmSource),
    field(f.utmMedium, r.utmMedium),
    field(f.utmCampaign, r.utmCampaign),
    field(f.utmContent, r.utmContent),
    field(f.utmTerm, r.utmTerm),
  ].filter((v): v is CustomFieldValue => v !== null);

  const contactCustomFields: (CustomFieldValue | { field_code: string; values: { value: string; enum_code?: string }[] })[] = [
    // Phone goes to amoCRM's built-in PHONE field so it is callable from the lead card.
    ...(r.phone
      ? [{ field_code: "PHONE", values: [{ value: r.phone, enum_code: "WORK" }] }]
      : []),
    field(f.telegramUsername, r.telegramUsername),
  ].filter((v): v is NonNullable<typeof v> => v !== null);

  const statusId = r.type === "STAND" ? config.amocrm.statusIdStand : config.amocrm.statusIdGuest;

  const leadPayload: Record<string, unknown> = {
    name: buildLeadName(r),
    ...(config.amocrm.pipelineId ? { pipeline_id: config.amocrm.pipelineId } : {}),
    ...(statusId ? { status_id: statusId } : {}),
    ...(leadCustomFields.length ? { custom_fields_values: leadCustomFields } : {}),
    _embedded: {
      contacts: [
        {
          name: r.fullName,
          ...(contactCustomFields.length ? { custom_fields_values: contactCustomFields } : {}),
        },
      ],
    },
  };

  const created = await amoFetch("/api/v4/leads", {
    method: "POST",
    body: JSON.stringify([leadPayload]),
  });

  const lead = created?._embedded?.leads?.[0];
  if (!lead?.id) {
    throw new Error(`amoCRM did not return a created lead id: ${JSON.stringify(created)}`);
  }

  const contactId: number | undefined = lead?._embedded?.contacts?.[0]?.id;

  await amoFetch(`/api/v4/leads/${lead.id}/notes`, {
    method: "POST",
    body: JSON.stringify([
      {
        note_type: "common",
        params: { text: buildNote(r) },
      },
    ]),
  }).catch(() => {
    // Note creation failing must never fail the whole registration - the lead
    // itself, with its custom fields, already carries the important data.
  });

  return { leadId: lead.id, contactId };
}
