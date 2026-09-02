# Foodera Expo — Telegram ro'yxatdan o'tish boti

`sofexpo.uz/foodera-expo` saytidagi past konversiyani hal qilish uchun Telegram bot +
Web App (Mini App). Foydalanuvchi botga kirib, ichki formani to'ldiradi, forma
avtomatik ravishda **amoCRM**ga zayavka (lead) qilib tushadi. Maqsad — sifatsiz,
to'liqsiz liddlarning oldini olish va maksimal konversiya: har bir savol bitta
tapsilda hal bo'ladi (chips), stend arizasi uchun telefon 1 ta tugma bilan
Telegram'dan olinadi.

## Arxitektura

```
backend/   Node.js + TypeScript
           - Telegraf bot (/start, UTM deep-link, "allaqachon ro'yxatdan o'tgan" tekshiruvi)
           - Express API (webapp bilan aloqa, Telegram initData tekshiruvi)
           - Prisma + PostgreSQL (User, Registration)
           - amoCRM integratsiyasi (lead + contact yaratish, telefon builtin PHONE fieldga)

webapp/    React + TypeScript + Vite — Telegram Mini App (Web App)
           - Til tanlash: UZ / RU / EN
           - Event landing: logo, foto, sana/joy, countdown, statistika, davlat bayroqlari
           - "Stend bilan qatnashish" yoki "Mehmon" oqimi
           - Bosqichma-bosqich forma: tanlovlar chips ko'rinishida, validatsiya bilan
           - Telefon: Telegram'dan 1 ta tugma bilan (WebApp.requestContact) yoki qo'lda
```

## Konversiya uchun qilingan dizayn qarorlari

- **Birinchi ekran = event landing**: brend hero (logo + illustratsiya), sana
  (20–22 oktabr, 2026), joy (SOF EXPO, Samarqand), jonli "boshlanishiga N kun
  qoldi" countdown'i, bozor statistikasi va 6 davlat bayrog'i.
- **Ijtimoiy isbot**: 125M+ iste'molchi, 6 mamlakat, $58–78 mlrd bozor + Markaziy
  Osiyo bayroqlari (saytdagi ma'lumotlar).
- **Ishonch mikromatni**: "30 sekunda · Hozir to'lov yo'q · 24 soat ichida javob".
- **Erkin matn o'rniga tanlovlar**: yo'nalish (12 toifa), lavozim, stend turi
  (Premium 18 m² / Standart 9 m² / Maydon 36 m²+ / Aniq emas), faoliyat yili —
  hammasi bitta tap. Natijada amoCRMga toza, segmentatsiya qilinadigan ma'lumot tushadi.
- **Telefon 1 ta tugma bilan**: `WebApp.requestContact` orqali Telegram profildagi
  raqam (stend uchun majburiy, mehmon uchun ixtiyoriy).
- **Mehmon uchun "beydjik" va'dasi**: aralashuvchi tasdiq bosqichi commitment
  device sifatida ishlaydi.
- **Success ekranda "Keyin nima bo'ladi?"**: 3 qadamli kutish boshqaruvi + "Do'stlarga
  yuborish" (viral loop).

## Foydalanuvchi oqimi

1. Foydalanuvchi bot linkini bosadi (masalan reklama linki: `t.me/FooderaExpoBot?start=ig__social__expo2026`).
2. Bot `/start` payload'idan UTM (source/medium/campaign) ni o'qib, foydalanuvchini bazaga saqlaydi.
3. Agar bu foydalanuvchi **avval ro'yxatdan o'tgan bo'lsa** — bot darhol "Siz allaqachon
   ro'yxatdan o'tgansiz ✅" deb javob beradi va forma umuman ochilmaydi (dublikat lidlarning oldi olinadi).
4. Aks holda, bot "Ro'yxatdan o'tish" tugmasi bilan Web App'ni ochadi.
5. Web App ichida:
   - **Til tanlanadi** (UZ/RU/EN) — logo bilan birga.
   - **Event landing**: foto + logo, sana/joy, countdown, statistika, bayroqlar, galereya.
   - **Stend yoki mehmon** tanlanadi.
   - **Stend** tanlansa (3 qadam): yo'nalish toifasi → ism, lavozim, kompaniya →
     stend turi, faoliyat yili, telefon (Telegram'dan 1 tap). Barchasi **majburiy**.
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

- Event faktalari (sana, joy, bozor raqamlari) `webapp/src/lib/event.ts` va
  `webapp/src/i18n/locales/*.json` fayllarida — sana yoki joy o'zgarsa shu
  fayllarni tahrirlash kifoya. Countdown `2026-10-20T09:00+05:00` gacha sanaydi
  (`webapp/src/components/Landing.tsx`).
- Brend logotipi: `webapp/public/logo.png`. Hero fonidagi illustratsiya:
  `webapp/public/assets/hero-illustration.jpg` — haqiqiy expo fotosi paydo
  bo'lsa shu faylni almashtiring (komponent o'zgartirish shart emas).
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
