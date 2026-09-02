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
  };
  ready: () => void;
  expand: () => void;
  close: () => void;
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
  };
  colorScheme: "light" | "dark";
}

declare global {
  interface Window {
    Telegram?: { WebApp: TelegramWebApp };
  }
}

const noopWebApp: TelegramWebApp = {
  initData: "",
  initDataUnsafe: {},
  ready: () => {},
  expand: () => {},
  close: () => {},
  MainButton: {
    text: "",
    show: () => {},
    hide: () => {},
    onClick: () => {},
    offClick: () => {},
    setParams: () => {},
  },
  BackButton: { show: () => {}, hide: () => {}, onClick: () => {}, offClick: () => {} },
  colorScheme: "light",
};

export const tg: TelegramWebApp = typeof window !== "undefined" && window.Telegram?.WebApp ? window.Telegram.WebApp : noopWebApp;

export function initTelegramWebApp() {
  tg.ready();
  tg.expand();
}
