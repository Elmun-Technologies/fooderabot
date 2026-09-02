import type { Language } from "../i18n";

/**
 * Long-form editorial content for the landing page.
 *
 * Why this file exists next to `src/i18n/locales/*.json`: the locale files
 * hold UI strings (buttons, questions, labels) that are short and shared
 * between screens. The sections below are *content* — an agenda, an audience
 * list, a floor plan — that belongs to the data it describes. Keeping the
 * triple (uz/ru/en) next to the item means nobody can translate the title and
 * forget the body, and `scripts/check-i18n.mjs` enforces that every Loc here
 * carries all three languages.
 *
 * Facts policy: every number below is either (a) taken from the organiser's
 * own published material (sofexpo.uz/foodera-expo) or (b) computed at runtime
 * from the database (`lib/live.ts`). Nothing is invented for decoration.
 */

export interface Loc {
  uz: string;
  ru: string;
  en: string;
}

export function loc(language: Language, value: Loc): string {
  return value[language];
}

/* ------------------------------------------------------------------ */
/* Event identity                                                       */
/* ------------------------------------------------------------------ */

export const EVENT_FACTS = {
  name: "FOODERA EXPO 2026",
  tagline: {
    uz: "Food & Beverage Business Expo",
    ru: "Food & Beverage Business Expo",
    en: "Food & Beverage Business Expo",
  } as Loc,
  venue: {
    name: "SOF EXPO",
    city: { uz: "Samarqand", ru: "Самарканд", en: "Samarkand" } as Loc,
    country: "UZ",
    /** Open in the maps app of the OS / web — no API key needed. */
    mapUrl: "https://www.google.com/maps/search/?api=1&query=SOF+EXPO+Samarkand",
    yandexUrl: "https://yandex.uz/maps/?text=SOF%20EXPO%20Самарканд",
  },
  dates: {
    uz: "20–22 oktabr, 2026",
    ru: "20–22 октября, 2026",
    en: "20–22 October, 2026",
  } as Loc,
  days: ["20 oktabr", "21 oktabr", "22 oktabr"],
  /** Public profile of the organiser (not decorative — links to real pages). */
  social: {
    telegram: "https://t.me/sofexpo",
    telegramHandle: "@sofexpo",
    instagram: "https://www.instagram.com/sofexpo.uz/",
    facebook: "https://www.facebook.com/sofexpo.uz",
  },
  /** The official one-pager published by the organiser. */
  presentation: {
    url: "https://www.sofexpo.uz/wp-content/uploads/2026/06/Foodera_ru.pdf",
    label: { uz: "Rasmiy taqdimot (PDF)", ru: "Официальная презентация (PDF)", en: "Official deck (PDF)" } as Loc,
  },
  sourceNote: {
    uz: "Raqamlar: tashkilotchi SOF EXPO e'lon qilgan manbalar",
    ru: "Цифры: источники организатора SOF EXPO",
    en: "Figures: sources published by the organiser, SOF EXPO",
  } as Loc,
} as const;

/* ------------------------------------------------------------------ */
/* Market — figures published on sofexpo.uz/foodera-expo               */
/* ------------------------------------------------------------------ */

export interface MarketRow {
  code: string;
  name: Loc;
  /** Low bound in $B — drives the bar width. */
  low: number;
  high: number;
  /** Written exactly as the organiser publishes it. */
  value: string;
}

export const MARKET_ROWS: MarketRow[] = [
  {
    code: "kz",
    name: { uz: "Qozog'iston", ru: "Казахстан", en: "Kazakhstan" },
    low: 22,
    high: 28,
    value: "$22–28 mlrd",
  },
  {
    code: "uz",
    name: { uz: "O'zbekiston", ru: "Узбекистан", en: "Uzbekistan" },
    low: 15,
    high: 18,
    value: "$15–18 mlrd",
  },
  {
    code: "af",
    name: { uz: "Afg'oniston", ru: "Афганистан", en: "Afghanistan" },
    low: 10,
    high: 15,
    value: "$10–15 mlrd",
  },
  {
    code: "tj",
    name: { uz: "Tojikiston", ru: "Таджикистан", en: "Tajikistan" },
    low: 4,
    high: 6,
    value: "$4–6 mlrd",
  },
  {
    code: "tm",
    name: { uz: "Turkmaniston", ru: "Туркменистан", en: "Turkmenistan" },
    low: 4,
    high: 6,
    value: "$4–6 mlrd",
  },
  {
    code: "kg",
    name: { uz: "Qirg'iziston", ru: "Кыргызстан", en: "Kyrgyzstan" },
    low: 3,
    high: 5,
    value: "$3–5 mlrd",
  },
];

export const MARKET_HEADLINE = [
  {
    value: 125,
    suffix: "M+",
    label: { uz: "mintaqadagi iste'molchi", ru: "потребителей в регионе", en: "consumers in the region" } as Loc,
  },
  {
    value: 58,
    suffix: "–78 mlrd $",
    label: { uz: "umumiy bozor hajmi", ru: "общий объём рынка", en: "total regional market" } as Loc,
  },
  {
    value: 182,
    suffix: " trln so'm",
    label: { uz: "O'zbekistonda ulgurji savdo, 2024", ru: "оптовая торговля в Узбекистане, 2024", en: "wholesale trade in Uzbekistan, 2024" } as Loc,
  },
];

/* ------------------------------------------------------------------ */
/* Programme — three days                                              */
/* ------------------------------------------------------------------ */

export interface ProgramItem {
  time: string;
  title: Loc;
  text: Loc;
  kind: "expo" | "b2b" | "stage" | "social";
}

export interface ProgramDay {
  /** ISO date — used for the "today" highlight when the event runs. */
  iso: string;
  num: string;
  weekday: Loc;
  lead: Loc;
  items: ProgramItem[];
}

export const PROGRAM: ProgramDay[] = [
  {
    iso: "2026-10-20",
    num: "20",
    weekday: { uz: "seshanba", ru: "вторник", en: "Tuesday" },
    lead: {
      uz: "Ochilish kuni: maydon ishlaydi, birinchi B2B bloki.",
      ru: "День открытия: площадка работает, первый блок B2B.",
      en: "Opening day: the floor is live, first B2B block.",
    },
    items: [
      {
        time: "09:00",
        title: { uz: "Ro'yxatdan o'tish va beydjiklar", ru: "Регистрация и бейджи", en: "Registration & badges" },
        text: {
          uz: "Bot orqali ro'yxatdan o'tganlar navbatsiz oladi — ismingiz ro'yxatda bo'ladi.",
          ru: "Зарегистрированные через бот получают бейдж без очереди — имя будет в списке.",
          en: "Anyone who registered through the bot skips the queue — your name is on the list.",
        },
        kind: "expo",
      },
      {
        time: "10:00",
        title: { uz: "Rasmiy ochilish", ru: "Официальное открытие", en: "Official opening" },
        text: {
          uz: "Tashkilotchi va hamkorlar so'zi, ko'rgazma maydonining birinchi kuni.",
          ru: "Слово организатора и партнёров, первый день экспозиции.",
          en: "Words from the organiser and partners, first day of the exhibition.",
        },
        kind: "stage",
      },
      {
        time: "11:00",
        title: {
          uz: "Panel: oziq-ovqat bozori 2027",
          ru: "Панель: продовольственный рынок 2027",
          en: "Panel: the food market in 2027",
        },
        text: {
          uz: "Narx siyosati, logistika va ta'minot zanjiri — ritel va distribyutorlar ishtirokida.",
          ru: "Ценообразование, логистика и цепочка поставок — с участием ритейла и дистрибьюторов.",
          en: "Pricing, logistics and the supply chain — with retail and distributors on stage.",
        },
        kind: "stage",
      },
      {
        time: "13:30",
        title: { uz: "B2B uchrashuvlar · blok 1", ru: "B2B встречи · блок 1", en: "B2B meetings · block 1" },
        text: {
          uz: "Savdo tarmoqlari xaridorlari bilan 15 daqiqalik rejalashtirilgan uchrashuvlar.",
          ru: "Запланированные 15-минутные встречи с закупщиками торговых сетей.",
          en: "Scheduled 15-minute meetings with retail chain buyers.",
        },
        kind: "b2b",
      },
      {
        time: "16:00",
        title: { uz: "Yangi mahsulot taqdimotlari", ru: "Презентации новинок", en: "New product presentations" },
        text: {
          uz: "Sahna: ishtirokchi kompaniyalar yangi SKU'larini professional auditoriyaga chiqaradi.",
          ru: "Сцена: компании-участники представляют новые SKU профессиональной аудитории.",
          en: "On stage: exhibitors show new SKUs to a professional audience.",
        },
        kind: "stage",
      },
    ],
  },
  {
    iso: "2026-10-21",
    num: "21",
    weekday: { uz: "chorshanba", ru: "среда", en: "Wednesday" },
    lead: {
      uz: "Eksport va HoReCa kuni — eng zich savdo dasturi.",
      ru: "День экспорта и HoReCa — самая плотная торговая программа.",
      en: "Export & HoReCa day — the densest commercial programme.",
    },
    items: [
      {
        time: "09:30",
        title: {
          uz: "Amaliy seminar: qo'shni bozorga kirish",
          ru: "Практикум: выход на соседние рынки",
          en: "Workshop: entering neighbouring markets",
        },
        text: {
          uz: "Qozog'iston va Tojikiston: sertifikat, qadoqlash talablari, to'lov shartlari.",
          ru: "Казахстан и Таджикистан: сертификация, требования к упаковке, условия оплаты.",
          en: "Kazakhstan and Tajikistan: certification, packaging rules, payment terms.",
        },
        kind: "stage",
      },
      {
        time: "11:00",
        title: { uz: "HoReCa kuni", ru: "День HoReCa", en: "HoReCa day" },
        text: {
          uz: "Mehmonxona va restoran tarmoqlari yetkazib beruvchilarni tanlaydi.",
          ru: "Гостиничные и ресторанные сети выбирают поставщиков.",
          en: "Hotel and restaurant groups pick their suppliers.",
        },
        kind: "b2b",
      },
      {
        time: "13:00",
        title: { uz: "B2B uchrashuvlar · blok 2", ru: "B2B встречи · блок 2", en: "B2B meetings · block 2" },
        text: {
          uz: "Distribyutorlar va optom savdo bilan uchrashuvlar jadval bo'yicha.",
          ru: "Встречи с дистрибьюторами и оптовой торговлей по расписанию.",
          en: "Scheduled meetings with distributors and wholesalers.",
        },
        kind: "b2b",
      },
      {
        time: "15:30",
        title: {
          uz: "Texnologik kun: qadoqlash va uskunalar",
          ru: "Технологический день: упаковка и оборудование",
          en: "Technology day: packaging & equipment",
        },
        text: {
          uz: "Xom ashyo tanqisligi, qadoqlash iqtisodi va liniyani yangilash bo'yicha maslahat.",
          ru: "Дефицит сырья, экономика упаковки и консультации по модернизации линий.",
          en: "Raw-material shortages, packaging economics and line-upgrade advice.",
        },
        kind: "expo",
      },
      {
        time: "18:00",
        title: { uz: "Networking kechasi", ru: "Вечер нетворкинга", en: "Networking evening" },
        text: {
          uz: "Faqat ishtirokchilar uchun: stend egalari, xaridorlar va tashkilotchi jamoasi.",
          ru: "Только для участников: владельцы стендов, закупщики и команда организатора.",
          en: "Exhibitors only: booth owners, buyers and the organiser's team.",
        },
        kind: "social",
      },
    ],
  },
  {
    iso: "2026-10-22",
    num: "22",
    weekday: { uz: "payshanba", ru: "четверг", en: "Thursday" },
    lead: {
      uz: "Yakunlash: tadqiqot natijalari, so'nggi shartnomalar, yopilish.",
      ru: "Закрытие: результаты исследования, финальные сделки, закрытие.",
      en: "Closing: research results, final deals, wrap-up.",
    },
    items: [
      {
        time: "10:00",
        title: { uz: "Ochiq dialog: ritel 2027", ru: "Открытый диалог: ритейл 2027", en: "Open dialogue: retail 2027" },
        text: {
          uz: "Savdo tarmoqlari talablarini o'z og'zidan: shelf, marjita, logistika shartlari.",
          ru: "Торговые сети о своих требованиях напрямую: полка, маржа, условия логистики.",
          en: "Retail chains tell it straight: shelf space, margins, logistics terms.",
        },
        kind: "stage",
      },
      {
        time: "12:00",
        title: {
          uz: "Auditoriya va xaridolar hisoboti",
          ru: "Отчёт об аудитории и закупщиках",
          en: "Audience & buyer report",
        },
        text: {
          uz: "Ishlab chiqarilgan tadqiqot: kim keldi, nima sotildi, qanday kelishuvlar bo'ldi.",
          ru: "Готовое исследование: кто пришёл, что продали, какие договорённости получены.",
          en: "The field research: who came, what sold, which deals were struck.",
        },
        kind: "stage",
      },
      {
        time: "14:00",
        title: { uz: "So'nggi B2B bloki", ru: "Финальный блок B2B", en: "Final B2B block" },
        text: {
          uz: "Jadvalda bo'sh qolgan uchrashuvlar shu yerga tushadi — imkoniyat bor.",
          ru: "Встречи, не попавшие в расписание, попадают сюда — шанс есть.",
          en: "Meetings that did not fit the schedule land here — there is still room.",
        },
        kind: "b2b",
      },
      {
        time: "17:00",
        title: { uz: "Yopilish va keyingi sana", ru: "Закрытие и следующая дата", en: "Closing & next date" },
        text: {
          uz: "Ishtirokchilarga sertifikat va hisobot, keyingi yil uchun erta bron shartlari.",
          ru: "Сертификаты и отчёт участникам, ранние условия брони на следующий год.",
          en: "Certificates and the report for exhibitors, early booking terms for next year.",
        },
        kind: "expo",
      },
    ],
  },
];

export const PROGRAM_NOTE: Loc = {
  uz: "Dastur tashkilotchi tomonidan yangilanib boriladi — oxirgi versiya tasdiqlash xabarida yuboriladi.",
  ru: "Программа обновляется организатором — финальная версия приходит в подтверждении.",
  en: "The programme is updated by the organiser — the final version ships with your confirmation.",
};

/* ------------------------------------------------------------------ */
/* Audience — who walks the floor                                        */
/* ------------------------------------------------------------------ */

export interface AudienceRow {
  icon: "retail" | "distributor" | "horeca" | "import" | "marketplace" | "state";
  title: Loc;
  text: Loc;
}

export const AUDIENCE: AudienceRow[] = [
  {
    icon: "retail",
    title: { uz: "Savdo tarmoqlari xaridorlari", ru: "Закупщики торговых сетей", en: "Retail chain buyers" },
    text: {
      uz: "Markaziy va regional tarmoqlar, shelf bo'sh joyini taqsimlovchi kategoriya menejerlari.",
      ru: "Федеральные и региональные сети, категорийные менеджеры, распределяющие полку.",
      en: "National and regional chains, plus the category managers who allocate shelf space.",
    },
  },
  {
    icon: "distributor",
    title: { uz: "Distribyutorlar va optom savdo", ru: "Дистрибьюторы и опт", en: "Distributors & wholesalers" },
    text: {
      uz: "Viloyat bo'ylab tarqatish tarmog'i bo'lgan hamkorlar — bir necha shaharga kirish kaliti.",
      ru: "Партнёры с сетью дистрибуции по областям — ключ к нескольким городам сразу.",
      en: "Partners with regional distribution networks — one relationship, several cities.",
    },
  },
  {
    icon: "horeca",
    title: { uz: "HoReCa va katering", ru: "HoReCa и кейтеринг", en: "HoReCa & catering" },
    text: {
      uz: "Mehmonxona, restoran va kafelar uchun xarid bo'limlari — barqaror, takrorlanuvchi buyurtma.",
      ru: "Отделы закупок отелей, ресторанов и кафе — стабильный повторяющийся заказ.",
      en: "Purchasing teams of hotels, restaurants and cafés — repeatable, contracted volume.",
    },
  },
  {
    icon: "import",
    title: { uz: "Importchilar va eksport bo'limlari", ru: "Импортеры и экспортные отделы", en: "Importers & export desks" },
    text: {
      uz: "Xom ashyo va tayyor mahsulotni chetdan keltiruvchilar — lokal alternativani qidirishadi.",
      ru: "Поставщики сырья и готовой продукции ищут локальную альтернативу импорту.",
      en: "Buyers of imported goods are actively hunting a local alternative.",
    },
  },
  {
    icon: "marketplace",
    title: { uz: "Onlayn savdo va marketplace'lar", ru: "Онлайн-торговля и маркетплейсы", en: "Online retail & marketplaces" },
    text: {
      uz: "Kategoriya menejerlari va FBS operatorlari — onlayn tezlikda sinovdan o'tkazishadi.",
      ru: "Категорийные менеджеры и операторы FBS — быстрый тест спроса онлайн.",
      en: "Category managers and fulfilment operators — the fastest demand test there is.",
    },
  },
  {
    icon: "state",
    title: { uz: "Sanoat birlashmalari va delegatsiyalar", ru: "Отраслевые союзы и делегации", en: "Industry bodies & delegations" },
    text: {
      uz: "Viloyat hokimliklari savdo bo'limlari va tarmoq assotsiatsiyalari tashriflari.",
      ru: "Визиты отделов торговли хокимиятов и отраслевых ассоциаций.",
      en: "Regional trade departments and sector associations visit on organised trips.",
    },
  },
];

/* ------------------------------------------------------------------ */
/* What is included in every booth (organiser's published package)      */
/* ------------------------------------------------------------------ */

export const INCLUDED: { icon: "pdf" | "report" | "lock" | "clock"; title: Loc; text: Loc }[] = [
  {
    icon: "pdf",
    title: { uz: "Narxlar va interaktiv reja", ru: "Прайс и интерактивный план", en: "Price list & interactive floor plan" },
    text: {
      uz: "Bo'sh joylar, qo'shni brendlar va o'tish kengliklari bilan PDF rejа.",
      ru: "PDF с доступными местами, соседними брендами и шириной проходов.",
      en: "A PDF plan with live availability, neighbouring brands and aisle widths.",
    },
  },
  {
    icon: "report",
    title: { uz: "Auditoriya va xaridolar hisoboti", ru: "Отчёт об аудитории и закупщиках", en: "Audience & buyer report" },
    text: {
      uz: "Kim keladi, qanday lavozim, qanday hajmda sotib oladi — bron oldidan ko'rasiz.",
      ru: "Кто придёт, какая должность, какой объём закупок — видите до брони.",
      en: "Who attends, at what seniority, buying what volume — before you commit.",
    },
  },
  {
    icon: "lock",
    title: { uz: "Erta narxni qotitish", ru: "Фиксация ранней цены", en: "Early price fixing" },
    text: {
      uz: "Ariza yuborilgan kungacha bo'lgan narx qayta ko'rib chiqilmaydi.",
      ru: "Цена на момент заявки пересматривается в большую сторону.",
      en: "The price at the day you apply is the price that is held.",
    },
  },
  {
    icon: "clock",
    title: { uz: "24 soatlik javob", ru: "Ответ за 24 часа", en: "A reply within 24 hours" },
    text: {
      uz: "Menejer qo'ng'iroq qiladi yoki Telegram'da yozadi — spam yo'q.",
      ru: "Менеджер звонит или пишет в Telegram — никакого спама.",
      en: "A manager calls or writes on Telegram — no spam, no drip campaigns.",
    },
  },
];

/* ------------------------------------------------------------------ */
/* Venue & logistics                                                    */
/* ------------------------------------------------------------------ */

export const VENUE_CARDS: { icon: "plane" | "train" | "car" | "bed"; title: Loc; text: Loc; link?: { href: string; label: Loc } }[] = [
  {
    icon: "plane",
    title: { uz: "Samarkand xalqaro aeroporti", ru: "Аэропорт Самарканда", en: "Samarkand International Airport" },
    text: {
      uz: "Toshkentdan parvoz ~1 soat, maydondan ko'rgazma zaligacha 20–25 daqiqa.",
      ru: "Перелёт из Ташкента ~1 час, от аэропорта до площадки 20–25 минут.",
      en: "About an hour from Tashkent; 20–25 minutes from the runway to the hall.",
    },
  },
  {
    icon: "train",
    title: { uz: "«Afrosiyob» yuqori tezlik poyezdi", ru: "Скоростной поезд «Афросиаб»", en: "Afrosiyob high-speed train" },
    text: {
      uz: "Toshkent — Samarqand ~2 soat; vokzal shahar markazida, taksi 10 daqiqa.",
      ru: "Ташкент — Самарканд ~2 часа; вокзал в центре, такси 10 минут.",
      en: "Tashkent to Samarkand in about two hours; the station is central, a taxi is ten minutes.",
    },
  },
  {
    icon: "car",
    title: { uz: "Transport va parkovka", ru: "Транспорт и парковка", en: "Getting there & parking" },
    text: {
      uz: "Yakshovshilar uchun transfer ro'yxati va mehmon rejalari tasdiqlashdan keyin yuboriladi.",
      ru: "Список трансферов и план для гостей — после подтверждения заявки.",
      en: "Transfer options and a guest plan are sent once your registration is confirmed.",
    },
  },
  {
    icon: "bed",
    title: { uz: "Hamkor mehmonxonalar", ru: "Отели-партнёры", en: "Partner hotels" },
    text: {
      uz: "Zalga yaqin mehmonxonalar ro'yxati va maxsus narxlar stend egalari bilan bo'lishiladi.",
      ru: "Список отелей рядом с площадкой и специальные тарифы — для участников.",
      en: "A shortlist near the venue with negotiated rates for exhibitors.",
    },
  },
];

/* ------------------------------------------------------------------ */
/* Floor plan (schematic)                                               */
/* ------------------------------------------------------------------ */

export interface Zone {
  id: string;
  /** Matches `spaceNeeded` option keys from the stand form. */
  standKey: "premium" | "standard" | "area" | "unsure";
  label: Loc;
  desc: Loc;
  /** Grid geometry inside the 24 x 14 hall viewBox. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** How many booths the schematic draws for this zone. */
  cells: number;
  cols: number;
}

export const HALL_ZONES: Zone[] = [
  {
    id: "A",
    standKey: "premium",
    label: { uz: "A zona · Premium", ru: "Зона A · Premium", en: "Zone A · Premium" },
    desc: {
      uz: "18 m² orol stendlar, markaziy o'tish, uch tomondan kirish.",
      ru: "Островные стенды 18 м², центральный проход, вход с трёх сторон.",
      en: "18 m² island booths on the main aisle, open on three sides.",
    },
    x: 4,
    y: 4,
    w: 7,
    h: 5,
    cells: 9,
    cols: 3,
  },
  {
    id: "B",
    standKey: "standard",
    label: { uz: "B zona · Standart", ru: "Зона B · Стандарт", en: "Zone B · Standard" },
    desc: {
      uz: "9 m² devor stendlari — asosiy oqim yo'nalishida.",
      ru: "Стеновые стенды 9 м² вдоль основного потока.",
      en: "9 m² inline booths along the main visitor flow.",
    },
    x: 13,
    y: 3,
    w: 8,
    h: 3,
    cells: 16,
    cols: 8,
  },
  {
    id: "C",
    standKey: "area",
    label: { uz: "C zona · Ochiq maydon", ru: "Зона C · Открытая площадь", en: "Zone C · Raw space" },
    desc: {
      uz: "36 m²+ — o'z dizayningiz bilan qurasiz, maydon tayyor topshiriladi.",
      ru: "От 36 м² — строите сами, площадь передаётся подготовленной.",
      en: "36 m² and up — build it your own way on a prepared plot.",
    },
    x: 13,
    y: 8,
    w: 8,
    h: 4,
    cells: 8,
    cols: 4,
  },
  {
    id: "D",
    standKey: "unsure",
    label: { uz: "D zona · Degustatsiya va sahna", ru: "Зона D · Дегустация и сцена", en: "Zone D · Tasting & stage" },
    desc: {
      uz: "Taqdimotlar, tasting sessiyalari va B2B uchrashuv maydoni.",
      ru: "Презентации, дегустации и площадка B2B-встреч.",
      en: "Presentations, tastings and the B2B meeting tables.",
    },
    x: 4,
    y: 10,
    w: 7,
    h: 2,
    cells: 0,
    cols: 0,
  },
];

export const FLOORPLAN_NOTE: Loc = {
  uz: "Reja sxematik — aniq stend joylashuvi shartnomada tasdiqlanadi.",
  ru: "План схематичен — конкретное место стенда фиксируется в договоре.",
  en: "The plan is schematic — the exact booth position is confirmed in the contract.",
};
