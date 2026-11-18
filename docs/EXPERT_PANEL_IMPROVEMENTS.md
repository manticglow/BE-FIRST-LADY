# 🎩 تحسينات لجنة الخبراء السبعة

> جلسة مراجعة شاملة من 7 خبراء متخصّصين · نوفمبر 2026
> 64 توصية · تطبيق 24 أهمّها في هذه الدفعة

---

## 👥 اللجنة

| | الخبير | التركيز |
|---|---|---|
| 1 | 🔐 **مهندس الدخول والخروج** | Auth, Sessions, Login UX |
| 2 | 💳 **مهندس عودة الدفع** | Payment Return, Success/Fail |
| 3 | 🧾 **خبير الفواتير والـZATCA** | Invoices, QR, PDF, Compliance |
| 4 | 🎨 **مخرج تصميم الفخامة** | Luxury Visual Finish |
| 5 | 📱 **مهندس الموبايل والـPWA** | iOS Safari, Touch, Standalone |
| 6 | 📈 **خبير تحويل الحجوزات** | Funnel Optimization |
| 7 | ✒️ **مصمم المحتوى العربي** | Microcopy, Brand Voice |

---

## ✅ ما تمّ تنفيذه في هذه الدفعة

### 🛡 إصلاحات حرجة (CRITICAL)

| # | الإصلاح | الملف |
|---|---|---|
| 1 | **Webhook ما كان يحدّث حالة الحجز** — يُحدّث `bookings.payment_status` + `status` الآن | `api/payments/webhook/moyasar/route.ts` |
| 2 | **Idempotency للـwebhook** — يمنع الخصم المزدوج للنقاط/البطاقات | `webhook/moyasar` + `payment-idempotency.sql` |
| 3 | **QR Code محلّي** — بدل `api.qrserver.com` اللي يُسرّب البيانات | `lib/zatca.ts` + `qrcode` npm |
| 4 | **maximumScale=1 محذوف** — انتهاك WCAG + ممنوع من Apple PWA | `app/layout.tsx` |
| 5 | **statusBarStyle** صحّح من `black-translucent` لـ`default` — أيقونات واضحة على كريم | `app/layout.tsx` |
| 6 | **Header safe-area-inset-top** — ما يُقطع تحت Dynamic Island | `components/layout/Header.tsx` |
| 7 | **GET /api/auth/logout محذوف** — ثغرة CSRF + prefetch | `api/auth/logout/route.ts` |
| 8 | **Bottom nav يختفي عند الكيبورد** + يخفي عند التمرير | `components/mobile/MobileBottomNav.tsx` |

### 🌸 ميزات جديدة (Signature Moments)

| # | الميزة | الملف |
|---|---|---|
| 9 | **صفحة نجاح الحجز الاحتفاليّة** — خطّ يد "نعدّ لكِ الخزامى" | `app/account/bookings/[id]/success/page.tsx` |
| 10 | **إضافة للتقويم (.ics)** — مع تذكير قبل ساعتين | `components/booking/SuccessActions.tsx` |
| 11 | **مشاركة واتساب تلقائيّة** | `SuccessActions.tsx` |
| 12 | **فاتورة العميلة الضريبيّة** — مع RLS وطباعة A4 | `app/account/bookings/[id]/invoice/page.tsx` |
| 13 | **زر تحميل PDF** للفاتورة (native print) | `components/account/InvoicePrintButton.tsx` |
| 14 | **Logout Modal فاخر** — تأكيد + توست وداعي + delay | `components/auth/LogoutButton.tsx` |
| 15 | **Payment Interstitial** — شاشة انتقاليّة آمنة | `components/payment/PaymentInterstitial.tsx` |
| 16 | **تأكيد واتساب تلقائي بعد الدفع الناجح** — من الـwebhook | `webhook/moyasar/route.ts` |

### 📱 موبايل

| # | الإصلاح | الملف |
|---|---|---|
| 17 | **autoComplete + inputMode + enterKeyHint** على كل حقول الدخول | `login/*`, `signup/*` |
| 18 | **autoComplete="one-time-code"** — SMS autofill على iOS | `login/phone/page.tsx` |
| 19 | **pattern="05[0-9]{8}"** — تحقق فوري من رقم الجوال | signup + login |
| 20 | **scrollMarginBottom: 120px** — الحقل ما يختفي تحت bottom nav | كل inputs |

### ✒️ صوت العلامة

| # | الإصلاح | الملف |
|---|---|---|
| 21 | **BRAND_VOICE مركزي** — SIGNATURE + SUCCESS + warmError + AUTH + BOOKING | `lib/brand-voice.ts` |
| 22 | **translateAuthError** — ترجمة كل أخطاء Supabase للعربيّة الفخمة | `lib/auth-errors.ts` |
| 23 | **كلمة "فشل" استُبدلت** في signup + login بـwarmError | `login/*`, `signup/*` |
| 24 | **8 حروف minimum للـpassword** (كان 6) | `signup/page.tsx` |

### 🎨 تحسينات بصريّة

| # | الإصلاح | الملف |
|---|---|---|
| 25 | **خط يد `Pinyon Script`** — للّحظات التوقيعيّة | `app/layout.tsx` + CSS variable |
| 26 | **ken-burns بطّأ من 15s لـ25s** — فخامة هادئة | `app/globals.css` |

---

## 🗄️ تغييرات قاعدة البيانات

### الملف: `supabase/apply/payment-idempotency.sql`

```sql
-- عمود idempotency
ALTER TABLE payment_intents ADD COLUMN discounts_applied_at TIMESTAMPTZ;

-- فاتورة تسلسلي
ALTER TABLE bookings 
  ADD COLUMN invoice_number TEXT UNIQUE,
  ADD COLUMN invoice_issued_at TIMESTAMPTZ;

-- دالة لحجز رقم ذريّاً
CREATE FUNCTION allocate_invoice_number(p_booking_id UUID) RETURNS TEXT;
```

---

## 📦 حزم جديدة

```json
"qrcode": "^1.5.4",
"@types/qrcode": "^1.5.5"
```

---

## 🚀 خطوات التفعيل

### 1. شغّلي الـSQL
```
Supabase SQL Editor → انسخي:
supabase/apply/payment-idempotency.sql → Run
```

### 2. انتظري Vercel يبني (3-4 دقائق)

### 3. جرّبي:
- ✅ `/account/bookings/[id]/success` — بعد أي دفعة ناجحة
- ✅ `/account/bookings/[id]/invoice` — تحميل PDF
- ✅ `/login` + `/login/phone` — autoComplete يعمل
- ✅ شريط الحالة واضح على iPhone
- ✅ الـbottom nav يختفي مع الكيبورد

---

## 📋 التوصيات المتبقّية (للمرحلة القادمة)

### من الخبير 2 · الدفع
- [ ] client يستدعي `/api/payments/verify/[intentId]` بـpolling
- [ ] Apple Pay button مستقلّ (خارج moyasar card)
- [ ] recovery للتبويب المُغلق

### من الخبير 3 · الفواتير
- [ ] Credit Note system للمرتجعات
- [ ] إيميل الفاتورة التلقائي بعد الدفع
- [ ] `allocate_invoice_number()` RPC call من الـwebhook

### من الخبير 4 · التصميم
- [ ] توحيد نظام الـradius ([2px] + [20px])
- [ ] استبدال الـemojis بأيقونات lucide
- [ ] loyalty tiers في عائلة ذهبيّة موحّدة

### من الخبير 6 · التحويل
- [ ] Guest Checkout (بدون تسجيل) — +25-40%
- [ ] Day Pills بدل native date picker
- [ ] First-visit offer banner
- [ ] Abandoned cart WhatsApp recovery

### من الخبير 7 · المحتوى
- [ ] استبدال كلمة "فشل" في 40+ موضع آخر
- [ ] توحيد توقيع الإيميل
- [ ] قوالب WhatsApp بصوت علامي موحّد
- [ ] تخصيص التوست بالاسم الأوّل في كل مكان

---

**Commit:** `feat: expert-panel improvements · phase 1 of 2`  
**البناء:** ✅ ناجح  
**التوصيات المُنفّذة:** 26 / 64  
**الحالة:** جاهز للـDeploy
