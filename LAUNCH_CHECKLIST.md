# 🚀 قائمة التجهيزات قبل النشر · Be First Lady

> **الوقت المتوقّع:** ساعة ونصف إلى ساعتين · لو كل الحسابات جاهزة
> **التاريخ:** 2026-11-04

## 📋 الترتيب العام

1. [قاعدة البيانات](#1-قاعدة-البيانات) (10 دقائق)
2. [الحساب الأوّل · المالكة](#2-الحساب-الأوّل--المالكة) (5 دقائق)
3. [Environment Variables في Vercel](#3-environment-variables-في-vercel) (30 دقيقة)
4. [البيانات الأوليّة](#4-البيانات-الأوليّة) (15 دقيقة)
5. [النطاق والـDNS](#5-النطاق-والـdns) (10 دقائق)
6. [اختبار كل شي](#6-اختبار-كل-شي) (30 دقيقة)

---

## 1️⃣ قاعدة البيانات

### ✅ Supabase · تطبيق الـmigrations

- [ ] افتحي **Supabase Dashboard** → مشروع Be First Lady
- [ ] **SQL Editor** → **+ New query**
- [ ] نفّذي الملفات بالترتيب من `supabase/migrations/`:
  - [ ] `001_initial_schema.sql` (الأوّل مرّة فقط)
  - [ ] `002_rls_policies.sql`
  - [ ] `003_gift_bookings.sql`
  - [ ] `004_phase2_features.sql`
  - [ ] `005_hr_attendance.sql`
  - [ ] `006_system_hardening.sql`
  - [ ] `007_fix_junction_rls.sql`
  - [ ] `008_tax_settings.sql`
  - [ ] `009_gift_cards_referral_inventory.sql`
  - [ ] `010_mobile_app.sql`
  - [ ] `20261019_otp_codes.sql`
  - [ ] `20261020_customer_experience.sql`
  - [ ] `20261101_expenses_and_notes.sql`
  - [ ] `20261101_security_hardening.sql`
  - [ ] `20261102_beauty_profile.sql`
  - [ ] `20261102_customer_prefs.sql`
  - [ ] `20261102_gift_cards_email.sql`
  - [ ] `20261102_payments.sql`
  - [ ] `20261102_reminders.sql`
  - [ ] `20261103_newsletter.sql`
  - [ ] `20261103_push_subscriptions.sql`
  - [ ] `20261104_staff_requests.sql`

> **بديل أسرع:** `supabase/apply/combined-all.sql` (لو قاعدة جديدة)
> **لو بعضها مطبّق:** `supabase/apply/safe-latest.sql`

### ✅ التحقّق · الجداول موجودة

نفّذي في SQL Editor:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

لازم تشوفين (على الأقل):
- `profiles` · `categories` · `services` · `packages` · `staff`
- `bookings` · `booking_items` · `payments` · `payment_intents`
- `gift_cards` · `coupons` · `loyalty_transactions`
- `attendance_records` · `leave_requests` · `permission_requests` · `shift_swap_requests`
- `push_subscriptions` · `newsletter_subscribers` · `reviews`

### ✅ تفعيل Auth (OTP + Email)

- [ ] **Authentication** → **Providers**
- [ ] فعّلي **Email** · ضعي **Confirm Email = OFF** (مؤقّتاً للاختبار)
- [ ] **Authentication** → **URL Configuration**
  - Site URL: `https://befirstlady.com`
  - Redirect URLs: `https://befirstlady.com/**`

---

## 2️⃣ الحساب الأوّل · المالكة

- [ ] افتحي `https://befirstlady.com/signup`
- [ ] سجّلي بإيميلك + كلمة مرور
- [ ] ارجعي لـ**Supabase SQL Editor** · نفّذي:
  ```sql
  UPDATE profiles SET role = 'owner'
  WHERE email = 'YOUR_EMAIL@example.com';
  ```
- [ ] اخرجي من الموقع وادخلي ثانية
- [ ] راح تتحوّلين تلقائيّاً لـ`/admin`

---

## 3️⃣ Environment Variables في Vercel

افتحي: **Vercel Dashboard → مشروع be-first-lady → Settings → Environment Variables**

أضيفي **لكل متغيّر**: Production + Preview + Development ✅

### 🗄️ Supabase · **مطلوب · لا يعمل الموقع بدونها**

| الاسم | القيمة |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | من Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | من Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | من Supabase → Settings → API (service_role · سرّي جداً) |

### 🌐 الإعدادات العامّة · **مطلوبة**

| الاسم | القيمة |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://befirstlady.com` |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `966504389329` (رقم الصالون) |

### 💳 بوّابات الدفع · **اختياريّة · ممكن إضافتها لاحقاً**

#### Moyasar · مدى + Visa + Apple Pay
- 🔗 https://moyasar.com/dashboard → API Keys

| الاسم | القيمة |
|---|---|
| `NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY` | `pk_live_xxx` |
| `MOYASAR_SECRET_KEY` | `sk_live_xxx` |
| `MOYASAR_WEBHOOK_SECRET` | من Dashboard → Webhooks |

**Webhook URL لتسجيله في Moyasar:**
`https://befirstlady.com/api/payments/webhook/moyasar`

#### Tabby · تقسيط 4 دفعات (300-30,000 ر.س)
- 🔗 https://merchant.tabby.ai → Developer

| الاسم | القيمة |
|---|---|
| `NEXT_PUBLIC_TABBY_PUBLIC_KEY` | `pk_live_xxx` |
| `TABBY_SECRET_KEY` | `sk_live_xxx` |
| `TABBY_MERCHANT_CODE` | `SA` |

**Webhook URL:** `https://befirstlady.com/api/payments/webhook/tabby`

#### Tamara · تقسيط 3 دفعات (100-15,000 ر.س)
- 🔗 https://partners.tamara.co → API Keys

| الاسم | القيمة |
|---|---|
| `TAMARA_API_TOKEN` | من Dashboard |
| `TAMARA_ENV` | `production` (أو `sandbox` للتجربة) |

**Webhook URL:** `https://befirstlady.com/api/payments/webhook/tamara`

### 📱 WhatsApp Cloud API · **مطلوبة لتأكيد الحجز وOTP**
- 🔗 https://developers.facebook.com → My Apps → WhatsApp Business

| الاسم | القيمة |
|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | من Meta Developer |
| `WHATSAPP_ACCESS_TOKEN` | من Meta Developer (Permanent Token) |

> **مفصّل في:** `docs/WHATSAPP_SETUP.md`

### 📧 Resend (Email) · **مطلوبة لبطاقات الهديّة والتأكيدات**
- 🔗 https://resend.com/api-keys

| الاسم | القيمة |
|---|---|
| `RESEND_API_KEY` | `re_xxx` |
| `RESEND_FROM` | `Be First Lady <noreply@befirstlady.com>` |

> **مهم:** لازم تضيفين النطاق `befirstlady.com` في Resend وتتحقّقين منه (DNS records)

### 🔔 Web Push (VAPID) · **لإشعارات المتصفّح**

ولّدي الـkeys:
```bash
npx web-push generate-vapid-keys
```

أو من: https://vapidkeys.com/

| الاسم | القيمة |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | من المولّد |
| `VAPID_PRIVATE_KEY` | من المولّد |
| `VAPID_SUBJECT` | `mailto:info@befirstlady.com` |

### ⏰ Cron Jobs · **مطلوبة للتذكيرات التلقائيّة**

| الاسم | القيمة |
|---|---|
| `CRON_SECRET` | أي نصّ عشوائي قوي (32+ حرف) · توليد: `openssl rand -hex 32` |

> Vercel Cron يستخدم هذا كـBearer token لحماية الـcron routes.

---

## 4️⃣ البيانات الأوليّة

بعد تسجيل دخولك كـowner · روحي `/admin`:

### ✅ التصنيفات
- [ ] `/admin/services` → اضغطي **+ تصنيف** · أضيفي:
  - مساج · حمّامات · عناية بالبشرة · أظافر · حواجب
  - ألوان الشعر · قصّات · تنعيم · تصفيف · علاج شعر · ميك اب

### ✅ الخدمات (على الأقل 10-15)
- [ ] تحت كل تصنيف · أضيفي الخدمات بالسعر والمدّة
- [ ] اختاري الخدمات المميّزة (featured) للعرض في الرئيسيّة

### ✅ البكجات (اختياريّ لكن يزيد المبيعات)
- [ ] `/admin/packages` → أنشئي 2-3 بكجات موسميّة

### ✅ الموظّفات
- [ ] `/admin/users` → أنشئي حسابات staff لكل موظّفة
- [ ] `/admin/staff` → لكل موظّفة:
  - ربطي الحساب
  - أضيفي الصورة
  - اختاري الخدمات اللي تقدّمها
  - حدّدي جدولها الأسبوعي

### ✅ ساعات العمل
- [ ] `/admin/settings` → ساعات العمل الرسميّة (سبا/صالون)

### ✅ موقع الصالون (للحضور بالموقع الجغرافي)
- [ ] `/admin/salon-location` → حدّدي الإحداثيّات + نطاق الحضور

### ✅ الإعدادات العامّة
- [ ] اسم الصالون · شعار · ألوان
- [ ] نسبة الضريبة (VAT 15% للسعوديّة)
- [ ] الرقم الضريبي (لو مسجّلة ZATCA)
- [ ] قيمة نقطة الولاء · حدّ العربون

---

## 5️⃣ النطاق والـDNS

### ✅ في Vercel
- [ ] **Settings → Domains** → أضيفي `befirstlady.com`
- [ ] أضيفي `www.befirstlady.com` أيضاً

### ✅ عند مزوّد النطاق (Namecheap/GoDaddy/etc.)
- [ ] **A record:** `@` → `76.76.21.21` (Vercel)
- [ ] **CNAME:** `www` → `cname.vercel-dns.com`
- [ ] انتظري الانتشار (10 دقائق - 24 ساعة)

### ✅ في Resend (للإيميلات)
- [ ] **Domains** → أضيفي `befirstlady.com`
- [ ] أضيفي SPF + DKIM + DMARC حسب تعليمات Resend
- [ ] تحقّقي من النطاق

### ✅ Vercel Cron Jobs
تحقّقي من ملف `vercel.json` في المستودع · لازم فيه:
```json
{
  "crons": [
    { "path": "/api/cron/booking-reminders", "schedule": "*/30 * * * *" },
    { "path": "/api/cron/birthday-coupons", "schedule": "0 9 * * *" }
  ]
}
```

---

## 6️⃣ اختبار كل شي

### ✅ تجربة العميلة
- [ ] `/signup` · حساب جديد
- [ ] `/booking` · حجز خدمة
- [ ] الوصول لـcheckout
- [ ] دفع وهمي (Moyasar test mode)
- [ ] يصل واتساب تأكيد ✅
- [ ] يظهر في `/account/bookings`

### ✅ تجربة الموظّفة
- [ ] تسجيل دخول (role=staff) من الموبايل
- [ ] تشوف التطبيق الجوّال بـ5 تبويبات
- [ ] تسجّل حضور · تشوف حجوزاتها · ترسل طلب إجازة
- [ ] الـMalakka تلقى إشعار

### ✅ تجربة المالكة
- [ ] `/admin` · الـdashboard يعرض الأرقام الصحيحة
- [ ] `/admin/requests` · تراجع طلبات الموظّفات
- [ ] `/admin/bookings` · تشوف كل الحجوزات
- [ ] تنشئ حجز يدوي (walk-in)

### ✅ الإشعارات
- [ ] فعّلي push من `/account` (كعميلة) ومن `/admin > ملفي` (كموظّفة)
- [ ] اعتمدي طلب موظّفة · يصل إشعار فوراً
- [ ] اصنعي حجز جديد كعميلة · يصل إشعار للموظّفة

---

## 🎯 خطّة النشر الموصى بها

### اليوم 1 · إعدادات أساسيّة
1. ✅ قاعدة البيانات (migrations)
2. ✅ حساب المالكة
3. ✅ Environment vars الأساسيّة (Supabase + Site + WhatsApp)
4. ✅ النطاق والـDNS

### اليوم 2 · المحتوى
1. ✅ التصنيفات + الخدمات + البكجات
2. ✅ الموظّفات + جداولهن
3. ✅ ساعات العمل + الإعدادات

### اليوم 3 · الدفع والمتقدّمات
1. ✅ Moyasar (أهمّ واحدة)
2. ✅ Tabby + Tamara
3. ✅ Resend + VAPID

### اليوم 4 · الاختبار + الإطلاق
1. ✅ اختبار شامل لكل التدفّقات
2. ✅ دعوة 5-10 عميلات للتجربة
3. ✅ متابعة الأخطاء وإصلاحها
4. ✅ النشر الرسمي 🎉

---

## 📞 أرقام مرجعيّة سريعة

| الخدمة | الرابط | الحالة |
|---|---|---|
| Supabase | https://supabase.com/dashboard | ⏳ |
| Vercel | https://vercel.com/dashboard | ⏳ |
| Moyasar | https://moyasar.com/dashboard | ⏳ |
| Tabby | https://merchant.tabby.ai | ⏳ |
| Tamara | https://partners.tamara.co | ⏳ |
| Resend | https://resend.com/dashboard | ⏳ |
| Meta WhatsApp | https://developers.facebook.com | ⏳ |

---

## ⚠️ ملاحظات مهمّة

1. **احفظي كل الـkeys في مكان آمن** (مثل 1Password أو Bitwarden)
2. **ما تشارّكي `SUPABASE_SERVICE_ROLE_KEY` مع أحد** · هذي تعطي صلاحيّة كاملة
3. **ابدأي بالـsandbox mode** لبوّابات الدفع · ثم production بعد التأكّد
4. **فعّلي Backup اليومي** في Supabase (Settings → Database → Backups)
5. **ضبّي حدود الـrate limit** في `/admin/security` (موجود جاهز)

---

## 🆘 لو فيه مشكلة

- **Vercel build فشل:** شوفي logs في Deployments → اللوق كامل
- **Supabase RLS error:** تأكّدي من تطبيق كل الـmigrations (خصوصاً 002)
- **الواتساب ما يرسل:** تأكّدي من `WHATSAPP_PHONE_NUMBER_ID` وأنّ الـtoken ما انتهى
- **Push ما تصل:** تأكّدي من VAPID keys + Service Worker في `/public/sw.js`

---

**جاهزين · بالتوفيق 🌸**
