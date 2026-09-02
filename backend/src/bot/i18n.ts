import type { Language, RegistrationType } from "../types";

export const botText = {
  welcomeMultilang: [
    "🇺🇿 Assalomu alaykum! Foodera Expo ro'yxatdan o'tish botiga xush kelibsiz.",
    "🇷🇺 Здравствуйте! Добро пожаловать в бот регистрации Foodera Expo.",
    "🇬🇧 Hello! Welcome to the Foodera Expo registration bot.",
  ].join("\n\n"),

  openApp: {
    uz: "Ro'yxatdan o'tish uchun quyidagi tugmani bosing 👇",
    ru: "Нажмите кнопку ниже, чтобы зарегистрироваться 👇",
    en: "Tap the button below to register 👇",
  } satisfies Record<Language, string>,

  openAppButton: "📝 Ro'yxatdan o'tish / Регистрация / Register",

  alreadyRegistered: {
    uz: "Siz allaqachon ro'yxatdan o'tgansiz ✅ Tez orada operatorlarimiz siz bilan bog'lanadi.",
    ru: "Вы уже зарегистрированы ✅ Наш оператор скоро свяжется с вами.",
    en: "You are already registered ✅ Our team will contact you shortly.",
  } satisfies Record<Language, string>,

  confirmed(type: RegistrationType, language: Language, willAttend?: boolean): string {
    if (type === "STAND") {
      const msg: Record<Language, string> = {
        uz: "✅ Arizangiz qabul qilindi! Foodera Expo'da stend bilan qatnashish bo'yicha operatorlarimiz tez orada siz bilan bog'lanadi.",
        ru: "✅ Ваша заявка принята! Наш оператор свяжется с вами по поводу участия со стендом на Foodera Expo.",
        en: "✅ Your application has been received! Our team will contact you shortly about exhibiting a stand at Foodera Expo.",
      };
      return msg[language];
    }

    const badge: Record<Language, string> = {
      uz: willAttend
        ? "✅ Rahmat! Siz uchun maxsus beydjik tayyorlaymiz — tadbir kuni sizni kutamiz 🎉"
        : "✅ Ma'lumotlaringiz qabul qilindi. Fikringizni o'zgartirsangiz, botga qayta murojaat qilishingiz mumkin.",
      ru: willAttend
        ? "✅ Спасибо! Мы подготовим для вас специальный бейдж — ждём вас в день мероприятия 🎉"
        : "✅ Ваши данные приняты. Если передумаете — просто напишите нам снова.",
      en: willAttend
        ? "✅ Thank you! We'll prepare a special badge for you — see you on the event day 🎉"
        : "✅ Your details have been received. If you change your mind, just message us again.",
    };
    return badge[language];
  },
};
