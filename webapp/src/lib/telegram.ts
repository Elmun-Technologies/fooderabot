interface TelegramContact {
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  user_id?: number;
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
  /** Bot API 7.2+ — asks the user to share the phone number with the bot. */
  requestContact?: (callback: (isShared: boolean) => void, errorCallback?: (error: unknown) => void) => void;
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

/**
 * Asks Telegram for the user's phone number (1 tap). Resolves with the number
 * or null when unavailable / declined — the manual input stays as the fallback.
 */
export function requestPhoneFromTelegram(): Promise<string | null> {
  return new Promise((resolve) => {
    if (typeof tg.requestContact !== "function") return resolve(null);
    try {
      tg.requestContact(
        () => {
          // The shared contact appears in initDataUnsafe after the callback.
          const phone = tg.initDataUnsafe.contact?.phone_number;
          resolve(phone ? (phone.startsWith("+") ? phone : `+${phone}`) : null);
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
