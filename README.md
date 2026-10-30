# Be First Lady — Luxury Spa & Salon System

<div dir="rtl">

> **نظام متكامل لصالون "Be First Lady" الفاخر في المدينة المنوّرة**
>
> موقع · تطبيق · لوحة إدارة · فواتير ضريبية · حضور وانصراف · HR

</div>

---

## 🎯 النظرة الشاملة

نظام كامل مبني بـ **Next.js 15** + **Supabase** + **TypeScript**، يضم:

| القسم | الوصف |
|-------|-------|
| 🌸 **موقع فاخر** | واجهة بهوية البراند مع شاشة تحميل، معرض، فيديوهات رموش |
| 📅 **نظام حجز ذكي** | معالج 4 خطوات، اختيار موظفة، كوبونات، هدايا |
| 👤 **حسابات العميلات** | ولاء، حجوزات، تعديل بيانات، نسيت كلمة المرور |
| 👑 **لوحة إدارة شاملة** | 14 صفحة، صلاحيات دقيقة |
| 👥 **إدارة موظفات** | خدمات لكل واحدة، جدول دوام أسبوعي |
| ⏱ **حضور وانصراف** | Geofence بـ GPS، سجلات، إحصائيات |
| 🏖 **نظام إجازات** | طلب/موافقة + ربط تلقائي بالتقويم |
| 🧾 **فواتير ZATCA** | متوافقة مع الهيئة، VAT 15%، QR رسمي |
| 🎁 **خدمة الهدية** | QR Code + دعوة فاخرة واتساب |
| 📱 **PWA** | يُثبّت كتطبيق على كل الأجهزة |

---

## 📦 الإحصائيات

| المكوّن | العدد |
|---------|------|
| ملفات TypeScript | 90+ |
| صفحات الموقع | 25+ |
| API Routes | 30+ |
| مكوّنات React | 40+ |
| Migrations | 8 |
| أيقونات PWA | 12 |

---

## 🛠 المكوّنات التقنية

```
Frontend:
  ├── Next.js 15.0.3 (App Router)
  ├── React 19
  ├── TypeScript (strict)
  ├── Tailwind CSS 3.4
  ├── Framer Motion (الحركات)
  ├── Lucide React (أيقونات)
  ├── Recharts (رسوم بيانية)
  ├── Sonner (toasts)
  └── Zod + React Hook Form

Backend:
  ├── Supabase (PostgreSQL + Auth + Storage + RLS)
  ├── Row Level Security على كل جدول
  ├── Triggers للنقاط التلقائية
  └── Admin Client للعمليات الحساسة

PWA:
  ├── Service Worker (كاش ذكي + offline)
  ├── Web App Manifest
  ├── 12 أيقونة بكل الأحجام
  ├── Install Prompts (Android/iOS/Desktop)
  └── Push Notifications ready

التكامل:
  ├── ZATCA Phase 1 (QR TLV)
  ├── WhatsApp Click-to-Chat
  ├── Google Maps
  └── QR Code API
```

---

## 📁 بنية المشروع

```
befirstlady-v2/
├── public/
│   ├── images/
│   │   ├── icons/              12 أيقونة خدمة (PNG)
│   │   ├── gallery/            10 صور معرض
│   │   ├── story/              صورة الاستقبال
│   │   └── logo*.svg           4 ألوان لوقو
│   ├── icons/                  12 أيقونة PWA
│   ├── videos/                 3 فيديوهات رموش
│   ├── sw.js                   Service Worker
│   └── favicon-*.png
│
├── src/
│   ├── app/                    App Router
│   │   ├── layout.tsx          Root layout + PWA metadata
│   │   ├── manifest.ts         PWA manifest
│   │   ├── page.tsx            الصفحة الرئيسية
│   │   ├── globals.css         تنسيقات عامة
│   │   ├── offline/            صفحة offline
│   │   │
│   │   ├── login/              تسجيل دخول
│   │   ├── signup/             إنشاء حساب
│   │   ├── forgot-password/    نسيت كلمة المرور
│   │   ├── reset-password/     إعادة تعيين
│   │   │
│   │   ├── booking/            حجز موعد تفاعلي
│   │   ├── invite/[nb]/        صفحة الدعوة (هدية)
│   │   ├── review/[nb]/        تقييم بعد الزيارة
│   │   │
│   │   ├── account/            حسابات العميلات
│   │   │   ├── page.tsx        لوحة العميلة
│   │   │   ├── profile/        تعديل بيانات
│   │   │   ├── bookings/       الحجوزات
│   │   │   ├── attendance/     الحضور (للموظفات)
│   │   │   └── leaves/         طلبات الإجازة
│   │   │
│   │   ├── admin/              لوحة الإدارة (14 صفحة)
│   │   │   ├── layout.tsx      Sidebar ديناميكي
│   │   │   ├── page.tsx        Dashboard
│   │   │   ├── bookings/       إدارة + تقويم + فواتير
│   │   │   ├── attendance/     متابعة الحضور
│   │   │   ├── leaves/         طلبات الإجازات
│   │   │   ├── customers/      العميلات
│   │   │   ├── staff/          الموظفات + خدمات + جدول
│   │   │   ├── services/       الخدمات (CRUD)
│   │   │   ├── packages/       البكجات (CRUD + ربط خدمات)
│   │   │   ├── coupons/        الكوبونات
│   │   │   ├── reviews/        التقييمات
│   │   │   ├── gallery/        المعرض (رفع صور)
│   │   │   ├── reports/        التقارير
│   │   │   ├── users/          إدارة اليوزرات
│   │   │   └── settings/       الإعدادات + ZATCA
│   │   │
│   │   └── api/                30+ API endpoint
│   │       ├── auth/           callback + logout
│   │       ├── bookings/       إنشاء حجز
│   │       ├── availability/   المواعيد الذكية
│   │       ├── staff-available/ الموظفات المتاحات
│   │       ├── coupons/validate
│   │       ├── reviews/        تقييم عام
│   │       ├── leaves/         طلب إجازة
│   │       ├── attendance/     حضور/انصراف/حالة
│   │       ├── account/        profile + bookings
│   │       └── admin/          كل CRUD endpoints
│   │
│   ├── components/
│   │   ├── layout/             Header, Footer
│   │   ├── sections/           أقسام الصفحة الرئيسية
│   │   ├── booking/            BookingWizard + أدوات
│   │   ├── account/            BookingCard, Attendance, Leaves, Profile
│   │   ├── admin/              كل مكوّنات الإدارة
│   │   └── ui/                 FloatingButtons, Loader, PWARegister
│   │
│   ├── lib/
│   │   ├── supabase/           client + server + admin
│   │   ├── utils.ts            دوال مساعدة
│   │   ├── geo.ts              Haversine distance
│   │   ├── phone.ts            تحقق أرقام سعودية
│   │   └── zatca.ts            QR TLV + VAT calc
│   │
│   ├── types/
│   │   └── database.ts         TypeScript types
│   │
│   └── middleware.ts           حماية + صلاحيات دقيقة
│
├── supabase/
│   ├── migrations/             8 migrations
│   │   ├── 001_initial_schema
│   │   ├── 002_rls_policies
│   │   ├── 003_gift_bookings
│   │   ├── 004_phase2_features
│   │   ├── 005_hr_attendance
│   │   ├── 006_system_hardening
│   │   ├── 007_fix_junction_rls
│   │   └── 008_tax_settings
│   └── seed/
│       └── 01_categories_services.sql
│
├── scripts/
│   └── generate_pwa_icons.py   توليد أيقونات PWA
│
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🚀 التنصيب الكامل

### 1. ثبّتي Node.js

- حمّلي **LTS** من [nodejs.org](https://nodejs.org)
- شغّلي المثبّت

### 2. ثبّتي الحزم

```bash
cd befirstlady-v2
npm install --legacy-peer-deps
```

### 3. أنشئي مشروع Supabase

- [supabase.com](https://supabase.com) → New Project
- اختاري **Frankfurt (eu-central-1)** للسعودية

### 4. شغّلي الـ Migrations بالترتيب

في **SQL Editor** → New query → Paste → Run:

```
1. supabase/migrations/001_initial_schema.sql
2. supabase/migrations/002_rls_policies.sql
3. supabase/migrations/003_gift_bookings.sql
4. supabase/migrations/004_phase2_features.sql
5. supabase/migrations/005_hr_attendance.sql
6. supabase/migrations/006_system_hardening.sql
7. supabase/migrations/007_fix_junction_rls.sql
8. supabase/migrations/008_tax_settings.sql
```

ثم:
- `supabase/seed/01_categories_services.sql`

### 5. أنشئي `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_WHATSAPP_NUMBER=966500000000
```

### 6. أنشئي حساب المالكة

في Supabase → **Authentication → Users → Add user**:
- بريد + كلمة مرور
- ✅ Auto Confirm User

ثم في SQL Editor:
```sql
INSERT INTO profiles (id, full_name, email, role)
VALUES ('<USER-UID>', 'غد', 'ghad@test.com', 'owner');
```

### 7. أنشئي bucket للمعرض

Supabase → **Storage** → New bucket → `gallery` ✅ Public

ثم في SQL Editor:
```sql
CREATE POLICY "Admins upload gallery" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'gallery' AND
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'manager')
);
CREATE POLICY "Anyone views gallery" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'gallery');
CREATE POLICY "Admins delete gallery" ON storage.objects
FOR DELETE TO authenticated USING (
  bucket_id = 'gallery' AND
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('owner', 'manager')
);
```

### 8. شغّلي المشروع

```bash
npm run dev
```

افتحي: **http://localhost:3000**

---

## 👥 الأدوار والصلاحيات

| الدور | يستطيع |
|-------|---------|
| 👑 **owner** | كل شيء — الوحيدة التي تدير اليوزرات والتقارير والإعدادات |
| 🛡 **manager** | محتوى + حجوزات + موظفات + مراجعة إجازات |
| 💼 **staff** | عرض حجوزاتها + حضور/انصراف + طلب إجازة |
| 👤 **customer** | حجز + حسابها + تقييم |

---

## 🔐 الأمان

- ✅ **Row Level Security** على كل جدول
- ✅ **Middleware** يحمي المسارات حسب الدور
- ✅ **Admin Client** للعمليات الحساسة فقط
- ✅ **Password hashing** تلقائي من Supabase
- ✅ **Phone validation** للأرقام السعودية
- ✅ **Booking conflict** prevention (DB Trigger)
- ✅ **Coupon abuse** prevention (Atomic)
- ✅ **Self-gift** prevention
- ✅ **CSRF protection** تلقائي

---

## 💳 الفاتورة الضريبية ZATCA

مُتوافق مع المرحلة الأولى (Phase 1 — Generation):
- QR Code بصيغة TLV الرسمية (Tag-Length-Value)
- 5 Tags: اسم البائع، الرقم الضريبي، التاريخ ISO 8601، الإجمالي، VAT
- التحقق من صحة الرقم الضريبي (15 رقم، يبدأ وينتهي بـ 3)
- فصل الضريبة والمجموع بشكل صحيح

**لتفعيلها:** `/admin/settings` → قسم "إعدادات الفاتورة الضريبية".

---

## 📱 PWA

النظام يعمل كتطبيق كامل:
- يُثبّت على Android/iOS/Desktop
- يعمل بدون إنترنت للصفحات المحمّلة
- إشعارات push جاهزة
- Shortcuts: احجزي + حسابي من الأيقونة

**ليعمل في الإنتاج:** يحتاج HTTPS (Vercel مجاناً).

---

## 📈 النشر على Vercel

```bash
npm i -g vercel
vercel
```

ثم في لوحة Vercel → Environment Variables:
- أضيفي كل المتغيرات من `.env.local`
- غيّري `NEXT_PUBLIC_SITE_URL` إلى الدومين Vercel

---

## 🎨 ألوان البراند

| اللون | HEX |
|-------|-----|
| Cream | `#fbf7ef` |
| Cream-light | `#f6eee0` |
| Gold | `#c9a96e` |
| Gold-deep | `#7d613b` |
| Ink | `#2a1c10` |
| Ink-soft | `#6b5a42` |

---

## 📝 Logs التطوير

### Migrations
1. **001** — الجداول الأساسية (13 جدول)
2. **002** — Row Level Security + دوال is_admin/is_staff
3. **003** — حقول الهدية + دعوة QR
4. **004** — موظفات + جدولة + ولاء + كوبونات + تقييمات
5. **005** — حضور وانصراف + geofence + إجازات
6. **006** — تحصين النظام (منع تعارض/race)
7. **007** — إصلاح RLS للجداول الوسيطة
8. **008** — إعدادات ZATCA للفواتير

---

## 💛 صُنع بحب

**للصالون:**
Be First Lady — المدينة المنوّرة
مالكة الصالون: غد

**تصميم وبرمجة:**
Shaheen Design — تصميم المواقع الفاخرة
عبدالرحمن فهد شاهين

🌸 **نعتني بكِ لتُزهري** — _A Sanctuary for You to Bloom_
