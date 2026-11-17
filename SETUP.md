# 📋 دليل التنصيب الكامل · The First Lady

> خطوات تنصيب النظام من الصفر على حسابات جديدة

---

## ⏱️ الوقت المتوقّع

- **التنصيب الأساسي** · ساعة إلى ساعتين
- **إعداد المدفوعات** · 1-3 أيّام (ينتظر توثيق Moyasar)
- **إعداد الواتساب** · 15 دقيقة (UltraMsg) أو 3-7 أيّام (Meta)

---

## 🎯 ما تحتاجينه قبل البدء

### الوثائق:
- ☐ السجل التجاري أو وثيقة العمل الحر
- ☐ شهادة الإيبان من البنك
- ☐ صورة الهويّة الوطنيّة
- ☐ العنوان الوطني

### الحسابات التي سنُنشئها:
1. 📧 حساب Gmail جديد (للمالكة)
2. 🌐 نطاق النطاق (Hostinger/Cloudflare)
3. 💻 GitHub (مجّاناً)
4. 🚀 Vercel (مجّاناً)
5. 🗄️ Supabase (مجّاناً)
6. 💳 Moyasar (عمولة فقط)
7. 📱 UltraMsg (~37 ريال/شهر)
8. 📧 Google Workspace (27 ريال/شهر · اختياري)

### التكلفة الإجماليّة الشهريّة:
- **الحدّ الأدنى:** 37 ريال (UltraMsg) + 2.5% عمولة
- **الموصى به:** 95 ريال (الكل مع Google Workspace)

---

## 📦 المرحلة 1 · الإعداد الأساسي (15 دقيقة)

### 1.1 · إنشاء إيميل Gmail جديد

```
افتحي: https://accounts.google.com/signup
الاسم: [اسم المالكة]
الإيميل المقترح: raghadbfl@gmail.com أو befirstlady.spa@gmail.com
```

### 1.2 · إنشاء حساب GitHub

```
افتحي: https://github.com/signup
الإيميل: استخدمي الإيميل من الخطوة 1.1
Username: راجعي الأسماء المتاحة
```

### 1.3 · إنشاء حساب Vercel

```
افتحي: https://vercel.com/signup
اختاري: Continue with GitHub (اربطيه بحسابك)
```

### 1.4 · إنشاء حساب Supabase

```
افتحي: https://supabase.com/dashboard/sign-up
اختاري: Sign in with GitHub
```

---

## 🗄️ المرحلة 2 · إعداد قاعدة البيانات (20 دقيقة)

### 2.1 · إنشاء مشروع Supabase

```
Dashboard → New Project
الاسم: be-first-lady
المنطقة: Seoul (أقرب لنا بعد البحرين)
كلمة مرور قاعدة البيانات: [عشوائيّة قويّة · احفظيها!]
```

### 2.2 · تطبيق الـschema

```
انتظري 2-3 دقائق حتى يجهز المشروع
→ SQL Editor → New query
→ انسخي محتوى: supabase/apply/combined-all.sql
→ Run (Ctrl+Enter)
```

**النتيجة المتوقّعة:** `Success. No rows returned`

### 2.3 · التحديثات الأمنيّة الأخيرة

```sql
→ New query جديد
→ انسخي محتوى: supabase/apply/security-gift-cards.sql
→ Run
```

### 2.4 · جلب مفاتيح Supabase

```
Project Settings → API
انسخي:
  • Project URL                → NEXT_PUBLIC_SUPABASE_URL
  • anon public key           → NEXT_PUBLIC_SUPABASE_ANON_KEY
  • service_role secret key   → SUPABASE_SERVICE_ROLE_KEY
```

---

## 💻 المرحلة 3 · نقل الكود (10 دقائق)

### 3.1 · Fork المستودع لحسابك

```
افتحي: https://github.com/[original-owner]/be-first-lady
اضغطي: Fork → إلى حسابك الجديد
```

### 3.2 · ربط Vercel بالـRepo

```
Vercel Dashboard → Add New → Project
اختاري: be-first-lady (من GitHub)
اضغطي: Import
```

### 3.3 · إضافة متغيّرات البيئة

في Vercel Settings → Environment Variables · أضيفي كل متغيّر من `.env.example`:

#### إلزامي الآن:
```
NEXT_PUBLIC_SUPABASE_URL       = [من Supabase]
NEXT_PUBLIC_SUPABASE_ANON_KEY  = [من Supabase]
SUPABASE_SERVICE_ROLE_KEY      = [من Supabase]
NEXT_PUBLIC_SITE_URL           = https://[project].vercel.app
CRON_SECRET                    = [عشوائي قوي · openssl rand -base64 32]
```

#### الباقي يُضاف لاحقاً عند التفعيل:
```
MOYASAR_*         → بعد توثيق Moyasar
ULTRAMSG_*        → بعد تفعيل UltraMsg
RESEND_API_KEY    → بعد تفعيل Resend
GOOGLE_*          → بعد إعداد Backups
SENTRY_DSN        → بعد تفعيل Sentry
```

### 3.4 · النشر الأوّل

```
Vercel يبني تلقائياً بعد إضافة المتغيّرات
انتظري 2-3 دقائق
افتحي: https://[project].vercel.app
```

✅ الموقع يفتح · التسجيل يعمل · لكن الخدمات الخارجيّة ما تشتغل بعد.

---

## 👑 المرحلة 4 · إنشاء حساب المالكة (5 دقائق)

### 4.1 · تسجيل في الموقع

```
افتحي الموقع: https://[project].vercel.app
→ تسجيل جديد
→ أكملي البيانات
```

### 4.2 · ترقية الحساب لـowner (SQL واحد)

```sql
-- في Supabase SQL Editor:
UPDATE profiles 
SET role = 'owner'
WHERE email = 'YOUR_OWNER_EMAIL@gmail.com';
```

### 4.3 · تسجيل الخروج ثم الدخول

ستجدين لوحة الإدارة في `/admin`

---

## 🌐 المرحلة 5 · شراء النطاق (15 دقيقة · اختياري الآن)

### 5.1 · شراء النطاق

#### الأرخص: Cloudflare (~40 ريال/سنة)
```
افتحي: https://www.cloudflare.com/products/registrar
ابحثي: thefirstlady.com
اشتري
```

#### الأسهل سعودياً: Hostinger (~45 ريال/سنة)
```
افتحي: https://www.hostinger.sa/domain-checker
ابحثي: thefirstlady.com
اشتري
```

### 5.2 · ربط النطاق بـVercel

```
Vercel → Project → Settings → Domains
Add Domain: thefirstlady.com
```

Vercel يعطيكِ Records · ضيفيهم في لوحة النطاق:
```
A    @    76.76.21.21
CNAME www cname.vercel-dns.com
```

---

## 💳 المرحلة 6 · إعداد الدفع · Moyasar (1-3 أيّام)

### 6.1 · إنشاء الحساب

```
افتحي: https://moyasar.com/signup
املأي: اسم الصالون · البريد · الجوّال
```

### 6.2 · رفع الوثائق

```
Dashboard → KYC → ارفعي:
  • السجل التجاري (أو وثيقة العمل الحر)
  • شهادة الإيبان
  • صورة الهويّة
```

**وقت المراجعة:** 1-3 أيّام عمل

### 6.3 · بعد الموافقة

```
Dashboard → API Keys → انسخي:
  • Publishable Key → NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY
  • Secret Key      → MOYASAR_SECRET_KEY
```

### 6.4 · إعداد Webhook

```
Dashboard → Webhooks → Add Endpoint
URL: https://thefirstlady.com/api/payments/webhook/moyasar
أحداث: payment_paid · payment_failed · payment_refunded
Secret: [عشوائي قوي] → MOYASAR_WEBHOOK_SECRET
```

### 6.5 · اختبار دفعة حقيقيّة

```
احجزي خدمة رمزيّة (1 ريال)
ادفعي ببطاقتكِ
تأكّدي يوصل المبلغ
```

---

## 📱 المرحلة 7 · إعداد الواتساب (15 دقيقة)

### 7.1 · UltraMsg (الأسرع)

```
افتحي: https://ultramsg.com
Sign Up → Create Instance → اسم: BFL-Salon
QR Code → امسحي برقم الصالون
Instance Settings → انسخي:
  • Instance ID  → ULTRAMSG_INSTANCE_ID
  • Token        → ULTRAMSG_TOKEN
```

في Vercel · أضيفي:
```
WHATSAPP_PROVIDER      = ultramsg
ULTRAMSG_INSTANCE_ID   = [من UltraMsg]
ULTRAMSG_TOKEN         = [من UltraMsg]
```

Redeploy · ستشتغل الرسائل التلقائيّة فوراً.

### 7.2 · اختبار الواتساب

افتحي Console (F12) في الموقع:
```javascript
fetch('/api/whatsapp/test', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    phone: '0501234567',  // رقمكِ للاختبار
    text: 'تجربة من The First Lady'
  })
}).then(r => r.json()).then(console.log)
```

---

## 📧 المرحلة 8 · إعداد الإيميلات · Resend (10 دقائق)

```
افتحي: https://resend.com/signup
Dashboard → API Keys → Create → انسخي → RESEND_API_KEY
Domains → Add Domain: thefirstlady.com
```

Resend يعطيكِ MX records · ضيفيهم في DNS.

---

## ☁️ المرحلة 9 · النسخ الاحتياطي · Google Drive (20 دقيقة · اختياري)

### 9.1 · إنشاء Google Cloud Project

```
افتحي: https://console.cloud.google.com
Create Project: BFL-Backups
Enable: Google Drive API
```

### 9.2 · Service Account

```
IAM & Admin → Service Accounts → Create
Name: bfl-backup-bot
Grant Role: (تخطّي)
Done → Click Service Account → Keys → Add Key → JSON
```

يتحمّل ملف JSON · هذا هو `GOOGLE_SERVICE_ACCOUNT_JSON`

### 9.3 · مشاركة مجلّد Drive

```
افتحي: https://drive.google.com
New Folder: BFL-Backups
Share → ألصقي إيميل Service Account (من JSON)
Role: Editor
Copy folder ID من URL → GOOGLE_DRIVE_FOLDER_ID
```

---

## 📊 المرحلة 10 · مراقبة الأخطاء · Sentry (15 دقيقة · موصى به)

```
افتحي: https://sentry.io/signup
Create Project → Next.js
انسخي DSN → SENTRY_DSN
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

## ✅ قائمة التحقّق النهائيّة قبل الإطلاق

### تقنياً:
- [ ] Supabase مُنشأ ومُطبَّق
- [ ] Vercel يبني بنجاح
- [ ] النطاق مربوط وSSL يعمل
- [ ] حساب المالكة owner جاهز
- [ ] Moyasar معتمد والـwebhook شغّال
- [ ] UltraMsg يرسل رسائل
- [ ] Resend يرسل إيميلات
- [ ] Sentry يستقبل الأخطاء (اختبريه)
- [ ] Google Drive backup شغّال

### المحتوى:
- [ ] الخدمات الفعليّة مُضافة بأسعارها
- [ ] الموظّفات مُضافات بجداولهن
- [ ] الصور الحقيقيّة مرفوعة
- [ ] الإعدادات (ساعات · عنوان · ضريبة) محدّثة
- [ ] الباقات مُنشأة
- [ ] قوالب الرسائل مُراجعة

### التجربة:
- [ ] اختبار حجز كامل من البداية للنهاية
- [ ] اختبار الدفع بمبلغ حقيقي صغير
- [ ] اختبار إلغاء حجز
- [ ] اختبار استخدام كوبون
- [ ] اختبار بطاقة هديّة
- [ ] اختبار من 3 أجهزة (iPhone · Android · كمبيوتر)

### القانوني:
- [ ] السجل التجاري ساري
- [ ] الرقم الضريبي مُضاف في الإعدادات
- [ ] سياسة الخصوصيّة محدّثة
- [ ] الشروط والأحكام مراجعة

---

## 🆘 المساعدة والدعم

### للمطوّر (Shaheen Design):
- 📧 abdullrahmanshaheen1@gmail.com
- 📱 0582409776

### روابط مفيدة:
- [Supabase Docs](https://supabase.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Moyasar Docs](https://docs.moyasar.com)
- [UltraMsg Docs](https://docs.ultramsg.com)

---

<div align="center">

**🎉 بعد إكمال كل هذي الخطوات · صالونكِ جاهز للعمل!**

</div>
