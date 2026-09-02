import type { Language, RegistrationType } from "../types";

export const botText = {
  chooseLanguage: "🇺🇿 Tilni tanlang / 🇷🇺 Выберите язык / 🇬🇧 Choose your language",

  warmup(language: Language): string {
    const msg: Record<Language, string> = {
      uz: "FOODERA EXPO 2026 — Markaziy Osiyodagi eng yirik oziq-ovqat va ichimlik ko'rgazmasi.\n\n📅 20–22 oktabr, 2026\n📍 SOF EXPO, Samarqand\n👥 125M+ iste'molchi bozori, 6 mamlakat, $58–78 mlrd bozor hajmi\n\nBu yerda yetkazib beruvchilar, ishlab chiqaruvchilar va xaridorlar bir joyda uchrashadi. Ro'yxatdan o'tish atigi 30 sekunda — hoziroq boshlaymizmi?",
      ru: "FOODERA EXPO 2026 — крупнейшая продовольственная выставка Центральной Азии.\n\n📅 20–22 октября 2026\n📍 SOF EXPO, Самарканд\n👥 Рынок с 125M+ потребителей, 6 стран, объём $58–78 млрд\n\nЗдесь встречаются поставщики, производители и байеры. Регистрация — всего 30 секунд, начнём?",
      en: "FOODERA EXPO 2026 — Central Asia's major food & beverage expo.\n\n📅 October 20–22, 2026\n📍 SOF EXPO, Samarkand\n👥 A market of 125M+ consumers, 6 countries, $58–78B market size\n\nSuppliers, producers and buyers meet here in one place. Registration takes 30 seconds — shall we start?",
    };
    return msg[language];
  },

  openApp: {
    uz: "Ro'yxatdan o'tish 30 sekunda — hozir to'lov yo'q 👇",
    ru: "Регистрация за 30 секунд — без оплаты 👇",
    en: "Registration takes 30 seconds — no charge 👇",
  } satisfies Record<Language, string>,

  openAppButton: {
    uz: "📝 Ro'yxatdan o'tish",
    ru: "📝 Регистрация",
    en: "📝 Register",
  } satisfies Record<Language, string>,

  alreadyRegistered: {
    uz: "Siz allaqachon ro'yxatdan o'tgansiz ✅ Ko'rishguncha — 20–22 oktabr, SOF EXPO, Samarqand!",
    ru: "Вы уже зарегистрированы ✅ До встречи — 20–22 октября, SOF EXPO, Самарканд!",
    en: "You are already registered ✅ See you October 20–22 at SOF EXPO, Samarkand!",
  } satisfies Record<Language, string>,

  confirmed(type: RegistrationType, language: Language, willAttend?: boolean): string {
    if (type === "STAND") {
      const msg: Record<Language, string> = {
        uz: "✅ Arizangiz qabul qilindi!\n\n🗂 Operatorlarimiz 24 soat ichida narxlar, bo'sh joylar va stend joylashuvi (PDF) bilan siz bilan bog'lanadi.\n\n📅 FOODERA EXPO 2026 — 20–22 oktabr, SOF EXPO, Samarqand",
        ru: "✅ Ваша заявка принята!\n\n🗂 В течение 24 часов менеджер свяжется с вами: цены, свободные места и план площадки (PDF).\n\n📅 FOODERA EXPO 2026 — 20–22 октября, SOF EXPO, Самарканд",
        en: "✅ Your application has been received!\n\n🗂 Our manager will contact you within 24 hours with pricing, available spots and the floor plan (PDF).\n\n📅 FOODERA EXPO 2026 — October 20–22, SOF EXPO, Samarkand",
      };
      return msg[language];
    }

    const badge: Record<Language, string> = {
      uz: willAttend
        ? "✅ Rahmat! Siz uchun maxsus beydjik tayyorlaymiz.\n\n📅 20–22 oktabr — SOF EXPO, Samarqandda sizni kutamiz 🎉"
        : "✅ Ma'lumotlaringiz qabul qilindi. Fikringizni o'zgartirsangiz, botga qayta murojaat qilishingiz mumkin.",
      ru: willAttend
        ? "✅ Спасибо! Приготовим для вас именной бейдж.\n\n📅 Ждём вас 20–22 октября в SOF EXPO, Самарканд 🎉"
        : "✅ Ваши данные приняты. Если передумаете — просто напишите нам снова.",
      en: willAttend
        ? "✅ Thank you! We'll prepare your personal badge.\n\n📅 See you October 20–22 at SOF EXPO, Samarkand 🎉"
        : "✅ Your details have been received. If you change your mind, just message us again.",
    };
    return badge[language];
  },
};
