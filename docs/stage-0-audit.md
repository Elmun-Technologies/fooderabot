# 0-bosqich — Audit va yo'nalish

> **Maqsad:** ishlayotgan production kodni xalqaro B2B lead-gen mahsulotiga aylantirish uchun aniq holat, 2 ta vizual yo'nalish, ma'lumotlar arxitekturasi rejasi va keyingi 6 bosqichning yo'l xaritasini tasdiqlash.
> **Hozirgi branch:** `arena/01a06223-fooderabot` (head `e7d693b` = main bilan bir xil, chunki `arena/01a061db-fooderabot` allaqachon merge qilingan PR #12 orqali).

---

## 1. Umumiy holat: nima ishlayapti, nima yo'q

### ✅ Ishlayapti (buzilmasin)
| # | Nima | Fayl / joy | Izoh |
|---|---|---|---|
| 1 | initData HMAC auth | `backend/src/lib/validateInitData.ts` | To'g'ri ishlayapti, buzilmasin |
| 2 | Telefonni Telegram'dan 1 tapda olish | `webapp/src/lib/telegram.ts` (`requestContact`, 2-arg `event.responseUnsafe.contact.phone_number`) | To'g'ri, **regressiyaga yo'l qo'ymang** |
| 3 | "Rahmat" ekrani | `webapp/src/components/SuccessScreen.tsx` | Ishlayapti, saqlanadi |
| 4 | 124/124/124 locale pariteti | `webapp/src/i18n/locales/{uz,ru,en}.json` | Saqlanadi (har bir o'zgarishdan keyin diff qilamiz) |
| 5 | Forma 3-step, chips, prefill, error ekranga qaytishda saqlanish | `webapp/src/components/StandForm.tsx` (189 qator) | Juda yaxshi tuzilgan, faqat **1 ta qo'shimcha savol** qo'shamiz |
| 6 | UTM 5 ta maydon, start payload'dan o'qish | `backend/src/lib/utm.ts`, `backend/src/bot/bot.ts` (`/start`) | DB'da saqlanadi, lead guruh xabarida ko'rinadi |
| 7 | Lead guruhga xabar yuborish | `backend/src/bot/leadsGroup.ts` (69 qator) | Ishlayapti, faqat 1 ta manbasiz raqam bor (leads group xabarida emas, faqat follow-up matnlarida) |
| 8 | Nudge 3h/24h/72h + follow-up 24h scheduler | `backend/src/bot/followups.ts` (112 qator) | Logika to'g'ri, lekin matnlar hardcode + manbasiz raqam bor |
| 9 | Splash, offline, alreadyRegistered, error state | `webapp/src/App.tsx` (state machine) | Yaxshi |
| 10 | DEV build DEMO stub (Telegram'siz ham ko'rish mumkin) | `webapp/src/lib/api.ts` | Qulay, saqlanadi |
| 11 | Hot-reload, Vite proxy `/api` → :3000 | `webapp/vite.config.ts` | Lokal dev uchun kerak |
| 12 | Dockerfile (node:20-slim + openssl) | root | Brief'da aniq ko'rsatilganidek, **alpine ishlatilmasin** |

### ❌ Hozircha yo'q yoki sifatsiz
| # | Nima | Nima uchun muhim | Qaysi bosqichda |
|---|---|---|---|
| 1 | **Brend identifikatsiyasi** (logo, brandbook, real foto, eksponent logotiplari) | AI-belgilarni yo'qotish uchun | 1-bosqich |
| 2 | **Manbasiz raqamlar** (3 ta joyda aniqlandi) | "AI generate" belgisi, siz "raqam ko'rsatmaymiz" dedingiz | 1-bosqich (matnlar qayta yoziladi) |
| 3 | **Animatsiya tizimi** (sahifa o'tishlari, scroll-reveal, mikro-interaktsiyalar, count-up) | 60fps, brief'da aniq talab | 3-bosqich |
| 4 | **Ovoz effektlari** (≤3 ta klip, ≤60KB, toggle) | Brief 2.B | 3-bosqich |
| 5 | **Haptika** (har bir muhim amalda) | Brief 2.B | 3-bosqich |
| 6 | **Intent capture ekranlari** (byudjet, muddat, bozor) | Siz "1 ta qo'shimcha savol: shahar" desangiz, demak **minimal** — shahar/region chip | 2-bosqich |
| 7 | **Lead scoring (HOT/WARM/COLD, 0–100)** | Lead sifati + prioritet | 2-bosqich |
| 8 | **HOT lead → darhol guruhga + manager bildirishnomasi** | Sotuv tezligi | 2-bosqich |
| 9 | **Event/analitika modeli va `/api/webapp/track`** | Brief 2.F — eng katta gap | 4-bosqich |
| 10 | **DB'da sozlanadigan follow-up ketma-ketliklari** (hozir hardcode) | Marketing egasi mustaqil o'zgartira oladi | 4-bosqich |
| 11 | **Broadcast/rassylka (segment → preview → navbat)** | Operatsion samaradorlik | 4-bosqich |
| 12 | **Workflow dvigateli (trigger → shart → amallar)** | Avtomatlashtirish | 4-bosqich |
| 13 | **Admin panel (dashboard, leadlar, segment, broadcast, workflow, audit)** | 1 ta admin uchun ideallik | 5-bosqich |
| 14 | **Admin auth (parol + sessiya + audit log + rate limit)** | Xavfsizlik | 4-bosqich (API) + 5-bosqich (UI) |
| 15 | **Asimmetrik layout, real editorial tipografika, dark/light theme** | "AI generate" ko'rinishdan chiqish | 1-bosqich |
| 16 | **Stend paketlari (3–4 ta variant, "narx so'rov bo'yicha" formati)** | B2B sotuvchi sifatida ishonch | 1-bosqich |
| 17 | **Lokal dev'da `SKIP_BOT=1` ishlatish uchun env + qo'llanma** | Test/QA osonlashtirish | 0-bosqich yonida |

### ⚠️ Manbasiz raqamlar (aniq topildi, 1-bosqichda tuzatiladi)
1. `backend/src/bot/i18n.ts` → `botText.warmup()`: `"125M+ iste'molchi bozori, 6 mamlakat, $58–78 mlrd bozor hajmi"` (uz/ru/en 3 tilda).
2. `backend/src/bot/followups.ts` → `nudgeText(2, ...)`: `"125M+ iste'molchi bozoriga chiqish imkoniyati va 6 mamlakatdan hamkorlar"`.
3. `Landing.tsx` da 3 ta stat: `stat1Value`/`stat2Value`/`stat3Value` — i18n'da nima yozilganini ko'rish kerak, ehtimol shu ham raqam.

### ⚠️ Emoji ishlatilishi
- **Lead guruh xabari (`leadsGroup.ts`)**: `🆕 👤 🏢 📐 🎟 📞 🌐 💬 🔗 ✅ ⚠️ ⏳ 🕒` — bu **operatsion xabar**, admin ko'radi, OK.
- **Bot follow-up matnlari**: `👋 🗂 🎟` — foydalanuvchiga boradi. Brief'da "emoji ikonka sifatida ishlatish" taqiqlangan, lekin **matn ichida emfaz** uchun odatda ruxsat beriladi. 2-bosqichda ehtiyotkorlik bilan qisqartiramiz (≤1-2 ta, faqat muhim o'rinlarda).
- **Landing hero meta**: `📅 📍` — bu faqat meta-belgi sifatida, qisqa. Saqlanishi mumkin, lekin ixtiyoriy ravishda custom SVG iconkaga almashtiriladi (1-bosqich, agar dizayn mos kelsa).

---

## 2. Foydalanuvchi savollari bo'yicha qarorlar

| # | Savol | Javob | Qaror |
|---|---|---|---|
| 1 | Brend aktivlari | Yo'q (faqat logo.png) | **1-bosqich:** men yarataman — yaxshilangan logo SVG, yangi hero (WebP/AVIF ≤120KB), eksponentlar devori (placeholder real logotiplar bilan, keyin sizning haqiqiy logotiplaringiz bilan almashinadi), editorial tipografika (Google Fonts yoki custom — Manrope/Inter kabi neytral, lekin brend uchun bitta "display" + bitta "text") |
| 2 | Stend paketlari | Bor, narx yo'q | **1-bosqich:** 4 ta variant: Starter (6 m²), Standard (12 m²), Premium (18 m²), Custom (20+ m²). Kv.m va nima kiradi (stend konstruksiyasi, jihozlar, reklama, parking, Wi-Fi, elektr) — narx "so'rov bo'yicha" deb belgilanadi (4 ta CTA: tanlash + "manager 15 daqiqada bog'lanadi") |
| 3 | Raqamlar | Ko'rsatmaymiz | **1-bosqich:** barcha manbasiz raqamlar olib tashlanadi, o'rniga sifatli matn + faktlar (sana, joy, tashkilotchi — bu ishonchli) |
| 4 | Sotuv jarayoni | Qisman aniq | **2-bosqich:** lead tushganda → guruhga xabar + lead score; HOT leadlar (≥70 ball) → qo'shimcha belgi + admin panelda birinchi bo'lib; standart jarayon 24 soat ichida menejer bog'lanadi (bot tasdiq xabarida) |
| 5 | amoCRM | Hozircha yo'q | Arxitektura tayyor bo'ladi (NotificationProvider, CRMProvider interface'lar), lekin integratsiya ulanmaydi. Hozirgi amocrm.ts qoladi, lekin env to'ldirilmagan bo'lsa `noop` rejada |
| 6 | Admin | 1 ta admin | **5-bosqich:** 1 rol (admin), parol + sessiya cookie, 2FA keyinroq, audit log barcha amallar, Excel eksport (CSV), dashboard real vaqtda (bugun/hafta/umumiy + funnel + drop-off + kanal/til kesimi) |
| 7 | Kvalifikatsiya | Formaning hozirgi holati yaxshi + "qaysi shaharda faoliyat yuritasiz" | **2-bosqich:** StandForm'ga 4-step (hozir 3) qo'shamiz: 1.Kategoriya → 2.Kontakt → **3.Hudud (yangi)** → 4.Stend+telefon. Yoki 3-step'ning o'ziga "step 2.5" sifatida qo'shamiz (minimal uzilish). **Qaror:** alohida 4-step (aniqroq, progress aniqroq) |
| 8 | Email/SMS | Faqat Telegram | `NotificationProvider` interface, hozir faqat `TelegramProvider`, keyin `EmailProvider` ulanadi (SMTP/Resend) |
| 9 | Mavjud baza | Yo'q | Hech narsa import qilinmaydi, faqat yangi leadlar |
| 10 | Prioritet | **Lead sifat + scoring** | 2-bosqich eng muhim, 1-bosqich undan oldin (chunki dizayn + landing leadlarni jalb qiladi). 4–5-bosqich (admin + marketing avtomatikasi) keyinroq, lekin uzoqlashtirmaymiz |

### Qo'shimcha aniqlashtirish kerak bo'lgan narsalar
- **1.** Tashkilotchi ma'lumotlari: SOF EXPO — kontakt (telefon, Telegram) bor, lekin sizning ismingiz/brend nomingiz ko'rinadimi? (lead guruh xabarida va landingda "tashkilotchi" blokida)
- **2.** Menejer ismi yoki umumiy "operatorlarimiz"? (bot tasdiq xabarida "Operatorlarimiz 24 soat ichida bog'lanadi" — shu qoladimi yoki aniq ism?)
- **3.** "Manager 15 daqiqada" — bu real vaqtmi yoki marketing va'dasi? (lead guruhdagi bildirishnoma tezligi bilan mos bo'lishi kerak, va'da + bajarmaslik = ishonch yo'qolishi)
- **4.** Rasm/photo sizdan keyin keladimi yoki men hozircha placeholder ishlataman? (eksponentlar devori, speakerlar, 3D stend vizualizatsiyasi)
- **5.** Localization: boshqa tillar (tr, ar, zh) kerakmi yoki faqat uz/ru/en?

---

## 3. Ma'lumotlar arxitekturasi rejasi (Prisma schema qo'shimchalari)

> **Qoida:** faqat additive migration; mavjud ustunlar o'chirilmaydi yoki qayta nomlanmaydi. Eski ma'lumot buzilmaydi.

### 3.1 Yangi modellar

```prisma
// ─── Analitika ───
model Event {
  id          BigInt   @id @default(autoincrement())
  anonymousId String?  // browser session ID (cookie/localStorage), initData bo'lmasa
  userId      Int?     // FK → User, initData valid bo'lsa
  name        String   // app_open | screen_view | cta_click | role_select | field_focus | field_complete | phone_shared | form_abandon | submit_success | submit_error | share_click | lang_switch | intent_answer
  screen      String?  // landing | role | form.stand.step1 | ...
  props       Json?    // ixtiyoriy: { role: "STAND", step: 1, value: "drinks", dwellMs: 4200 }
  utmSource   String?
  utmMedium   String?
  utmCampaign String?
  utmContent  String?
  utmTerm     String?
  createdAt   DateTime @default(now())

  user        User?    @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([name, createdAt])
  @@index([userId, createdAt])
  @@index([screen, createdAt])
}

// ─── Lead score + status (Registration'ga qo'shimcha, o'zgartirish yo'q) ───
// Registration.status endi PENDING | SYNCED | FAILED dan kengaytiriladi:
// HOT_LEAD | WARM_LEAD | COLD_LEAD (qo'shimcha teg), lekin type emas — bitta "leadTier" maydoni.
model Registration {
  // ... mavjud maydonlar ...
  leadScore   Int       @default(0)   // 0..100
  leadTier    String?   // "HOT" | "WARM" | "COLD"
  city        String?   // yangi qo'shimcha savol — "qaysi shaharda faoliyat yuritasiz"
  // ...
}

// ─── Marketing: DB'da ketma-ketliklar (hardcode o'rniga) ───
model Sequence {
  id          String   @id @default(cuid())  // "nudge_unregistered" | "followup_registered" | ...
  name        String
  description String?
  enabled     Boolean  @default(true)
  steps       SequenceStep[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model SequenceStep {
  id          String   @id @default(cuid())
  sequenceId  String
  order       Int                       // 1, 2, 3
  afterMinutes Int                      // 180, 1440, 4320 (3h, 24h, 72h)
  condition   Json?                     // { "type": "STAND" } yoki { "scoreGte": 70 }
  textUz      String
  textRu      String
  textEn      String
  // Kengaytirish uchun: channelId, buttonLabel, attachments, ...

  sequence    Sequence @relation(fields: [sequenceId], references: [id], onDelete: Cascade)

  @@index([sequenceId, order])
}

// ─── Broadcast: rassylka navbati ───
model Broadcast {
  id          String   @id @default(cuid())
  name        String                       // admin ko'radigan nom
  segment     Json                         // { role: "STAND", lang: "uz", leadTier: "HOT" } yoki query
  textUz      String
  textRu      String
  textEn      String                       // (yoki bitta til — MVP)
  status      String   @default("DRAFT")   // DRAFT | SCHEDULED | RUNNING | DONE | FAILED
  scheduledAt DateTime?
  startedAt   DateTime?
  finishedAt  DateTime?
  totalCount  Int      @default(0)
  sentCount   Int      @default(0)
  failedCount Int      @default(0)
  createdBy   String?                      // admin username
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model BroadcastRecipient {
  id           String   @id @default(cuid())
  broadcastId  String
  userId       Int?
  telegramId   BigInt?
  status       String   @default("PENDING")  // PENDING | SENT | FAILED | BLOCKED
  error        String?
  sentAt       DateTime?
  createdAt    DateTime @default(now())

  broadcast    Broadcast @relation(fields: [broadcastId], references: [id], onDelete: Cascade)

  @@index([broadcastId, status])
}

// ─── Workflow (trigger → shart → amallar) ───
model Workflow {
  id          String   @id @default(cuid())
  name        String
  trigger     String                       // "new_lead" | "drop_off" | "no_reply_n_days" | "manual"
  enabled     Boolean  @default(true)
  conditions  Json?                        // { role: "STAND", scoreGte: 70, ... }
  actions     Json                         // [{ type: "send_message", sequenceId: "..." }, { type: "add_tag", tag: "VIP" }, { type: "assign_manager", managerId: "..." }]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// ─── Admin: foydalanuvchilar, sessiyalar, audit ───
model AdminUser {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String                       // argon2id
  role         String   @default("admin")   // hozir faqat "admin", keyin "viewer"
  createdAt    DateTime @default(now())
  lastLoginAt  DateTime?
  sessions     AdminSession[]
  auditLogs    AuditLog[]
}

model AdminSession {
  id           String   @id @default(cuid())
  adminUserId  String
  tokenHash    String   @unique             // SHA256(sessionToken)
  userAgent    String?
  ip           String?
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  lastSeenAt   DateTime @default(now())

  adminUser    AdminUser @relation(fields: [adminUserId], references: [id], onDelete: Cascade)

  @@index([expiresAt])
}

model AuditLog {
  id           BigInt   @id @default(autoincrement())
  adminUserId  String?
  action       String                       // "login" | "lead.update_status" | "broadcast.create" | "workflow.toggle" | ...
  target       String?                      // resource id
  meta         Json?                        // { oldValue, newValue, ... } (parol/token bo'lmasin)
  ip           String?
  userAgent    String?
  createdAt    DateTime @default(now())

  adminUser    AdminUser? @relation(fields: [adminUserId], references: [id], onDelete: SetNull)

  @@index([adminUserId, createdAt])
  @@index([action, createdAt])
}
```

### 3.2 Migration rejasi (additive)
1. `2026xxxx_add_event_and_lead_score` — `Event` jadvali + `Registration.leadScore/leadTier/city` maydonlari (default qiymatlar bilan, mavjud qatorlar buzilmaydi).
2. `2026xxxx_add_marketing_tables` — `Sequence`, `SequenceStep`, `Broadcast`, `BroadcastRecipient`, `Workflow`.
3. `2026xxxx_add_admin_tables` — `AdminUser`, `AdminSession`, `AuditLog`.
4. `2026xxxx_seed_default_sequences` — mavjud hardcode matnlar `Sequence`ga ko'chiriladi (3 nudge + 1 followup), shunda followups.ts DB'dan o'qiydi.

### 3.3 Lead scoring qoidasi (dastlabki)
- `role = STAND` → +30 (asosiy maqsad)
- `phone` bor → +20 (kontakt bor)
- `companyYears = 10_plus` → +15
- `companyYears = 3_10` → +10
- `spaceNeeded = custom` → +15
- `spaceNeeded = premium` → +10
- `spaceNeeded = standard` → +5
- `city = Tashkent` yoki `Samarkand` → +5 (ekspo shahri)
- **HOT ≥ 70**, **WARM 40–69**, **COLD < 40**

> Bu MVP qoidasi; admin panelda keyin sozlanadigan bo'ladi (Workflow + tag'lar orqali).

### 3.4 Admin panel joylashuvi qarori
**Tavsiya: Bitta Fly app ichida** (`https://fooderabot-api.fly.dev/admin`).
- **Sabablar:** qo'shimcha xarajat yo'q, bitta deploy, single-origin, secretlar bitta joyda. Mini App bundle'ini admin kodidan ajratish **albatta shart** — Vite build'da `index-admin.html` alohida entry, kod-splitsing.
- **Alohida app** olib tashlanadi (ortiqcha xarajat, ikki deploy, ikki origin, ikki secret rotate).
- 2FA, IP allowlist — keyin qo'shiladi.

---

## 4. Ikki vizual yo'nalish maketi (matnli eskiz)

> Quyidagi ikkala yo'nalish ham "AI generate" belgilaridan **to'liq xoli**: emoji-as-icon yo'q, generik ko'k-binafsha gradient yo'q, simmetrik 3-ustunli features yo'q, manbasiz raqam yo'q, hamma narsa markazlashtirilgan matn emas. Ikkalasi ham dark/light Telegram theme'ga moslashadi.

### Yo'nalish A — "Editorial B2B" (jiddiy, an'anaviy, premium)
**Misol kompaniyalar:** Messe Frankfurt, Gulfood, Fancy Food Show web saytlari, Stripe Press.
- **Tipografika:** "display" = Manrope ExtraBold/Black (700/800), "text" = Inter (400/500/600). Web-safe, tez, bepul.
- **Ranglar:**
  - Primary: Chuqur to'q ko'k `#0d1b34` (mavjud `--night`)
  - Accent: Issiq oltin `#c9a66b` (mavjud `--gold`) — premium his uchun
  - Surface: Oq / off-white (light theme) yoki `#101622` (dark theme)
  - **Hech qanday gradient** — faqat solid ranglar.
- **Layout:**
  - Hero: 2-ustunli (desktop) / stacked (mobile). Chap — matn + countdown + CTA. O'ng — haqiqiy 3D stend yoki ekspo ichki ko'rinish (hozircha placeholder).
  - Pastda: editorial "section" — chapga tekislangan katta sarlavha + kichik subtitle + 2-ustunli matn.
  - Stend paketlari: 4 ta kartochka (Starter 6 m², Standard 12 m², Premium 18 m², Custom 20+ m²) — narx o'rniga "so'rov bo'yicha" + "15 daqiqada bog'lanamiz" mikro-matn.
  - "Nima uchun" — 2-ustunli, har birida bitta custom SVG iconka (illustratsiya yo'q!), chapga tekislangan.
  - Eksponentlar/speakerlar: haqiqiy logotiplar (hozircha placeholder) — grayscale, hover'da rang.
  - Footer: kontaktlar, ijtimoiy, "tashkilotchi" logotipi, yuridik.
- **Animatsiya:** sahifa scroll'da stagger (≤300ms), sarlavhalar `clip-path` bilan ochiladi, sonlar count-up (faqat 1 marta), micro: tugma bosilganda `scale(0.97)`, chip tanlanganda border animatsiyasi.
- **Mood:** ishonchli, jiddiy, premium — "xalqaro ekspo" ko'rinishi.

### Yo'nalish B — "Modern SaaS B2B" (energetik, yorqin, amaliy)
**Misol kompaniyalar:** Linear, Vercel, Notion, Calendly marketing sahifalari.
- **Tipografika:** "display" = Cabinet Grotesk (yoki Geist), "text" = Inter. Yoki ikkalasi ham Inter (700 + 400).
- **Ranglar:**
  - Primary: Yorqin ko'k `#2f6fe0` (mavjud `--primary`)
  - Accent: Yashil `#1d8a4b` (muvaffaqiyat/amalga oshish uchun)
  - Surface: Oq / off-white (light), `#0d1b34` (dark)
  - **Subtle accent gradient** faqat **1 marta** — CTA tugmada yoki "HOT lead" teg'da (boshqa joyda yo'q).
- **Layout:**
  - Hero: to'liq kenglikdagi rasm + markazlashtirilgan (lekin assimetrik) matn bloki — chapga tekislangan sarlavha + subtitle + 2 ta CTA ("Ro'yxatdan o'tish" + "Stend haqida").
  - Pastda: "stend paketlari" — sticky tab (Starter/Standard/Premium/Custom) + tanlangan paketning kengaytirilgan ko'rinishi.
  - "Nima uchun" — chapga tekislangan katta son (raqam emas, balki "3", "24/7", "6" mamlakat) + chapga matn.
  - Eksponentlar: marquee (uzluksiz aylanish) yoki static grid.
  - Footer: minimal, kontakt ustunlari.
- **Animatsiya:** sahifa scroll'da parallax (subtle, ≤16px), tugmalarda gradient sweep, chip tanlashda fill animatsiyasi, success ekranda confetti (ixtiyoriy, opt-in).
- **Mood:** zamonaviy, tezkor, "yangi avlod" — yoshroq, lekin jiddiy emas.

### Mening **tavsiyam: Yo'nalish A — Editorial B2B**
**Sabablar:**
1. **Maqsadli auditoriya:** xalqaro kompaniyalar (buyer'lar, distribyutorlar, retail tarmoqlar) — ular jiddiy, "ishonchli" ko'rinishni xohlashadi. Linear/Vercel uslubi texnik auditoriyaga mos, lekin FOODERA = oziq-ovqat ekspo, an'anaviy B2B ko'rinishi ko'proq ishonch beradi.
2. **"AI generate" dan eng uzoq:** editorial tipografika + solid ranglar + assimetrik layout = klassik professional, generik SaaS ko'rinishidan butunlay boshqa.
3. **Mavjud ranglar bilan mos:** qora-oltin mavjud, hech narsa butunlay o'zgartirilmaydi.
4. **Hot leadlar uchun yaxshi:** qora fonda oltin "HOT" belgisi juda kuchli, ko'z tushadi.

Lekin **siz tanlaysiz** — A yoki B yoki aralash (A'ning editorial + B'ning sticky tab paketlari).

---

## 5. Keyingi 6 bosqichning yo'l xaritasi (bitta umumiy ko'rinish)

| # | Bosqich | Muddat (taxminiy) | Asosiy natija | Sizning tasdig'ingiz |
|---|---|---|---|---|
| 0 | Audit + yo'nalish (shu hujjat) | Tayyor | Reja, 2 yo'nalish, schema | **HOZIR** |
| 1 | Dizayn tizimi + landing | 1-2 iteratsiya | Tokens, tipografika, komponentlar, yangi landing, 4 ta stend paketi, manbasiz raqamlar olib tashlandi, 3 tilda | Skrinshotlar + build ✅/❌ |
| 2 | Journey + intent + scoring | 1 iteratsiya | 4-step StandForm (shahar qo'shildi), lead score, HOT/WARM/COLD, HOT lead → guruhga qo'shimcha teg, lead guruh xabari yangilandi | Skrinshotlar + DB'da lead tier ✅ |
| 3 | Motion + ovoz + haptika | 1 iteratsiya | Animatsiya tizimi, ovoz toggle, haptika har bir amalda, reduced-motion | Skrinshot + video yoki GIF (ixtiyoriy) + build hajmi ✅ |
| 4 | Backend: analitika + marketing | 1-2 iteratsiya | Event modeli, `/track`, Sequence/Broadcast/Workflow, scheduler DB'dan, admin API + auth + audit | Build + `curl` natijalari + DB ko'rinishi ✅ |
| 5 | Admin panel UI | 1-2 iteratsiya | Dashboard, funnel, leadlar, eksport CSV, segmentlar, ketma-ketliklar editori, broadcast, workflow, audit, sozlamalar | Skrinshotlar + real DB'da sinov ✅ |
| 6 | Hardening + QA + deploy | 1 iteratsiya | Perf, bundle ≤180KB gzip, hero WebP/AVIF ≤120KB, rate limit, regression test, 3 tilda walkthrough, deploy buyruqlari | Build + fly logs + manual test ✅ |

### Umumiy taxminiy iteratsiyalar soni: **7-10 ta kichik commit'lar** (har biri mustaqil ravishda production'ga deploy qilinishi mumkin, lekin biz 6-bosqichda bitta katta PR ochamiz).

### Xavfsizlik eslatmalari
- **Har bir bosqich oxirida `npm run build` ikkalasi ham xatosiz** o'tishi kerak.
- **Hech qachon `git push --force`** qilinmaydi.
- **Sir hech qachon frontend'ga** yozilmaydi.
- **PR** faqat `arena/01a06223-fooderabot` → `main` ga, sizning roziligingiz bilan.

---

## 6. 0-bosqichdan keyingi aniq birinchi qadam

Agar siz **0-bosqich natijasini tasdiqlasangiz** va **vizual yo'nalishni** (A yoki B yoki aralash) tanlasangiz, men **1-bosqich** ga o'taman:

1. Yangi branch ichida (bu yerda `arena/01a06223-fooderabot` da qolamiz, yangi branch ochmaymiz, brief'da "yangilash" deyilganidek, lekin sizning roziligingiz bilan).
2. Birinchi commit: `chore(stage-1): design tokens + typography + base components` — `webapp/src/styles.css` ga tokens (motion, z-index, spacing scale, font sizes), 2 ta Google Font import (display + text), yangi `:root` ranglar.
3. Ikkinchi commit: `feat(stage-1): new landing (editorial) + 4 stand packages + i18n keys (124 → ~150, 3 tilda)`.
4. Uchinchinchi commit: `chore(stage-1): remove unsourced numbers from bot warmup + followups`.
5. Boshida menga **3 ta skrinshot** (uz/ru/en, light theme) — 1-bosqich tugagandan keyin.

---

## 7. Sizdan so'rayman (0-bosqichni yopish uchun)

Iltimos, quyidagilarga **javob bering** (qisqa bo'lsa ham, "OK" yoki "A" yoki "B" deb):

1. **0-bosqich auditi to'g'ri tushunildimi?** (qo'shish/o'chirish kerak bo'lgan narsa bormi?)
2. **Vizual yo'nalish: A (Editorial B2B), B (Modern SaaS), yoki aralash?** Tavsiyam **A**.
3. **Forma o'zgarishi: 4-step (shahar alohida step) yoki 3-step'ga joylashtirish?** Tavsiyam **4-step** (progress aniq).
4. **Lead scoring qoidalari mosmi?** (HOT ≥70, STAND roli +30, va h.k.)
5. **Admin panel: bitta Fly app ichida** tasdiqlaysizmi?
6. **5 ta aniqlashtirish savoliga** (2-bo'lim oxiri) javob bera olasizmi? (tashkilotchi, menejer ismi, "15 daqiqada" va'dasi, rasm/photo, qo'shimcha tillar)
7. **Stage 1 ga o'tishga ruxsat bera olasizmi?**

Siz javob berganingizdan keyin, men **Stage 1** ni boshlayman va har bir kichik commit'da sizni xabardor qilaman.
