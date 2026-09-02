# 8-bosqich — Saytga "jon berish" (live + motion + haqiqiy kontent)

> **Maqsad:** landing "chiroyli maket"dan haqiqiy ishlayotgan mahsulotga o'tishi.
> Kritika (foydalanuvchi xulosasi): *"nisbatan yaxshi, lekin soxtadek"*. Muammo dizaynda
> emas, **ma'lumot va harakat yo'qligida** edi: placeholder bo'limlar, hech
> narsaga ulanmagan kartochkalar, 30 soniyada bir marta yangilanadigan "countdown",
> va manbasiz raqamlar.

---

## 1. "Soxta" hissasi qayerdan kelardi

| # | Belgisi | Nima qilindi |
|---|---|---|
| 1 | `Eksponentlar — "Tez kunda e'lon qilinadi"` bo'sh bloki | Blok o'chirildi. O'rniga **Auditoriya** (kimlar keladi) + bazadagi **jonli ariza kesimi** (shahar, stend/mehmon nisbati) |
| 2 | Landing'dagi paketlar (6/12/18/20 m²) forma variantlaridan (9/18/36 m²) boshqacha edi | Ikkisi ham `STAND_TYPE_OPTIONS` bilan sinxron — 4 ta haqiqiy format: Standart 9, Premium 18, Ochiq maydon 36+, Maslahat |
| 3 | Countdown faqat `kun/soat/daq`, 30 s da bir marta, sanasiz | `lib/countdown.ts` — bitta manba, **sekund** bilan, tab yashirin bo'lsa to'xtaydi; hero, sticky bar va mobildagi dock bittan foydalanadi |
| 4 | Kartochkalar hech narsa qilmaydi ("Tanlash" → forma bo'sh ochilardi) | Paket / yo'nalish / zal zonasi **arizaga qiymatni olib kiradi** (`onStartStand(prefill)`), StandForm qolgan savoldan davom etadi |
| 5 | Har yerda bir xil matn: eyebrow = heading, "Tanlash" badge'da | Sarlavahlar bo'lindi (`packagesHeading`, `marketHeading`, `faqHeading`…), badge endi ma'lumotdan hisoblanadi |
| 6 | "Manager 15 daqiqada" va'dasi botning "24 soat" va'dasi bilan ziddi | Hamma joyda **24 soat** (landing + FAQ + manager bloki) |
| 7 | Emoji ikonkalar (🏢 🎟 🇿 🎉 ) | Brenddagi chiziq ikonkalar (`editorial/Icons.tsx`), bayroq emoji o'rniga UZ/RU/EN kodlari (Windows'da emoji bayroq harf ko'rinishida chiqadi) |
| 8 | Ovoz tugmasi matni hardcode English | `soundOn/soundOff/soundHint` 3 tilda |
| 9 | API ishlamasa — butun landing o'rniga "offline" ekrani | Endi landing baribir ochiladi, jonli bandda halol banner: "Server javob bermayapti" + telefon tugmasi |

---

## 2. Jonli ma'lumot qatlami (yagona haqiqat manbai)

```
backend/src/services/liveStats.ts   GET /api/webapp/live
  - registration.count (STAND/GUEST/today/7d/HOT)
  - groupBy: city, companyActivity, spaceNeeded
  - recent: oxirgi 72 soat, FAQAT ism bosh harfi + shahar + turi
  - inventory: SITE_STAND_INVENTORY − STAND soni (0 → blok yashirin)
  - 60 s server cache + single-flight (bir vaqtda 100 so'rov = 1 so'rov to'plami)
  - route: 40 so'rov/daq/IP, Cache-Control: public, max-age=45
  - har yangi ariza yaratilganda cache bekor qilinadi (registration.ts)

webapp/src/lib/live.ts   useLiveStats()
  - 45 s polling, tab yashirin bo'lsa to'xtaydi, ko'rinishga qaytsa darhol yangilaydi
  - xato → stats = null → HICH QANDAY RAQAM O'YLAB TOPILMAYDI:
      · hero chipi: "jami 38 ta stend" (sig'im — fakt)
      · live band: statik faktlar qatori (3 kun / 13 yo'nalish / 6 mamlakat / 24 soat)
      · zona raqamlari: "Bo'sh joylar hisobi vaqtincha mavjud emas"
  - DEV + Telegram'siz = belgilangan demo (`source: "dev"` → "Demo ma'lumotlar")
```

**Nima uchun xavfsiz:** endpoint public, lekin aggregate + bosh harf. Telefon,
email, UTM, kompaniya nomi, CRM statusi hech qachon chiqmaydi — buni
`npm run check:live` (backend) tekshiradi.

---

## 3. Harakat va interaktiv qatlam

| Blok | Nima "jonli" |
|---|---|
| `EdlNav` | Scroll o'tgach chiquvchi masthead + **scroll progress** (oltin chiziq) + bo'lim scroll-spy + sekundli countdown + CTA |
| `HeroEditorial` | Parallax + sekin "nafas oluvchi" art, grain, sarlavha **ma-so'z** yoziladi, sekund `flip` animatsiyasi, magnit tugma, shine sweep, bo'sh joy metri |
| `LiveBand` | Marquee tasmasi (hover'da to'xtaydi), raqam o'zgarsa **flash**, progress bar |
| `Categories` | 13 ta yo'nalish, ikonka hover'da aylantiriladi, pastki oltin chiziq scaleX, bosilsa forma to'ladi |
| `Program` | Kun bo'yicha tab + ko'chuvchi oltin indikator, elementlar stagger bilan kiradi, **.ics kalentarga qo'shish** |
| `Market` | Bozor animatsion barlari (in-view), count-up, bayroq hover |
| `Floorplan` | Interaktiv SVG zal: zona hover/focus, katakler band/qolgan (DB'dan), tanlash → ariza |
| `Venue` | Samarkand **jonli soati** (mahalliy vaqt), Ken Burns hover, xarita havolalari |
| `Audience` | Jonli ariza kesimi (bar chart), "demo" belgisi |
| `Packages` | Kursorni kuzatuvchi spotlight, masshtabli **stend kvadrati** (9→18→36 m²), badge = DB populyarligi |
| `FAQ` | `<details>` o'rniga o'lchangan accordion (grid-rows), belgi aylanadi |
| `ManagerCta` | **Ofis holati** (Toshkent vaqti 09–19): "ochiq / yopiq", navbat to'g'risida Jonli soni |
| `StickyCta` | Mobil dock: countdown + qolgan stend + CTA (footer yaqinida yashirin) |
| Flow ekranlari | Row entrance stagger + hover, til tanlashda haptika + ovoz |

Hammasi `prefers-reduced-motion` yoqilganda o'chadi (CSS `*` override +
`motion.ts` hook'lari).

---

## 4. Fayllar

```
webapp/src/lib/countdown.ts     + sana/soat/faza + Samarqand soati + ofis holati
webapp/src/lib/live.ts          + useLiveStats, fetch, DEV fixture, vaqt labeli
webapp/src/lib/motion.ts        + reduced motion, scrollY/progress, scroll-spy,
                                 spotlight, magnetic, scrollToId
webapp/src/lib/content.ts       + EVENT_FACTS, MARKET_*, PROGRAM, AUDIENCE,
                                 INCLUDED, VENUE_CARDS, HALL_ZONES (uz/ru/en)
webapp/src/lib/ics.ts           + .ics generator (kalendarga qo'shish)
webapp/src/components/editorial/{EdlNav,LiveBand,Categories,Program,Floorplan,
                                 Venue,Audience,StickyCta,Icons}.tsx   (yangi)
webapp/src/components/editorial/{HeroEditorial,Packages,Market,FAQ,
                                 ManagerCta,Footer,SoundToggle,Reveal,WhyEditorial}.tsx
webapp/src/components/editorial/Exhibitors.tsx                        (o'chirildi)
webapp/src/App.tsx              + onStartStand(prefill), apiDown holati,
                                 error-resume endi option-key bilan (raw)
webapp/src/components/{Landing,StandForm,GuestForm,RoleSelect,
                       LanguageSelect,SuccessScreen,Row}.tsx
webapp/public/assets/venue-hall.{jpg,webp,avif}                        (vizualizatsiya)
backend/src/services/liveStats.ts, backend/src/api/webapp.ts, backend/src/config.ts
```

**StandForm'dagi muhim tuzatish:** `initial` bosqichi endi "qaysi savol
to'lmagan" bo'yicha hisoblanadi (avval "oxirgi to'ldirilgan maydon" bo'yicha —
shuning uchun landing'dan tanlangan `spaceNeeded` foydalanuvchini 3 ta bo'sh
savol ortidagi 4-bosqichga tashlar edi). Xatolikdan keyingi "Ma'lumotlarni
tahrirlash" ham endi chip tanlovlarini to'g'ri tiklaydi (label emas, key).

---

## 5. Tekshiruvlar (repo'ga qo'shildi)

```bash
cd webapp  && npm run check-i18n    # 443 kalit × 3 til, barcha t() havolalari,
                                     # content.ts uz/ru/en uchliklari to'liq
cd webapp  && npm run check-render  # barcha ekranlar 3 tilda SSR'da render;
                                     # komponent uzilsa yoki kalit matn bo'lib
                                     # chiqib qolsa — fail
cd backend && npm run check:live    # /live shakli, cache, inventory, PII sizmasi
cd webapp  && npm run build         # 103 KB gzip JS (React bilan), 12 KB CSS
```

## 6. Keyingi qadam (tashkilotchidan kerak bo'lgan narsa)

1. **Rasmiy eksponent logotiplari** — `Audience` bloki hozir auditoriya va
   jonli statistikaga asoslangan; logotiplar kelsa `Exhibitors` devori
   qaytadi (1–2 qator kodeks + fayllar).
2. **Haqiqiy fotosuratlar** — `venue-hall.jpg` (zal vizualizatsiyasi) va hero
   ilustratsiyasi AI bilan chizilgan. Ko'rgazma fotosi bo'lsa, shu ikki faylni
   almashtirib `npm run optimize-images` ishlatsa bo'ldi — kod o'zgarmaydi.
   Eslatma: zal/reja "sxematik" deb belgilangan, haqiqiy foto bo'lmagan
   narsani foto qilib ko'rsatmaymiz.
3. **Aniq manzil** — `EVENT_FACTS.venue`da hozircha "SOF EXPO, Samarqand" +
   xarita havolasi. Ko'cha manzili bo'lsa, Venue blokiga bir qator qo'shiladi.
4. **Dastur** — `content.ts → PROGRAM` tashkilotchi dasturiga qarab
   yangilanadi (blokda "dastur yangilanmoqda" eslatmasi bor).
5. `SITE_STAND_INVENTORY` — zal sig'imi (hozir 38, saytdagi e'longa mos).
