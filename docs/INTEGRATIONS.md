# Integratsiyalar — Qadam-baqadam qo'llanma

## 1. AmoCRM ulash

### Qadam 1: Token olish
1. `https://yourdomain.amocrm.ru` ga kiring
2. **⚙️ Sozlamalar → Integratsiyalar → Shaxsiy integratsiya** bosing
3. Nomi: `Foodera Bot`, tavsif: yozing
4. **Scopes**: `leads`, `contacts`, `notes` yoqing
5. **Saqlash** → Sizga `client_id`, `client_secret`, `authorization_code` beriladi
6. Shu kod bilan `access_token` va `refresh_token` olinadi

### Qadam 2: Custom fieldlar yaratish
AmoCRM → **⚙️ Sozlamalar → Sotuvlar → Maydonlar** → Yangi maydon:

| Maydon nomi | Turi | AMOCRM_FIELD_* env |
|---|---|---|
| Lavozim | Text | AMOCRM_FIELD_POSITION |
| Kompaniya | Text | AMOCRM_FIELD_COMPANY_NAME |
| Faoliyat yili | Text | AMOCRM_FIELD_COMPANY_YEARS |
| Faoliyat turi | Text | AMOCRM_FIELD_COMPANY_ACTIVITY |
| Stend turi | Text | AMOCRM_FIELD_SPACE_NEEDED |
| Til | Text | AMOCRM_FIELD_LANGUAGE |
| Ro'yxat turi | Text | AMOCRM_FIELD_REG_TYPE |
| Kelish tasdig'i | Text | AMOCRM_FIELD_WILL_ATTEND |
| Telegram | Text | AMOCRM_FIELD_TELEGRAM_USERNAME |
| UTM Source | Text | AMOCRM_FIELD_UTM_SOURCE |
| UTM Medium | Text | AMOCRM_FIELD_UTM_MEDIUM |
| UTM Campaign | Text | AMOCRM_FIELD_UTM_CAMPAIGN |

Har birining **ID raqamini** oling (maydon URL'da ko'rinadi, masalan `.../field/123456`).

### Qadam 3: Pipeline va Status ID
1. **Sotuvlar voronkasi** → Stend va Mehmon uchun alohida statuslar yarating
2. Status URL'dan ID ni oling

### Qadam 4: .env sozlash
```bash
AMOCRM_BASE_URL=https://yourdomain.amocrm.ru
AMOCRM_ACCESS_TOKEN=your_long_lived_token
AMOCRM_PIPELINE_ID=12345678
AMOCRM_STATUS_ID_STAND=12345679
AMOCRM_STATUS_ID_GUEST=12345680
AMOCRM_FIELD_POSITION=123456
AMOCRM_FIELD_PHONE=123457
AMOCRM_FIELD_COMPANY_NAME=123458
# ... qolgan fieldlar
```

### Ishlash tartibi
Foydalanuvchi forma to'ldirganda → backend avtomatik ravishda:
- Lead yaratadi (custom fieldlar bilan)
- Contact yaratadi (telefon bilan)
- Note qo'shadi (to'liq ma'lumot)
- `status = SYNCED` ga o'zgartiradi

---

## 2. Meta Pixel (Facebook/Instagram reklama)

### Qadam 1: Pixel yaratish
1. `https://business.facebook.com/events_manager` ga kiring
2. **Veri to'plash → Web** → **Meta Pixel** yarating
3. Pixel ID ni oling (masalan `1234567890123456`)

### Qadam 2: .env qo'shish
```bash
VITE_META_PIXEL_ID=1234567890123456
```

### Qadam 3: Eventlar
Avtomatik track qilinadigan eventlar:
- `PageView` — sahifa ochilganda
- `Lead` — forma muvaffaqiyatli to'ldirilganda
- `ViewContent` — landing sahifasiga tushganda

### Qadam 4: Reklama sozlash
Facebook Ads Manager → **Konversiya eventlari** sifatida `Lead` ni tanlang.

---

## 3. Google Analytics 4

### Qadam 1: Property yaratish
1. `https://analytics.google.com` ga kiring
2. **Admin → Yangi property** → GA4 yarating
3. Measurement ID ni oling (masalan `G-XXXXXXXXXX`)

### Qadam 2: .env qo'shish
```bash
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Qadam 3: Eventlar
Avtomatik track qilinadigan eventlar:
- `page_view` — sahifa ochilganda
- `generate_lead` — forma to'ldirilganda
- `select_content` — rol tanlanganda

### Qadam 4: Google Ads bilan bog'lash (ixtiyoriy)
Google Analytics → **Admin → Google Ads bog'lash** → Konversiya tracking sozlang.

---

## 4. UTM tracking (allaqachon bor)

Reklama linklarini shu formatda yarating:
```
https://t.me/FooderaExpoBot?start=instagram__reels__expo2026
```

Yoki `UTM_MAP_JSON` orqali qisqa kodlar:
```json
{
  "ig": {"source": "instagram", "medium": "social", "campaign": "expo2026"},
  "fb": {"source": "facebook", "medium": "paid", "campaign": "expo2026"},
  "gg": {"source": "google", "medium": "cpc", "campaign": "expo2026"}
}
```

---

## 5. Ishga tushirish tartibi

1. `.env` faylni to'ldiring
2. `npm run build` — webapp build
3. `fly deploy` — productionga chiqaring
4. AmoCRM'da test lead yarating
5. Meta Pixel Helper (Chrome extension) bilan tekshiring
6. Google Analytics → Real-time da ko'ring
