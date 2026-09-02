import { config } from "../config";

export interface UtmValues {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

/**
 * Telegram deep links only give us a single opaque "start payload" (max 64
 * chars, [A-Za-z0-9_-] only) - there is no way to pass real ?utm_source=...
 * query params to a bot the way you can to a website. So marketing links look
 * like t.me/FooderaExpoBot?start=<code> and we resolve <code> to UTM values
 * via, in order:
 *   1. UTM_MAP_JSON lookup (admin-defined short codes, e.g. "ig" -> {...})
 *   2. the "source__medium__campaign" convention (double underscore separated)
 *   3. otherwise the whole payload is used as the raw utm_source
 */
export function resolveUtmFromStartPayload(payload: string | undefined): UtmValues {
  if (!payload) return {};

  const mapped = config.utmMap[payload];
  if (mapped) {
    return {
      utmSource: mapped.source,
      utmMedium: mapped.medium,
      utmCampaign: mapped.campaign,
      utmContent: mapped.content,
      utmTerm: mapped.term,
    };
  }

  if (payload.includes("__")) {
    const [source, medium, campaign] = payload.split("__");
    return {
      utmSource: source || undefined,
      utmMedium: medium || undefined,
      utmCampaign: campaign || undefined,
    };
  }

  return { utmSource: payload };
}
