# FOOTERA EXPO 2026 — Deploy qo'llanmasi

> Production deploy: `https://fooderabot-api.fly.dev`
> Region: `fra` (Frankfurt, EU)
> Stack: Fly.io (app + Postgres), Node 20, Express 4, Prisma 5, PostgreSQL 16

---

## 0. Talablar

- [flyctl](https://fly.io/docs/hands-on/install-flyctl/) o'rnatilgan
- `fly auth login` bajarilgan
- Repository clone: `git clone https://github.com/Elmun-Technologies/fooderabot.git`
- `BOT_TOKEN` (Telegram @BotFather)
- `WEBAPP_URL` (HTTPS, production domen)
- `LEADS_GROUP_CHAT_ID` (ichki lead guruh ID, default `-1004298085307`)

---

## 1. Birinchi marta sozlash

### 1.1 Fly app yaratish (bir marta)

```bash
cd ~/fooderabot
fly launch --no-deploy --name fooderabot-api --region fra
```

`fly.toml` allaqachon bor (`auto_stop=false`, `min_machines_running=1`).
Birinchi marta `fly launch` ko'p narsa so'raydi — defaultlarni qabul qiling.

### 1.2 Postgres yaratish (bir marta)

```bash
fly postgres create --name fooderabot-db --region fra
fly postgres attach fooderabot-db -a fooderabot-api
```

Bu `DATABASE_URL` ni avtomatik ravishda Fly secrets ga qo'shadi.

### 1.3 Secrets sozlash

```bash
# Majburiy
fly secrets set -a fooderabot-api \
  BOT_TOKEN="<telegram_bot_token>" \
  WEBAPP_URL="https://fooderabot-api.fly.dev" \
  LEADS_GROUP_CHAT_ID="-1004298085307"

# Ixtiyoriy (amoCRM)
fly secrets set -a fooderabot-api \
  AMOCRM_BASE_URL="https://yourcompany.amocrm.ru" \
  AMOCRM_ACCESS_TOKEN="<long_lived_token>" \
  AMOCRM_PIPELINE_ID="<id>" \
  AMOCRM_STATUS_ID_STAND="<id>" \
  AMOCRM_STATUS_ID_GUEST="<id>" \
  AMOCRM_FIELD_POSITION="<id>" \
  AMOCRM_FIELD_PHONE="<id>" \
  AMOCRM_FIELD_COMPANY_NAME="<id>" \
  AMOCRM_FIELD_COMPANY_YEARS="<id>" \
  AMOCRM_FIELD_COMPANY_ACTIVITY="<id>" \
  AMOCRM_FIELD_SPACE_NEEDED="<id>" \
  AMOCRM_FIELD_LANGUAGE="<id>" \
  AMOCRM_FIELD_REG_TYPE="<id>" \
  AMOCRM_FIELD_WILL_ATTEND="<id>" \
  AMOCRM_FIELD_TELEGRAM_USERNAME="<id>" \
  AMOCRM_FIELD_UTM_SOURCE="<id>" \
  AMOCRM_FIELD_UTM_MEDIUM="<id>" \
  AMOCRM_FIELD_UTM_CAMPAIGN="<id>" \
  AMOCRM_FIELD_UTM_CONTENT="<id>" \
  AMOCRM_FIELD_UTM_TERM="<id>"

# CORS qat'iylashtirish (ixtiyoriy, default: ochiq initData auth bilan)
fly secrets set -a fooderabot-api CORS_ORIGIN="https://fooderabot-api.fly.dev"
```

`fly secrets list -a fooderabot-api` — tekshirish.

### 1.4 Telegram bot sozlash

@BotFather da:
1. `/mybots` → bot tanlang → **Bot Settings → Menu Button** →
   Web App URL: `https://fooderabot-api.fly.dev`
2. `/setdomain` → `fooderabot-api.fly.dev`

### 1.5 Birinchi deploy

```bash
fly deploy -a fooderabot-api
```

Birinchi marta ~3-5 daqiqa (webapp build + image push + Postgres ulanish +
migration qo'llash). `fly logs -a fooderabot-api` bilan kuzating.

---

## 2. Keyingi deploylar

```bash
cd ~/fooderabot
git fetch origin
git checkout <branch>               # masalan arena/01a06223-fooderabot
fly deploy -a fooderabot-api         # repo ROOT'idan (root Dockerfile)
```

**Muhim:**
- `Dockerfile` **root** da — Express ham API, ham build qilingan webapp'ni
  **bitta origin**da beradi.
- `fly scale count 1` — agar 2 ta machine paydo bo'lsa, Telegram
  polling `409 Conflict` qaytaradi.

```bash
fly scale count 1 -a fooderabot-api   # agar kerak bo'lsa
```

---

## 3. Database migration

`fly.toml`'da `[deploy].release_command = "npx prisma migrate deploy"`
bor — har bir `fly deploy`da Fly avtomatik ravishda bitta vaqtinchalik
release machine'da migration'ni ishga tushiradi, yangi image machine'larga
chiqishidan oldin. Qo'lda ishga tushirish shart emas.

Qo'lda tekshirish yoki muammo debug qilish kerak bo'lsa:

```bash
fly ssh console -a fooderabot-api
cd /app
npx prisma migrate deploy
```

Barcha migration **additive** — mavjud qatorlar buzilmaydi.

---

## 4. Birinchi admin yaratish

Admin panel `/admin` da:

```bash
fly ssh console -a fooderabot-api
cd /app
npx tsx scripts/createAdmin.ts <username> <password>
```

Keyin `https://fooderabot-api.fly.dev/admin` ga kiring va shu
login + parol bilan tizimga kiring. 7 kunlik session.

---

## 5. Tekshirish

```bash
# Health
curl -s https://fooderabot-api.fly.dev/health
# {"ok":true}

# Logs (real-time)
fly logs -a fooderabot-api

# Machine status
fly status -a fooderabot-api
fly machine list -a fooderabot-api

# Postgres connection
fly postgres connect -a fooderabot-db
```

Production'ni tekshirish uchun 3 qadam checklist:
1. ✅ `curl /health` → `{"ok":true}`
2. ✅ Telegram'da `/start` yuboring → til tanlash chiqadi
3. ✅ Admin panel: `https://<app>.fly.dev/admin` → login → dashboard
   ma'lumot ko'rsatadi

---

## 6. Lokal dev (ixtiyoriy)

```bash
# Terminal 1: backend
cd backend
cp .env.example .env
# DATABASE_URL=postgresql://user:pass@localhost:5432/fooderabot
# BOT_TOKEN, WEBAPP_URL=http://localhost:5173 to'ldiring
npm install
npx prisma migrate dev
SKIP_BOT=1 npm run dev     # faqat API (bot'siz)

# Terminal 2: webapp
cd webapp
npm install
npm run dev                 # http://localhost:5173
```

`/api/*` so'rovlari Vite proxy orqali `http://localhost:3000` ga boradi
(default `API_PROXY_TARGET` bilan o'zgartirish mumkin).

`SKIP_BOT=1` — bot va follow-up scheduler o'chiriladi, faqat API
ishlaydi (test uchun qulay).

---

## 7. Tez-tez beriladigan savollar

### "Bot javob bermayapti"
- `fly logs -a fooderabot-api` — xatolarni ko'ring
- `fly machine list` — 2 ta machine bor-yo'qligini tekshiring
  (2 ta bo'lsa polling conflict)
- `fly secrets list` — `BOT_TOKEN` to'g'ri kiritilganmi

### "Arizalar saqlanmayapti"
- `fly postgres connect -a fooderabot-db` — DB ga kiring
- `SELECT COUNT(*) FROM "Registration";` — jami arizalar
- Logs'da "amoCRM sync failed" ko'rinadimi? `AMOCRM_*` env tekshiring

### "Admin panelga kira olmayapman"
- `fly ssh console` → `npx tsx scripts/createAdmin.ts admin yangi_parol`
- Browser'ning cookie'larini tozalang (eski session bo'lishi mumkin)

### "Bundle hajmi kattalashib ketdi"
- `cd webapp && npm run build` — `index-*.js` gzip hajmini ko'ring
- Budjet: Mini App ≤ 180 KB gzip, admin ≤ 30 KB gzip
- Yangi kutubxona qo'shsangiz izohlang (`framer-motion` 50+ KB, alternativa
  sifatida CSS transitions ishlating)

### "Xato: prisma generate failed"
- `fly ssh console -a fooderabot-api`
- `cd /app && npx prisma generate`
- Keyin `fly deploy` yoki restart

---

## 8. Backup

```bash
# Postgres backup
fly postgres backup create -a fooderabot-db

# Backup'larni ko'rish
fly postgres backup list -a fooderabot-db

# Restore (DIQQAT: mavjud ma'lumot ustiga yozadi)
fly postgres backup restore <backup-id> -a fooderabot-db
```

Production uchun kunlik avtomatik backup tavsiya etiladi
(Fly Postgres Pro+).

---

## 9. Monitoring

Fly.io dashboard: `https://fly.io/apps/fooderabot-api`

Yoki:
```bash
fly dashboard -a fooderabot-api
```

- **Metrics** — CPU, RAM, request count, response time
- **Logs** — real-time, search mumkin
- **Events** — deploy, scale, restart

Custom alerting uchun `fly alerts` (CPU > 80% 5 daqiqa davomida va h.k.).

---

## 10. Eslatma

- Production `https://fooderabot-api.fly.dev` (bitta app, bitta origin)
- Mini App, API, admin panel — hammasi shu URL
- Birinchi machine **FREE tier** (256MB RAM), 512MB uchun `fly scale memory 512`
- Stage 6 da xavfsizlik header'lar qo'shildi
  (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Rate limit: track 60/min/IP, submit 10/min/IP, login 5/min/IP

Deploy muammosida `fly logs` — ko'p hollarda o'zi aytadi.
