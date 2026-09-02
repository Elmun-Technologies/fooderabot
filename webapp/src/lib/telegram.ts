interface TelegramContact {
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  user_id?: number;
}

/**
 * Payload delivered as the SECOND argument of the `requestContact` callback
 * (see telegram-web-app.js: `callback(requestSent, webViewEvent)`). The shared
 * contact is NOT merged into `initDataUnsafe` — it only lives here, which is
 * why reading `initDataUnsafe.contact` always returned undefined before.
 */
interface ContactRequestEvent {
  status?: string;
  response?: string;
  responseUnsafe?: {
    auth_date?: string | number;
    hash?: string;
    contact?: TelegramContact;
  };
}

interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
    contact?: TelegramContact;
  };
  version: string;
  platform: string;
  colorScheme: "light" | "dark";
  ready: () => void;
  expand: () => void;
  close: () => void;
  openTelegramLink: (link: string) => void;
  showAlert?: (message: string, callback?: () => void) => void;
  /**
   * Bot API 7.2+ — asks the user to share the phone number with the bot.
   * The callback's first argument tells whether the user shared; the second
   * carries the shared contact (`event.responseUnsafe.contact`).
   */
  requestContact?: (
    callback: (isShared: boolean, event?: ContactRequestEvent) => void,
    errorCallback?: (error: unknown) => void,
  ) => void;
  MainButton: {
    text: string;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    setParams: (params: { text?: string; is_active?: boolean }) => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

const noopWebApp: TelegramWebApp = {
  initData: "",
  initDataUnsafe: {},
  version: "0.0",
  platform: "unknown",
  colorScheme: "light",
  ready: () => {},
  expand: () => {},
  close: () => {},
  openTelegramLink: () => {},
  MainButton: {
    text: "",
    show: () => {},
    hide: () => {},
    onClick: () => {},
    offClick: () => {},
    setParams: () => {},
  },
  BackButton: { show: () => {}, hide: () => {}, onClick: () => {}, offClick: () => {} },
};

export const tg: TelegramWebApp =
  typeof window !== "undefined" && window.Telegram?.WebApp ? window.Telegram.WebApp : noopWebApp;

export function initTelegramWebApp() {
  tg.ready();
  tg.expand();
}

/** True when the current Telegram client can share the phone number (Bot API 7.2+). */
export function canRequestPhoneViaTelegram(): boolean {
  return typeof tg.requestContact === "function";
}

function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  return trimmed.startsWith("+") ? trimmed : `+${digits}`;
}

/**
 * Asks Telegram for the user's phone number (1 tap). Resolves with the number
 * or null when unavailable / declined — the manual input stays as the fallback.
 *
 * The shared contact arrives as the callback's SECOND argument
 * (`event.responseUnsafe.contact.phone_number`); `initDataUnsafe` never
 * contains it, so we must not look there.
 */
export function requestPhoneFromTelegram(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!canRequestPhoneViaTelegram()) return resolve(null);
    try {
      tg.requestContact!(
        (isShared, event) => {
          if (!isShared) return resolve(null);
          const phone =
            normalizePhone(event?.responseUnsafe?.contact?.phone_number) ??
            // Belt & braces for clients that do merge it into initDataUnsafe.
            normalizePhone(tg.initDataUnsafe.contact?.phone_number);
          resolve(phone);
        },
        () => resolve(null),
      );
    } catch {
      resolve(null);
    }
  });
}

/** Very loose phone check: 9–15 digits, optional leading +. */
export function isValidPhone(value: string): boolean {
  return /^\+?[\d\s\-()]{9,20}$/.test(value.trim()) && value.replace(/\D/g, "").length >= 9;
}
