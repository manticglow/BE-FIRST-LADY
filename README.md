# 💎 The First Lady

> نظام إدارة متكامل لصالون وسبا نسائي فاخر في المدينة المنوّرة

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)](https://vercel.com)

---

## ✨ نظرة عامّة

تطبيق ويب كامل لإدارة صالون التجميل · مصمَّم للسيّدات · يعمل كـPWA على الجوّال.

### المميّزات الرئيسيّة:

- 🌸 **واجهة العميلة** · تصفّح الخدمات · الحجز الإلكتروني · الدفع · المتابعة
- 👑 **لوحة الإدارة** · إدارة الحجوزات · العميلات · الموظّفات · المالية
- 👩‍💼 **تطبيق الموظّفة** · الحضور · المواعيد · الطلبات
- 💳 **بوّابات دفع متعدّدة** · Moyasar · Tabby · Tamara
- 📱 **واتساب تلقائي** · تأكيدات · تذكيرات · عروض
- 💎 **نظام ولاء كامل** · نقاط · مستويات · بطاقات هديّة · إحالات
- 🧾 **فواتير ضريبيّة** · متوافقة مع ZATCA
- 🌙 **Dark Mode** · RTL كامل · خطوط عربيّة فاخرة

---

## 🏗️ البنية التقنيّة

```
┌─────────────────────────────────────────┐
│ Frontend · Next.js 15 (App Router)      │
│          · React 19 + TypeScript 5.6    │
│          · Tailwind CSS + Framer Motion │
└─────────────────────────────────────────┘
                   ↕
┌─────────────────────────────────────────┐
│ Backend  · Next.js API Routes (77 route)│
│          · Vercel Serverless Functions  │
└─────────────────────────────────────────┘
                   ↕
┌─────────────────────────────────────────┐
│ Database · Supabase PostgreSQL 17       │
│          · 23 جدول · Row Level Security  │
│          · Realtime subscriptions       │
└─────────────────────────────────────────┘
```

---

## 🚀 البدء السريع

### المتطلّبات:
- Node.js 20+
- حساب Supabase · حساب Vercel · GitHub

### التنصيب (5 دقائق):

```bash
# 1. استنساخ المشروع
git clone https://github.com/YOUR_ORG/be-first-lady.git
cd be-first-lady

# 2. تثبيت المكتبات
npm install

# 3. نسخ ملف البيئة
cp .env.example .env.local

# 4. تعديل .env.local بمفاتيحك

# 5. تشغيل محلّي
npm run dev
```

افتحي: [http://localhost:3000](http://localhost:3000)

---

## 📚 التوثيق

| الملف | الوصف |
|-------|--------|
| [`SETUP.md`](./SETUP.md) | 📋 دليل التنصيب الكامل خطوة بخطوة |
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | 🏛️ البنية التقنيّة وخيارات التصميم |
| [`docs/LAUNCH_GUIDE.md`](./docs/LAUNCH_GUIDE.md) | 🚀 خطّة الإطلاق التجاري |
| [`docs/INTEGRATIONS_SETUP.md`](./docs/INTEGRATIONS_SETUP.md) | 🔌 ربط الخدمات الخارجيّة |
| [`docs/WHATSAPP_SETUP.md`](./docs/WHATSAPP_SETUP.md) | 📱 إعداد الواتساب |
| [`docs/SAUDI_LOCALIZATION.md`](./docs/SAUDI_LOCALIZATION.md) | 🇸🇦 الامتثال السعودي (PDPL · ZATCA) |
| [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) | 📝 سجلّ التحديثات |

---

## 🗄️ قاعدة البيانات

### تطبيق الـschema:

```sql
-- في Supabase SQL Editor · شغّلي:
supabase/apply/combined-all.sql
```

راجعي: [`supabase/apply/README.md`](./supabase/apply/README.md)

---

## 🔑 متغيّرات البيئة

كل المفاتيح المطلوبة في [`.env.example`](./.env.example) · مُقسَّمة إلى:

- 🗄️ Supabase (إلزامي)
- 💳 Moyasar (إلزامي للدفع)
- 📱 الواتساب (UltraMsg موصى به)
- 📧 Resend (للإيميلات)
- ☁️ Google Drive (للنسخ الاحتياطي)
- 📊 Sentry (لمراقبة الأخطاء)

---

## 🧪 السكربتات

```bash
npm run dev      # تشغيل محلّي على localhost:3000
npm run build    # بناء للإنتاج
npm run start    # تشغيل نسخة الإنتاج
npm run lint     # فحص جودة الكود
```

---

## 🛡️ الأمان

- ✅ Row Level Security (RLS) على كل الجداول
- ✅ Content Security Policy (CSP) صارم
- ✅ HSTS + X-Frame-Options + XSS protection
- ✅ Rate limiting على الـAPI endpoints الحسّاسة
- ✅ Audit logging لكل الإجراءات الحسّاسة
- ✅ تشفير البيانات الحسّاسة
- ✅ 2FA ready (Supabase Auth MFA)

---

## 🎨 التصميم

### نظام الألوان:
```
Cream:     #fbf7ef · #f5eee0 · #ebe0c9 · #dcc9a2
Gold:      #c9a876 · #7d613b · #5a4428
Ink:       #2a2520 · #5c524a · #8a7f73
Rose Soft: #d4a5a0 · Sage: #a0b090
```

### الخطوط:
- **العناوين:** Fraunces (italic serif فاخر)
- **النصوص:** Readex Pro (عربي عصري)
- **الأكواد:** JetBrains Mono

---

## 📦 الهيكلة

```
be-first-lady/
├── 📁 src/
│   ├── 📁 app/              # Next.js App Router
│   │   ├── 📁 (customer)/   # صفحات العميلة
│   │   ├── 📁 admin/        # لوحة الإدارة
│   │   ├── 📁 account/      # حساب العميلة
│   │   └── 📁 api/          # API routes (77)
│   ├── 📁 components/       # React components
│   ├── 📁 lib/              # المكتبات والـhelpers
│   └── 📁 types/            # TypeScript types
├── 📁 supabase/
│   ├── 📁 migrations/       # ملفات الـmigrations
│   └── 📁 apply/            # ملفات التطبيق السريع
├── 📁 docs/                 # التوثيق
└── 📁 public/               # الموارد الثابتة
```

---

## 🔧 المطوّر

**Shaheen Design** · Jeddah, Saudi Arabia
- 📧 abdullrahmanshaheen1@gmail.com
- 📱 0582409776
- 🌐 Luxury branding & web development atelier

---

## 📜 الترخيص

مشروع خاصّ · جميع الحقوق محفوظة لـ The First Lady © 2026

---

<div align="center">

**صُنع بـ 💛 في المملكة العربيّة السعوديّة**

Made with care for the women of Madinah

</div>
