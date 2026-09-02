import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parseUtmMap(raw: string | undefined): Record<string, { source?: string; medium?: string; campaign?: string; content?: string; term?: string }> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export const config = {
  botToken: required("BOT_TOKEN"),
  webAppUrl: required("WEBAPP_URL"),
  port: Number(process.env.PORT ?? 3000),
  corsOrigin: (process.env.CORS_ORIGIN ?? "").split(",").map((s) => s.trim()).filter(Boolean),

  amocrm: {
    baseUrl: process.env.AMOCRM_BASE_URL ?? "",
    accessToken: process.env.AMOCRM_ACCESS_TOKEN ?? "",
    pipelineId: process.env.AMOCRM_PIPELINE_ID ? Number(process.env.AMOCRM_PIPELINE_ID) : undefined,
    statusIdStand: process.env.AMOCRM_STATUS_ID_STAND ? Number(process.env.AMOCRM_STATUS_ID_STAND) : undefined,
    statusIdGuest: process.env.AMOCRM_STATUS_ID_GUEST ? Number(process.env.AMOCRM_STATUS_ID_GUEST) : undefined,
    fields: {
      position: process.env.AMOCRM_FIELD_POSITION,
      companyName: process.env.AMOCRM_FIELD_COMPANY_NAME,
      companyYears: process.env.AMOCRM_FIELD_COMPANY_YEARS,
      companyActivity: process.env.AMOCRM_FIELD_COMPANY_ACTIVITY,
      spaceNeeded: process.env.AMOCRM_FIELD_SPACE_NEEDED,
      language: process.env.AMOCRM_FIELD_LANGUAGE,
      regType: process.env.AMOCRM_FIELD_REG_TYPE,
      willAttend: process.env.AMOCRM_FIELD_WILL_ATTEND,
      telegramUsername: process.env.AMOCRM_FIELD_TELEGRAM_USERNAME,
      utmSource: process.env.AMOCRM_FIELD_UTM_SOURCE,
      utmMedium: process.env.AMOCRM_FIELD_UTM_MEDIUM,
      utmCampaign: process.env.AMOCRM_FIELD_UTM_CAMPAIGN,
      utmContent: process.env.AMOCRM_FIELD_UTM_CONTENT,
      utmTerm: process.env.AMOCRM_FIELD_UTM_TERM,
    },
  },

  utmMap: parseUtmMap(process.env.UTM_MAP_JSON),
};
