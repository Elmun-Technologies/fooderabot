# Foodera Expo — Telegram ro'yxatdan o'tish boti

`sofexpo.uz/foodera-expo` saytidagi past konversiyani hal qilish uchun Telegram bot +
Web App (Mini App). Foydalanuvchi botga kirib, ichki formani to'ldiradi, forma
avtomatik ravishda **amoCRM**ga zayavka (lead) qilib tushadi. Maqsad — sifatsiz,
to'liqsiz liddlarning oldini olish: barcha maydonlar majburiy, va bir foydalanuvchi
faqat bitta marta ro'yxatdan o'ta oladi.

## Arxitektura

```
backend/   Node.js + TypeScript
           - Telegraf bot (/start, UTM deep-link, "allaqachon ro'yxatdan o'tgan" tekshiruvi)
           - Express API (webapp bilan aloqa, Telegram initData tekshiruvi)
           - Prisma + PostgreSQL (User, Registration)
           - amoCRM integratsiyasi (lead + contact yaratish)

webapp/    React + TypeScript + Vite — Telegram Mini App (Web App)
           - Til tanlash: UZ / RU / EN
           - "Stend bilan qatnashish" yoki "Mehmon" oqimi
           - Bosqichma-bosqich forma, validatsiya bilan
```

## Foydalanuvchi oqimi

1. Foydalanuvchi bot linkini bosadi (masalan reklama linki: `t.me/FooderaExpoBot?start=ig__social__expo2026`).
2. Bot `/start` payload'idan UTM (source/medium/campaign) ni o'qib, foydalanuvchini bazaga saqlaydi.
3. Agar bu foydalanuvchi **avval ro'yxatdan o'tgan bo'lsa** — bot darhol "Siz allaqachon ro'yxatdan o'tgansiz ✅" deb javob beradi va forma umuman ochilmaydi (dublikat lidlarning oldi olinadi).
4. Aks holda, bot "Ro'yxatdan o'tish" tugmasi bilan Web App'ni ochadi.
5. Web App ichida:
   - **Stend bilan qatnashmoqchimi yoki mehmon bo'lib keladimi?** — birinchi savol, 3 tilda bir vaqtda ko'rsatiladi.
   - Til tanlanadi (UZ/RU/EN) — shundan keyingi barcha matnlar shu tilda.
   - **Stend** tanlansa: lavozim, ism-familiya, kompaniya nomi, kompaniya necha yildan beri faoliyat yuritishi, faoliyat turi, kerakli joy (m²) — barchasi **majburiy**.
   - **Mehmon** tanlansa: lavozim, ism-familiya, kompaniya nomi (ixtiyoriy), so'ngida — "Tadbir kuni albatta kelasizmi?" tasdiqlash bosqichi, maxsus beydjik va'dasi bilan qiziqtiriladi.
6. Forma yuborilganda backend Telegram `initData`ni HMAC orqali tasdiqlaydi (soxta so'rovlarning oldini oladi), so'ng bazaga yozadi va **amoCRM**da lead + contact yaratadi (barcha maydonlar custom field sifatida, shu jumladan UTM).
7. Bot foydalanuvchiga tasdiqlash xabarini yuboradi (stend — "operatorlarimiz bog'lanadi"; mehmon — "beydjik tayyorlaymiz" xabari).
8. Foydalanuvchi botga qayta kirsa (yoki Web App'ni qayta ochsa) — "Siz allaqachon ro'yxatdan o'tgansiz" deb ko'rsatiladi, forma qayta to'ldirilmaydi.

Dublikatning oldi ikki bosqichda olinadi: (a) `/start`da darhol tekshiriladi, (b) `Registration.userId` bazada **unique** — hatto ikkita so'rov bir vaqtda kelsa ham faqat bittasi saqlanadi.

## O'rnatish

### 1. Telegram bot yaratish

1. [@BotFather](https://t.me/BotFather) orqali yangi bot yarating, `BOT_TOKEN`ni oling.
2. Web App'ni HTTPS domenga deploy qiling (pastga qarang), keyin BotFather'da:
   - `/mybots` → botingiz → **Bot Settings → Menu Button** → Web App URL sifatida `webapp`ning HTTPS manzilini kiriting (masalan `https://expo.yourdomain.com`).
3. UTM tracking uchun marketing linklarini quyidagi konventsiya bilan yasang:
   `https://t.me/FooderaExpoBot?start=manba__kanal__kampaniya`
   (masalan `start=instagram__reels__expo2026`). Ixtiyoriy ravishda `.env`dagi
   `UTM_MAP_JSON` orqali qisqa kodlarni (masalan `ig`) to'liq UTM to'plamiga
   moslashtirish mumkin.

### 2. amoCRM sozlash

1. amoCRM'da **Settings → Integrations → shaxsiy integratsiya** yarating, uzoq
   muddatli (long-lived) access token oling.
2. **Settings → Leads → Fields** bo'limida quyidagi custom fieldlarni yarating
   (Text turida): lavozim, kompaniya nomi, faoliyat muddati, faoliyat turi,
   kerakli joy, til, ro'yxat turi, kelish tasdig'i, UTM source/medium/campaign/
   content/term. Har birining ID raqamini `.env`dagi mos `AMOCRM_FIELD_*`
   o'zgaruvchisiga qo'ying (ID kiritilmagan fieldlar shunchaki o'tkazib
   yuboriladi — hech narsa buzilmaydi).
3. Agar kerak bo'lsa, `AMOCRM_PIPELINE_ID`, `AMOCRM_STATUS_ID_STAND`,
   `AMOCRM_STATUS_ID_GUEST`ni belgilang, aks holda default voronka ishlatiladi.
4. Har bir lead'ga, custom fieldlardan tashqari, **to'liq ma'lumot yozilgan
   izoh (note)** ham qo'shiladi — shunday qilib field ID noto'g'ri
   sozlangan taqdirda ham hech qanday ma'lumot yo'qolmaydi.

### 3. Backend

```bash
cd backend
cp .env.example .env   # BOT_TOKEN, WEBAPP_URL, DATABASE_URL, AMOCRM_* to'ldiring
npm install
npx prisma migrate deploy
npm run dev             # yoki: npm run build && npm start
```

### 4. Web App

```bash
cd webapp
npm install
npm run dev              # lokal test uchun (Telegram tashqarisida ham ochiladi)
npm run build             # production build -> dist/
```

`VITE_API_BASE_URL` orqali backend API manzilini bering (agar webapp va
backend boshqa domenlarda bo'lsa).

### 5. Docker bilan birgalikda ishga tushirish

```bash
cp backend/.env.example backend/.env   # to'ldiring
docker compose up -d --build
```

Bu Postgres, backend (bot + API) va webapp (nginx orqali statik) konteynerlarini
ko'taradi. Productionda webapp va backend HTTPS ortida (masalan Nginx/Traefik
reverse proxy yoki Cloudflare) bo'lishi shart — Telegram Web App faqat HTTPS
manzillarni qabul qiladi.

## Muhim texnik eslatmalar

- **initData tekshiruvi**: Web App'dan keladigan har bir so'rov Telegram
  tomonidan imzolangan `initData`ni HMAC-SHA256 orqali tasdiqlaydi
  (`backend/src/lib/validateInitData.ts`). Bu soxta/robot so'rovlarning
  oldini oladi — shu bois sifatsiz liddlar manbasining katta qismi yopiladi.
- **amoCRM sinxronizatsiyasi muvaffaqiyatsiz bo'lsa** ham foydalanuvchining
  ro'yxatdan o'tishi bazada saqlanib qoladi (`status = FAILED`,
  `syncError` maydonida sabab) — keyinchalik qo'lda yoki alohida retry job
  bilan qayta yuborish mumkin.
- Barcha matnlar `backend/src/bot/i18n.ts` (bot xabarlari) va
  `webapp/src/i18n/locales/*.json` (forma) fayllarida — yangi til yoki matn
  qo'shish shu fayllarni tahrirlash bilan cheklanadi.
