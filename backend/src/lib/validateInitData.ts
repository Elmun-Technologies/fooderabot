import crypto from "node:crypto";

export interface TelegramWebAppUser {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface ValidatedInitData {
  user: TelegramWebAppUser;
  authDate: number;
}

const MAX_AGE_SECONDS = 24 * 60 * 60; // Telegram Mini Apps recommend re-checking freshness

/**
 * Validates the `initData` string sent by a Telegram Mini App, per
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Never trust a telegram user id coming from the client without this check -
 * it is the only thing standing between "the API" and "anyone can submit a
 * registration as any Telegram user, or read whether that user already
 * registered".
 */
export function validateInitData(initData: string, botToken: string): ValidatedInitData | null {
  if (!initData) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash.length !== hash.length) return null;
  const valid = crypto.timingSafeEqual(Buffer.from(computedHash, "hex"), Buffer.from(hash, "hex"));
  if (!valid) return null;

  const authDate = Number(params.get("auth_date") ?? 0);
  if (!authDate || Date.now() / 1000 - authDate > MAX_AGE_SECONDS) return null;

  const userRaw = params.get("user");
  if (!userRaw) return null;

  let user: TelegramWebAppUser;
  try {
    user = JSON.parse(userRaw);
  } catch {
    return null;
  }
  if (!user?.id) return null;

  return { user, authDate };
}
