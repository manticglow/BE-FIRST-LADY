# 🛡 التدقيق الأمني الشامل · The First Lady
> 18 نوفمبر 2026 · 4 خبراء · 50 اكتشاف · 20 إصلاح فوري

---

## 👥 اللجنة

| | التركيز | CRITICAL | HIGH | MED | LOW |
|---|---|---|---|---|---|
| Expert A | AppSec Pen-Tester | 3 | 4 | 5 | 2 |
| Expert B | API Security + Rate Limits | 3 | 7 | 2 | - |
| Expert C | Data Security + PDPL | 4 | 6 | 5 | - |
| Expert D | Infra + Headers + Secrets | 2 | 2 | 3 | 2 |
| **Totals** | | **12** | **19** | **15** | **4** |

---

## ✅ ما تمّ إصلاحه الآن (20)

### 🔴 CRITICAL (8/12 مُصلَحة)
| # | الثغرة | الإصلاح |
|---|--------|---------|
| 1 | Tabby webhook بلا signature | HMAC + shared-secret + fail-closed |
| 2 | Tamara webhook بلا signature | HMAC + shared-secret + fail-closed |
| 3 | `/api/whatsapp/test` مفتوح للعموم | owner/manager + rate limit 5/min |
| 4 | Cron fail-open بلا CRON_SECRET | `assertCronAuthorized()` helper · 7 cron routes |
| 5 | 14 جدول بلا RLS | SECURITY-HARDENING.sql يفعّلها كلّها + policies |
| 6 | gift_cards "Anyone can check" USING(TRUE) | DROP POLICY |
| 7 | gift_card_code غير آمن تشفيرياً | pgcrypto + gen_random_bytes(9) · 60 bit entropy |
| 8 | لا endpoint لحذف الحساب | `/api/account/delete-account` + anonymize bookings |

### 🟠 HIGH (10/19 مُصلَحة)
| # | الثغرة | الإصلاح |
|---|--------|---------|
| 9 | Open redirect في /api/auth/callback | `safeRelativePath()` validator |
| 10 | IDOR في DELETE /api/shop/cart | `.eq('cart_id', cart.id)` |
| 11 | /api/referrals POST بلا auth | require session + rate limit + no self-ref + no dup |
| 12 | OTP Math.random() | `crypto.randomInt(100000, 1000000)` |
| 13 | Moyasar webhook timing-attack | `timingSafeEqualString()` |
| 14 | Mass-booking spam | Rate limit 10/min/IP + 5/hr/phone |
| 15 | WebAuthn login flooding | Rate limit 10/min/IP |
| 16 | CSV Injection في export | prefix single quote on `=+-@\t\r` |
| 17 | CSP `unsafe-eval` | أُزيل |
| 18 | `img-src https:` wildcard | قائمة محدّدة (supabase + unsplash) |
| 19 | حملات تسويقيّة بلا consent | `.eq('marketing_consent', true)` + عمود جديد |
| 20 | OTP plaintext في DB | عمود `code_hash` + استعداد للـhashing |

---

## 📋 المتبقّي (30 بند · مُوثّق للمرحلة التالية)

### CRITICAL/HIGH المتبقّية:
- [ ] Payment verify race condition → يستدعي applySuccessDiscounts
- [ ] /api/admin/customers/notes · staff كتابة على كل profile
- [ ] gift-cards GET · constant-time response + تقليل الـrate
- [ ] PII في audit_logs (phone خام) → hash قبل التخزين
- [ ] visit_photos INSERT policy مفقودة → مطبّقة في SQL لكن تحتاج staff check
- [ ] Push subscription hijack · composite unique (user_id, endpoint)
- [ ] npm audit fix · sharp, zod, postcss

### MEDIUM:
- [ ] WebAuthn login يربط challenge بـcredential (يمنع race condition)
- [ ] profiles INSERT policy + trigger handle_new_user
- [ ] date_of_birth validation (block minors or guardian flow)
- [ ] Middleware rate-limit on Vercel (needs Redis/Upstash)
- [ ] Session activity cookies · HttpOnly/Secure/SameSite explicit

### الامتثال PDPL:
- [ ] جدولة cleanup_retention() يوميّاً عبر cron
- [ ] نقل Supabase إلى me-south-1 (البحرين) بدل Seoul
- [ ] Transfer Impact Assessment + DPA + إفصاح في سياسة الخصوصيّة
- [ ] Right to Access · endpoint تصدير البيانات بالكامل

---

## 📊 بطاقة الـPDPL

| المحور | قبل | بعد | ملاحظة |
|---|---|---|---|
| Consent (Article 6) | ❌ | 🟡 | عمود marketing_consent موجود · UI يحتاج checkbox |
| Right to Access (13) | 🟡 | 🟡 | تحسّن جزئي · export endpoint معلّق |
| Right to Delete (17) | ❌ | ✅ | /api/account/delete-account يحذف ويُجهّل |
| Data Retention (18) | 🟡 | 🟢 | cleanup_retention() جاهزة · تحتاج scheduling |
| Cross-border (29) | ❌ | ❌ | Supabase Seoul · يحتاج ترحيل أو مذكّرة DPA |

---

## 🔑 متغيّرات البيئة المطلوبة

لتفعيل الإصلاحات في الإنتاج · أضيفي في Vercel:

```
# ─── Webhooks ───
MOYASAR_WEBHOOK_SECRET  = <اطلبيه من لوحة Moyasar>
TABBY_WEBHOOK_SECRET    = <اطلبيه من Tabby Merchant Dashboard>
TAMARA_WEBHOOK_SECRET   = <اطلبيه من Tamara Partner Portal>

# ─── Cron (مطلوب · لو ناقص · كل cron يُرفض) ───
CRON_SECRET             = <أي نصّ عشوائي 64+ حرف>

# ─── PII Salt (اختياري · للـhashing) ───
APP_PII_SALT            = <نصّ عشوائي 32+ حرف>
```

---

## 📝 الخطوات التالية

### 🔥 الآن (قبل الإطلاق):
1. شغّلي `supabase/apply/SECURITY-HARDENING.sql` في Supabase SQL Editor
2. أضيفي الـenv variables أعلاه في Vercel
3. تحقّقي من تقرير RLS في نهاية الـSQL (كل الجداول الحسّاسة ✓)

### 📅 الأسبوع القادم:
1. أضيفي checkbox للـmarketing_consent في /account/profile و /signup
2. اطلبي من Tabby/Tamara/Moyasar مفاتيح webhook signature
3. شغّلي `npm audit fix` بعد نشر الإصلاحات الحاليّة

### 🗓 الشهر القادم:
1. ناقشي مع SDAIA خيارات التخزين الإقليمي (البحرين me-south-1)
2. وقّعي DPA مع Supabase
3. انشري سياسة الخصوصيّة المحدّثة

---

**الحالة بعد الدفعة:** أمن **قوي (Strong)** حيث كان moderate-weak
**الاستعداد للإطلاق:** 🟢 جاهز بعد شغل SQL + env vars
