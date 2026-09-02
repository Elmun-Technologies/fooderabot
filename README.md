# Foodera Expo — Telegram Mini App + Lead-Gen Platform

`sofexpo.uz/foodera-expo` saytidagi past konversiyani hal qilish uchun Telegram bot +
Web App (Mini App). Foydalanuvchi botga kirib, ichki formani to'ldiradi, forma
avtomatik ravishda **amoCRM**ga zayavka (lead) qilib tushadi. Maqsad — sifatsiz,
to'liqsiz liddlarning oldini olish va maksimal konversiya: har bir savol bitta
tapsilda hal bo'ladi (chips), stend arizasi uchun telefon 1 ta tugma bilan
Telegram'dan olinadi.

**Production:** `https://fooderabot-api.fly.dev` (Fly.io, region `fra`).
**Admin panel:** `https://fooderabot-api.fly.dev/admin` (Stage 5, single-origin).

## Arxitektura

```
backend/   Node.js + TypeScript
           - Telegraf bot (/start, UTM deep-link, "allaqachon ro'yxatdan o'tgan" tekshiruvi)
           - Express API — /api/webapp (initData auth), /api/admin (PBKDF2 cookie)
           - Prisma + PostgreSQL (User, Registration, Event, Sequence, Broadcast,
             Workflow, AdminUser/Session, AuditLog)
           - Lead scoring engine (services/leadScoring.ts, 0..100 ball + HOT/WARM/COLD)
           - Marketing automation: DB-driven nudge + follow-up sequences
           - amoCRM integratsiyasi (lead + contact yaratish, lead score bilan)

webapp/    React + TypeScript + Vite — Telegram Mini App
           - /        : Mini App (kod-split: admin alohida chunk)
           - /admin/* : Admin panel (lazy loaded, ~4.7 KB gzip)
           - Editorial B2B landing (Yo'nalish A, qora-oltin, Manrope + Inter)
           - StandForm 4-step (kategoriya → shahar → kontakt → stend+telefon)
           - Telefon 1 tap (Telegram'dan, WebApp.requestContact)
           - WebAudio sound engine, haptic feedback, count-up animatsiya
           - Jonli qatlam: lib/countdown.ts, lib/live.ts, lib/motion.ts,
             lib/content.ts (uz/ru/en uchliklari), lib/ics.ts (.ics eksport)
           - Analytics client (batch, sendBeacon, anonymousId)

docs/      Stage 0 audit + roadmap (production holatining to'liq xaritasi)
```

## Konversiya uchun qilingan dizayn qarorlari

- **Birinchi ekran = event landing**: brend hero (logo + illustratsiya), sana
  (20–22 oktabr, 2026), joy (SOF EXPO, Samarqand), jonli "boshlanishiga N kun
  qoldi" countdown'i, bozor statistikasi va 6 davlat bayrog'i.
- **Ijtimoiy isbot**: 125M+ iste'molchi, 6 mamlakat, $58–78 mlrd bozor + Markaziy
  Osiyo bayroqlari (saytdagi ma'lumotlar).
- **Ishonch mikromatni**: "30 sekunda · Hozir to'lov yo'q · 24 soat ichida javob".
- **Erkin matn o'rniga tanlovlar**: yo'nalish (13 toifa), lavozim, stend turi
  (Premium 18 m² / Standart 9 m² / Maydon 36 m²+ / Aniq emas), faoliyat yili —
  hammasi bitta tap. Natijada amoCRMga toza, segmentatsiya qilinadigan ma'lumot tushadi.
- **Telefon 1 ta tugma bilan**: `WebApp.requestContact` orqali Telegram profildagi
  raqam (stend uchun majburiy, mehmon uchun ixtiyoriy).
- **Mehmon uchun "beydjik" va'dasi**: aralashuvchi tasdiq bosqichi commitment
  device sifatida ishlaydi.
- **Success ekranda "Keyin nima bo'ladi?"**: 3 qadamli kutish boshqaruvi + "Do'stlarga
  yuborish" (viral loop).
- **Jonli ijtimoiy isbot (Stage 8)**: oxirgi 72 soatdagi arizalar, bugungi son,
  band stendlar metri va shahar/kategoriya kesimi — `GET /api/webapp/live`dan.
  Ma'lumot kelmasa **raqam o'ylab topilmaydi**: blok statik faktlarga qaytadi va
  halol "server javob bermayapti" banner'i ko'rsatiladi.
- **Landing = funnelsa**: yo'nalish kartosi, paket va zal katakchisi bosilganda
  javob ariza formasi ichiga kiradi (bo'sh savoldan davom etadi).
- **Zarurlik o'lchangan**: countdown sekund bilan va fazaga mos (bosqich/boshlandi/
  tugadi), "38 ta premium stend" sig'imi esa bazadagi bandlar ayirmasidan chiqadi.
- **Harakat — maqsadli**: scroll-reveal, count-up, marquee, spotlight, magnetic,
  Ken Burns; hammasi `prefers-reduced-motion` bilan o'chadi (`docs/stage-8-live.md`).

## Foydalanuvchi oqimi

1. Foydalanuvchi bot linkini bosadi (masalan reklama linki: `t.me/FooderaExpoBot?start=ig__social__expo2026`).
2. Bot `/start` payload'idan UTM (source/medium/campaign) ni o'qib, foydalanuvchini bazaga saqlaydi.
3. Agar bu foydalanuvchi **avval ro'yxatdan o'tgan bo'lsa** — bot darhol "Siz allaqachon
   ro'yxatdan o'tgansiz ✅" deb javob beradi va forma umuman ochilmaydi (dublikat lidlarning oldi olinadi).
4. Aks holda, bot "Ro'yxatdan o'tish" tugmasi bilan Web App'ni ochadi.
5. Web App ichida:
   - **Til tanlanadi** (UZ/RU/EN) — logo bilan birga.
   - **Event landing** (editorial): hero + countdown, jonli ariza tasmasi, bo'limlar
     navigatsiyasi, 13 yo'nalish, 3 kunlik dastur, bozor tahlili, zal sxemasi,
     logistika, auditoriya, paketlar, savol-javob, menejer bloki. Sahna haqida
     to'liq: `docs/stage-8-live.md`.
   - **Stend yoki mehmon** tanlanadi.
   - **Stend** tanlansa (4 qadam): yo'nalish toifasi → shahar → ism, lavozim,
     kompaniya → stend turi, faoliyat yili, telefon (Telegram'dan 1 tap). Barchasi **majburiy**.
     Landing'da yo'nalish yoki paket kartasini bosish o'sha javobni forma
     oldidan olib kiradi va keyingi bo'sh savoldan davom etadi.
   - **Mehmon** tanlansa: ism, lavozim, kompaniya (ixtiyoriy), telefon (ixtiyoriy),
     so'ng — "Tadbir kuni albatta kelasizmi?" tasdiqlash bosqichi, maxsus beydjik va'dasi bilan.
6. Forma yuborilganda backend Telegram `initData`ni HMAC orqali tasdiqlaydi (soxta
   so'rovlarning oldini oladi), so'ng bazaga yozadi va **amoCRM**da lead + contact
   yaratadi (telefon builtin `PHONE` fieldga, qolgan ma'lumotlar custom field + to'liq izoh sifatida).
7. Bot foydalanuvchiga tasdiqlash xabarini yuboradi (stend — "24 soat ichida narxlar
   va joy rejasi bilan bog'lanamiz"; mehmon — "beydjik tayyorlaymiz" + sana/joy eslatmasi).
8. Foydalanuvchi botga qayta kirsam — "Siz allaqachon ro'yxatdan o'tgansiz" deb
   ko'rsatiladi, forma qayta to'ldirilmaydi.

Dublikatning oldi ikki bosqichda olinadi: (a) `/start`da darhol tekshiriladi,
(b) `Registration.userId` bazada **unique** — hatto ikkita so'rov bir vaqtda kelsa ham
faqat bittasi saqlanadi.

## O'rnatish

### 1. Telegram bot yaratish

1. [@BotFather](https://t.me/BotFather) orqali yangi bot yarating, `BOT_TOKEN`ni oling.
2. Web App'ni HTTPS domenga deploy qiling (pastga qarang), keyin BotFather'da:
   - `/mybots` → botingiz → **Bot Settings → Menu Button** → Web App URL sifatida
     `webapp`ning HTTPS manzilini kiriting (masalan `https://expo.yourdomain.com`).
3. UTM tracking uchun marketing linklarini quyidagi konventsiya bilan yasang:
   `https://t.me/FooderaExpoBot?start=manba__kanal__kampaniya`
   (masalan `start=instagram__reels__expo2026`). Ixtiyoriy ravishda `.env`dagi
   `UTM_MAP_JSON` orqali qisqa kodlarni (masalan `ig`) to'liq UTM to'plamiga
   moslashtirish mumkin.

### 2. Leads guruhi (Telegram)

Har bir yangi ariza (to'liq ma'lumot + UTM bilan) ichki Telegram supergruppasiga
ham avtomatik yuboriladi, shu yerdan `/stats` va `/leads` komandalari orqali
statistikani ko'rish mumkin.

1. Botni (`@fooderaexpobot`) shu guruhga a'zo sifatida qo'shing (guruhda xabar
   yuborish huquqi bilan — odatdagi a'zolik yetarli, admin shart emas).
2. `.env`dagi `LEADS_GROUP_CHAT_ID` guruh ID'siga mos kelishini tekshiring
   (default qiymat allaqachon `-1004298085307`ga o'rnatilgan).
3. Guruh ichida:
   - `/stats` — umumiy statistika: boshlaganlar, ro'yxatdan o'tganlar,
     konversiya, stend/mehmon nisbati, bugungi arizalar, amoCRM sinxronizatsiya
     holati, top UTM manbalar.
   - `/leads` — oxirgi 10 ta arizaning qisqa ro'yxati.
   Xavfsizlik uchun bu komandalar faqat `LEADS_GROUP_CHAT_ID` guruhida ishlaydi —
   botga shaxsiy yozilganda javob bermaydi.

### 3. amoCRM sozlash

1. amoCRM'da **Settings → Integrations → shaxsiy integratsiya** yarating, uzoq
   muddatli (long-lived) access token oling.
2. **Settings → Leads → Fields** bo'limida quyidagi custom fieldlarni yarating
   (Text turida): lavozim, telefon, kompaniya nomi, faoliyat muddati, faoliyat
   turi, stend turi, til, ro'yxat turi, kelish tasdig'i, UTM source/medium/campaign/
   content/term. Har birining ID raqamini `.env`dagi mos `AMOCRM_FIELD_*`
   o'zgaruvchisiga qo'ying (ID kiritilmagan fieldlar shunchaki o'tkazib yuboriladi —
   hech narsa buzilmaydi).
   Telefonga alohida e'tibor: telefon contact'ning **builtin `PHONE`** fieldiga
   yoziladi (qo'ng'iroq qilish uchun), `AMOCRM_FIELD_PHONE` esa lead'da dublikat
   ko'rinishda saqlash uchun ixtiyoriy.
3. Agar kerak bo'lsa, `AMOCRM_PIPELINE_ID`, `AMOCRM_STATUS_ID_STAND`,
   `AMOCRM_STATUS_ID_GUEST`ni belgilang, aks holda default voronka ishlatiladi.
4. Har bir lead'ga, custom fieldlardan tashqari, **to'liq ma'lumot yozilgan izoh
   (note)** ham qo'shiladi — shunday qilib field ID noto'g'ri sozlangan taqdirda
   ham hech qanday ma'lumot yo'qolmaydi.

### 4. Backend

```bash
cd backend
cp .env.example .env   # BOT_TOKEN, WEBAPP_URL, DATABASE_URL, AMOCRM_* to'ldiring
npm install
npx prisma migrate deploy
npm run dev             # yoki: npm run build && npm start
```

- `SKIP_BOT=1` — botni va follow-up shedulerni o'chirib, faqat API serverni
  ishga tushiradi (lokal test / faqat webapp kerak bo'lganda).

### 5. Web App

```bash
cd webapp
npm install
npm run dev              # lokal test uchun (Telegram tashqarisida ham ochiladi;
                         # /api/* so'rovlari localhost:3000 dagi backendga proksi qilinadi,
                         # API_PROXY_TARGET bilan boshqa portga yo'naltirish mumkin)
npm run build             # production build -> dist/
```

- `VITE_API_BASE_URL` — agar webapp va backend boshqa domenlarda bo'lsa (bo'lmasa,
  bir domen orqali `/api/` proksisi ishlatiladi, pastga qarang).
- `VITE_SHARE_URL` — "Do'stlarga yuborish" tugmasidagi havola (default:
  `https://t.me/FooderaExpoBot`).
- Telegram **tashqarisida** (masalan lokal preview'da) `initData` bo'lmagani
  uchun DEV build avtomatik demo rejimida ishlaydi — forma to'liq ko'rib
  chiqiladi, lekin real API'ga yozmaydi. Production build'da bu rejim
  umuman mavjud emas.

### 6. Fly.io — bitta image, bitta domen (tavsiya etiladi)

```bash
fly deploy          # repo TUBIDAN (root Dockerfile webapp+backend ni birga yig'adi)
```

Root `Dockerfile` webapp'ni yig'ib, backend image'iga kopiyalaydi va Express
`/` da statik fayllarni, `/api/*` da API'ni xizmat qiladi. Natijada Mini App va
API **bir xil HTTPS domenda** bo'ladi: CORS ham, `VITE_API_BASE_URL` ham kerak
bo'lmaydi — "oxirida xatolik" turidagi deploy muammolarining asosiy sababi
shu yo'l bilan yo'qoladi. BotFather'da Menu Button / web app URL sifatida
`https://<app>.fly.dev` ni ko'rsating (`WEBAPP_URL` secret'ini ham shunga
qo'ying).

### 7. Docker compose bilan birgalikda ishga tushirish

```bash
cp backend/.env.example backend/.env   # to'ldiring
docker compose up -d --build
```

Bu Postgres, backend (bot + API) va webapp (nginx orqali statik) konteynerlarini
ko'taradi. **webapp nginx'i `/api/` so'rovlarini backend konteyneriga proksi
qiladi** — ya'ni `VITE_API_BASE_URL` ko'rsatilmasa ham hammasi bir domenda
ishlaydi (Telegram Mini App faqat HTTPS manzillarni qabul qiladi — productionda
HTTPS ortida ishga tushiring).

## Event ma'lumotlari va kontenti

- Event faktalari (sana, joy, bozor raqamlari) `webapp/src/lib/event.ts` (form
  variantlari + inventar), `webapp/src/lib/content.ts` (uzun kontent: dastur,
  auditoriya, zal zonalari, transport — har biri `uz/ru/en` uchtilikda) va
  `webapp/src/i18n/locales/*.json` (UI matnlari) fayllarida.
- Sana/joy o'zgarsa: `webapp/src/lib/countdown.ts` (`EVENT_START_MS` /
  `EVENT_END_MS`) + `webapp/src/lib/content.ts` (`EVENT_FACTS`) + `lib/event.ts`
  — countdown, `.ics` fayl va zal rejasi hammasi shu bitta manbadan oladi.
- **Jonli feed**: `GET /api/webapp/live` (backend, auth talab qilmaydi,
  server-side 60 s cache) → `webapp/src/lib/live.ts` har 45 s da yangilaydi.
  Landing'dagi barcha raqamlar (bugungi arizalar, band stendlar, shaharlar
  kesimi, "endigina ro'yxatdan o'tdi" tasmasi) shu yerdan keladi. Endpoint
  ishlamasa — hech qanday raqam o'ylab topilmaydi: blok statik faktlarga
  qaytadi va "server javob bermayapti" banneri ko'rinadi.
  Inventar: `SITE_STAND_INVENTORY` env orqali (0 = blok yashirin).
- Xavfsizlik/privacy: `/live` faqat aggregate sonlar va **faqat ismning bosh
  harfi**ni qaytaradi, faqat oxirgi 72 soatlik yozuvlar (telefon, email, UTM
  yo'q). Rate limit: 40 so'rov/daqiqa/IP.
- Brend logotipi: `webapp/public/logo.png`. Hero illustratsiyasi:
  `webapp/public/assets/hero-illustration.jpg`, zal vizualizatsiyasi:
  `webapp/public/assets/venue-hall.jpg` — haqiqiy expo fotosi paydo bo'lsa shu
  fayllarni almashtiring va `npm run optimize-images` ni ishga tushiring
  (WebP/AVIF variantlarini qayta yasadida; `<picture>` avtomatik oladi).
- `npm run check-i18n` — uch locale pariteti + barcha `t()` kalitlari mavjudligi.
- `npm run check-render` — barcha ekranlar (landing 3 tilda, formalar, success)
  SSR'da render qilinadi: biror komponent uzilsa yoki kalit matn o'rniga
  `liveTagOn` kabi chiqib qolsa skript CI'ni buzadi.
- Davlat bayroqlari `webapp/public/assets/flags/` ichida.

## Muhim texnik eslatmalar

- **initData tekshiruvi**: Web App'dan keladigan har bir so'rov Telegram tomonidan
  imzolangan `initData`ni HMAC-SHA256 orqali tasdiqlaydi
  (`backend/src/lib/validateInitData.ts`). Bu soxta/robot so'rovlarning oldini oladi.
- **Telefon olish**: `WebApp.requestContact` (Bot API 7.2+) foydalanuvchidan bitta
  tasdiq bilan raqamni baham ko'radi. Telefon maydoniga **birinchi tap**dayoq
  raqam Telegram'dan avtomatik kiritiladi (maydon bo'sh bo'lsa, ekran ochilganda
  bir marta o'zi ham so'raydi); raqam callback'ning ikkinchi argumentida keladi —
  `initDataUnsafe`da emas (`webapp/src/lib/telegram.ts`). Versiya eskirsa yoki
  rad etilsa — qo'lda kiritish doim ochiq.
- **Xatolik ekrani ma'lumotni yo'qotmaydi**: submit muvaffaqiyatsiz bo'lsa
  "Qayta urinish" (o'sha payload bilan) va "Ma'lumotlarni tahrirlash" (forma
  to'ldirilgan holda ochiladi) tugmalari ko'rsatiladi, texnik sabab kichik
  matn bilan yoziladi — deploy muammosini joyida diagnostika qilish mumkin.
- **amoCRM sinxronizatsiyasi muvaffaqiyatsiz bo'lsa** ham foydalanuvchining ro'yxatdan
  o'tishi bazada saqlanib qoladi (`status = FAILED`, `syncError` maydonida sabab) —
  keyinchalik qo'lda yoki alohida retry job bilan qayta yuborish mumkin.
- **API javobi doim JSON bo'lishi shart**: webapp statik hostdan kelgan 200/HTML
  javobini (SPA fallback) xato deb hisoblaydi va yashirin "muvaffaqiyat" bilan lid
  yo'qolishining oldini oladi.
- Barcha matnlar `backend/src/bot/i18n.ts` (bot xabarlari) va
  `webapp/src/i18n/locales/*.json` (forma) fayllarida — yangi til yoki matn qo'shish
  shu fayllarni tahrirlash bilan cheklanadi.

---

## Admin panel (`/admin/*`)

Stage 5 da qo'shildi. Production: `https://<your-app>.fly.dev/admin`. Mini App
bilan bir xil origin (cookie SameSite=Lax, single-origin deploy).

**Birinchi admin yaratish** (serverda yoki fly ssh orqali):
```bash
cd backend
npx tsx scripts/createAdmin.ts <username> <password>
```

**Imkoniyatlar:**
- **Dashboard** — bugun/hafta/umumiy leadlar, 🔥 HOT count, funnel
  (4 qadam: app_open → landing → role → submit), breakdown chips
  (tier/language/status), recent events, recent admin actions.
- **Leadlar** — paginated ro'yxat (tier badge, ball, telefon, kompaniya),
  har bir lead uchun to'liq profil (12 ta maydon: telefon, kompaniya,
  shahar, faoliyat, yil, stend, UTM, amoCRM), CSV eksport
  (`/api/admin/leads.csv`, RFC 4180).
- **Ketma-ketliklar** — marketing sequences (nudge + follow-up) ni
  web'dan tahrirlash: enabled toggle, har step uchun afterMinutes,
  3 tilda matn, CTA flag. Saqlash transaction orqali (atomic).
- **Audit** — har bir admin amali (login, login_failed, dashboard_view,
  leads_export, sequence_update) + IP, target, meta. Parol/token hech
  qachon yozilmaydi.

**Xavfsizlik:**
- PBKDF2-SHA256 (120k iteratsiya) parol hash, 16 byte per-admin salt
- Session token 32 byte random, faqat sha256 hash DB'da
- 7 kunlik httpOnly cookie, SameSite=Lax
- 5 ta login urinish / 60s / IP rate limit
- Production HTTPS (Fly) — `secure: true`

**Keyingi (Stage 7+):** argon2id parol hash, IP allowlist, 2FA, keyingi
sessiya refresh, broadcast/workflow UI (hozir schema bor, UI yo'q).

---

## Lead scoring (Stage 2)

`backend/src/services/leadScoring.ts` — qoidalar:

| Signal | Ball |
|---|---|
| `type = STAND` | +30 |
| Telefon kiritilgan | +20 |
| `companyYears = 10_plus` | +15 |
| `companyYears = 3_10` | +10 |
| `spaceNeeded = premium` (18 m²) | +15 |
| `spaceNeeded = standard` (12 m²) | +10 |
| `spaceNeeded = area` (36+ m²) | +5 |
| `city = Toshkent\|Samarqand` | +5 |
| `GUEST, willAttend = true` | +15 |
| `GUEST, willAttend = false` | +5 |

**Tier:** `HOT ≥ 70`, `WARM 40-69`, `COLD < 40`. Ball `Registration.leadScore`,
tier `Registration.leadTier` (string). Lead guruh xabarida HOT lead
🚨🚨🚨 header bilan belgilanadi (1 soat ichida bog'lanish eslatmasi).

---

## Marketing automation (Stage 4)

DB-driven sequences (avval hardcode edi, endi admin panel orqali tahrirlanadi):

- **`nudge_unregistered`** — 3 ta step, 3h / 24h / 72h
  (bot ochgan, lekin formani yakunlamagan foydalanuvchilar uchun)
- **`followup_registered`** — 1 ta step, 24h
  (ro'yxatdan o'tganlarga minnatdorlik + do'stga ulashish)

Scheduler har **30 daqiqada** ishlaydi. Matn va vaqtlarni admin panel →
Ketma-ketliklar orqali o'zgartirsangiz, keyingi tick'da yangi matn
ishlatiladi (kod o'zgartirish shart emas).

Server start bo'lganda `seedDefaultSequences()` avtomatik chaqiriladi
(idempotent). Yangi sequence qo'shish uchun `services/seed.ts` ga
qo'shing yoki kelajakda admin UI orqali.

---

## Analytics (Stage 4)

`Event` modeli: `app_open`, `screen_view`, `cta_click`, `role_select`,
`field_focus`, `submit_success`, `submit_error`, va h.k. — webapp
`lib/analytics.ts` orqali yig'iladi. Batch (10 event yoki 5s),
`sendBeacon` visibilitychange/pagehide da.

**Endpoint:** `POST /api/webapp/track` — initData yoki anonymousId,
server tomonida 60 event/60s rate limit per IP.

**Funnel:** Dashboard da `appOpens → landings → roleSelects → submits`
(7 kunlik oyna) — konversiya va drop-off darhol ko'rinadi.

---

## Yangi env o'zgaruvchilar (Stage 2+)

`.env` ga qo'shing (ixtiyoriy, default qiymatlar bor):

```bash
# Admin panel
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<kamida 8 belgi>

# ixtiyoriy — qat'iy CORS (default: open, initData auth bilan)
CORS_ORIGIN=https://your-domain.com

# Stage 7: admin panel IP allowlist (ixtiyoriy, default: open)
# Bo'sh = hammaga ruxsat. 'any' = aniq disable. Misol:
# ADMIN_IP_ALLOWLIST="213.230.121.5, 92.38.0.0/16, 2001:db8::/32"
ADMIN_IP_ALLOWLIST=
```

**Muhim:** `BOT_TOKEN`, `DATABASE_URL`, `WEBAPP_URL`, `LEADS_GROUP_CHAT_ID`
Stage 0 dan beri kerak; qolgan `AMOCRM_*` ixtiyoriy (bo'lmasa leadlar
faqat guruhga tushadi).

---

## Deploy

### Fly.io (production, tavsiya)

```bash
cd ~/fooderabot
git fetch origin
git checkout arena/01a06223-fooderabot
fly deploy -a fooderabot-api           # repo ROOT'idan (root Dockerfile)
fly scale count 1 -a fooderabot-api   # 2 ta machine bo'lsa (409 Conflict oldini olish)
fly logs -a fooderabot-api            # tail logs
fly secrets list -a fooderabot-api    # secretlar ro'yxati
```

**Muhim eslatmalar:**
- `fly scale count 1` — **bitta machine**, aks holda Telegram bot
  polling da 409 Conflict qaytaradi va restart loop ga tushadi.
- Region `fra` (Frankfurt) — O'zbekistondan eng yaqin.
- Machine: shared-cpu-1x, 512MB RAM, $0/month (free tier).
- Health check: `/health` endpoint, 30s interval.
- Single-origin: `https://fooderabot-api.fly.dev` — Mini App ham,
  API ham, `/admin` ham shu URL da.

**Birinchi admin yaratish (production):**
```bash
fly ssh console -a fooderabot-api
cd /app
npx tsx scripts/createAdmin.ts admin <kuchli_parol>
```

### Database migration (yangi model qo'shganda)

`fly.toml`'dagi `[deploy].release_command` har bir `fly deploy`da
migration'ni avtomatik ishga tushiradi. Qo'lda tekshirish kerak bo'lsa:

```bash
fly ssh console -a fooderabot-api
cd /app
npx prisma migrate deploy
```

`prisma migrate deploy` **additive** migration qo'llaydi (mavjud
ma'lumot buzilmaydi). Yangi migration fayllari `backend/prisma/migrations/`
ostida. Stage 2, Stage 4 da 3 ta additive migration qo'shildi.

### Lokal dev (Docker compose)

```bash
cp backend/.env.example backend/.env  # to'ldiring
docker compose up -d --build
```

Postgres, backend (bot + API) va nginx orqali webapp konteynerlari
ko'tariladi. Nginx `/api/*` ni backend ga proxy qiladi.

---

## Stage holati

| Stage | Holat | Asosiy natija |
|---|---|---|
| 0 — Audit | ✅ | `docs/stage-0-audit.md` (production holatining to'liq xaritasi) |
| 1 — Editorial landing | ✅ | Yangi landing (qora-oltin), 4 stend paketi, 201 i18n kalit |
| 2 — Journey + scoring | ✅ | StandForm 4-step (shahar), lead score (HOT/WARM/COLD) |
| 3 — Motion + sound | ✅ | Haptic, WebAudio (0 KB), count-up, screen transitions |
| 4 — Backend analytics + admin | ✅ | Event model, track endpoint, sequences, admin auth |
| 5 — Admin panel UI | ✅ | Login, dashboard, leads, sequences, audit, CSV |
| 6 — Hardening + QA | ✅ | Rate limit, security headers, README, deploy hujjati |
| 7 — Marketing engine | ✅ | Broadcast composer, workflow engine, AVIF images, argon2id, IP allowlist |
| 8 — Jonli qatlam + harakat | ✅ | `GET /api/webapp/live`, jonli tasdiq bloklari, motion/tick layer, dastur + zal sxemasi, `.ics`, `docs/stage-8-live.md` |

**Total:** 30+ commit, 5 ta additive migration, 9 ta yangi model,
443 i18n kalit, 103 KB gzip Mini App + 8 KB alohida admin chunk.

### Tekshiruvlar (deploy/masalan oldidan)

```bash
cd webapp && npm run check-i18n    # 443 kalit × uz/ru/en + t() havolalari + content.ts uchliklari
cd webapp && npm run check-render  # barcha ekranlarni 3 tilda SSR qilib render (props buzilsa fail)
cd webapp && npm run build && cd ../backend && npm run check:live  # /live shakli, cache, PII sizmasi
```

---

## Marketing engine (Stage 7)

### Broadcast (rassilka)
- Admin `/admin` → "Rassilka" — 3 tilda composer, 8 ta segment
  preset chip (Barcha / Stand / Mehmon / HOT / Toshkent / Samarqand /
  Telefon / Oxirgi 7 kun), ixtiyoriy rasm (bot token orqali Telegram'ga
  yuklanadi, file_id saqlanadi), "Hozir yuborish" yoki "Belgilangan
  vaqtda"
- Inline 3-til preview (Telegram bubble ko'rinishida)
- Scheduler: 30s tick, ≤25 msg/s (40ms delay)
- Progress bar (real-time poll 5s), cancel button
- Audience 0 bo'lsa — "auditoriya bo'sh" ogohlantirish, broadcast DONE

### Workflow
- Trigger: `new_lead` / `lead_hot` / `drop_off` / `manual`
- Conditions: type/leadTier/city/language/hasPhone/minScore
- Actions: `send_message` (3 til), `tag_user`, `notify_admins`
  (guruhga yuborish)
- Idempotent — bir xil workflow bir xil user/event uchun 1 marta
- Default workflow'lar avtomatik seed:
  - "HOT lead → ping admins" — yangi HOT leadda guruhga 🚨
  - "Drop-off 24h → tag" — 24 soat ichida registratsiya qilmagan
    userlarni belgilash (keyin broadcast bilan targ'ib qilish)

### Xavfsizlik (Stage 7)
- **argon2id** parol hash (m=19MiB, t=2, p=1, OWASP 2023+). Eski
  PBKDF2 hashlari avtomatik argon2id ga upgrade (login ulanganda
  transparent).
- **IP allowlist** (`ADMIN_IP_ALLOWLIST`): IPv4/IPv6, CIDR, `any`.
  Default fail-open. Production'da ofis+uy IP'larini belgilang.
- Rate limit: track 60/min, submit 10/min, login 5/min, IP allowlist
  qo'shimcha qatlam sifatida ishlaydi.

### Image optimallashtirish
- `npm run build` `scripts/optimize-images.mjs` ni ishga tushiradi
  (sharp asosida)
- Hero rasm: 260 KB JPG → 80 KB AVIF / 159 KB WebP (budget ≤120 KB)
- Bayroqlar: o'rtacha 18 KB → 2-3 KB
- `<picture>` elementi brauzerni eng yengil formatga yo'naltiradi
