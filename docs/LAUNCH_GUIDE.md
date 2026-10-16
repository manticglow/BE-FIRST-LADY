# 🚀 دليل الإطلاق الفعلي · Be First Lady

> من صفر إلى موقع حيّ تجرّبيه كـ4 أدوار · **~40 دقيقة**

---

## 📋 اللي راح نسوّيه

| الخطوة | الوقت | المطلوب |
|-------|------|---------|
| 1️⃣ إنشاء Supabase | 5 د | إيميل |
| 2️⃣ تشغيل الهجرات | 5 د | ملف SQL |
| 3️⃣ إنشاء حسابات الاختبار | 5 د | أمر واحد |
| 4️⃣ زرع البيانات التجريبيّة | 2 د | ملف SQL |
| 5️⃣ رفع المشروع على GitHub | 5 د | حساب GitHub |
| 6️⃣ النشر على Vercel | 10 د | حساب Vercel مجاني |
| 7️⃣ ربط البيئة | 5 د | المفاتيح من Supabase |
| 8️⃣ تجربة بـ4 أدوار | 5 د | المتصفّح |

**المجموع: ~40 دقيقة · التكلفة: 0 ر.س** 🎉

---

## 1️⃣ إنشاء حساب Supabase (قاعدة البيانات)

### الخطوات:
1. اذهبي إلى [supabase.com](https://supabase.com) · اضغطي **Start your project**
2. سجّلي بـGitHub أو إيميل · **مجاناً**
3. **New Project**:
   - **Name**: `befirstlady`
   - **Database Password**: اختاري كلمة قويّة · **احفظيها**
   - **Region**: `West EU (Ireland)` ← أقرب للسعوديّة بسرعة ممتازة
4. انتظري 2 دقيقة · المشروع يتجهّز

### احفظي 3 مفاتيح من Settings → API:
```
NEXT_PUBLIC_SUPABASE_URL      = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbG...
SUPABASE_SERVICE_ROLE_KEY     = eyJhbG...  (⚠️ لا تشاركيه أبداً)
```

---

## 2️⃣ تشغيل الهجرات (بناء الجداول)

### Supabase Dashboard → SQL Editor → New Query:

شغّلي الملفّات **بالترتيب** واحد واحد:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_gift_bookings.sql`
4. `supabase/migrations/004_phase2_features.sql`
5. `supabase/migrations/005_hr_attendance.sql`
6. `supabase/migrations/006_system_hardening.sql`
7. `supabase/migrations/007_fix_junction_rls.sql`
8. `supabase/migrations/008_tax_settings.sql`
9. `supabase/migrations/009_gift_cards_referral_inventory.sql`
10. `supabase/migrations/010_mobile_app.sql`

**افتحي كل ملف · انسخي محتواه كامل · الصقي في SQL Editor · Run**

### تحقّقي:
- اذهبي إلى **Table Editor** → بتلقين 20+ جدول
- `profiles · bookings · services · staff_services · gift_cards · ...`

---

## 3️⃣ زرع الخدمات الـ46

في SQL Editor، شغّلي:
```
supabase/seed/01_categories_services.sql
```

### تحقّقي:
- **Table Editor** → `services` → بتلقين 46 صف

---

## 4️⃣ إنشاء حسابات الاختبار (4 أدوار)

على كمبيوتركِ (بعد ما تستلمي المشروع):

```bash
cd befirstlady-v2
npm install --legacy-peer-deps

# اضبطي المتغيّرات
export NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."

# شغّلي السكريبت
npx tsx scripts/create-test-users.ts
```

### النتيجة · 4 حسابات:

| الدور | الإيميل | كلمة المرور |
|------|--------|------------|
| 👑 المالكة · غد | `owner@befirstlady.com` | `Owner@2026!` |
| 🛡 المديرة · نورة | `manager@befirstlady.com` | `Manager@2026!` |
| 💼 الموظّفة · هديل | `staff@befirstlady.com` | `Staff@2026!` |
| 🌸 العميلة · سارة | `customer@befirstlady.com` | `Customer@2026!` |

> ⚠️ **غيّري الكلمات قبل الإطلاق الفعلي للناس**

---

## 5️⃣ زرع البيانات التجريبيّة

في SQL Editor، شغّلي:
```
supabase/seed/02_sample_data.sql
```

**هذا بيضيف:**
- 1840 نقطة ولاء لسارة + طبقة ذهبيّة
- حجزين لسارة (قادم + سابق)
- 6 خدمات مُسنَدة لهديل
- جدول عمل هديل (6 أيام)
- بطاقة هديّة `GC-TEST-2026` برصيد 420 ر.س
- كوبون `WELCOME20` خصم 20%
- 5 عناصر مخزون (واحد نفذ)
- 3 إشعارات للمالكة

---

## 6️⃣ رفع المشروع على GitHub

```bash
cd befirstlady-v2

# إنشاء git جديد
git init
git add .
git commit -m "Be First Lady · initial deployment"

# أنشئي repo جديد على github.com/new (private · recommended)
git remote add origin https://github.com/YOUR_USER/befirstlady.git
git branch -M main
git push -u origin main
```

---

## 7️⃣ النشر على Vercel

### الخطوات:
1. اذهبي إلى [vercel.com](https://vercel.com) · سجّلي بـGitHub
2. **Import Project** → اختاري `befirstlady`
3. **Framework Preset**: Next.js (تلقائي)
4. **Environment Variables** · أضيفي:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
NEXT_PUBLIC_SITE_URL=https://befirstlady.vercel.app
NEXT_PUBLIC_WHATSAPP_NUMBER=966504389329
```

5. **Deploy** · انتظري 2-3 دقائق

### النتيجة:
```
🌐 https://befirstlady.vercel.app
```

---

## 8️⃣ تجربة الـ4 أدوار

### 🌸 كعميلة
1. افتحي `/login`
2. سجّلي: `customer@befirstlady.com` / `Customer@2026!`
3. راح تلقين:
   - 1840 نقطة ولاء · طبقة ذهبيّة
   - موعد قادم بكرة الساعة 5 م
   - 46 خدمة في `/booking`
   - تقدرين تحجزين · تطبّقين بطاقة `GC-TEST-2026`

### 💼 كموظّفة
1. اذهبي إلى `/login`
2. سجّلي: `staff@befirstlady.com` / `Staff@2026!`
3. راح يحوّلكِ لـ`/admin`
4. راح تلقين:
   - **اليوم** · زرّ الحضور الكبير
   - **حجوزاتي** · 1 حجز قادم
   - **جدولي** · 6 أيام عمل + الاثنين إجازة
   - **إجازاتي** · تقدرين تطلبين

### 🛡 كمديرة
1. سجّلي: `manager@befirstlady.com` / `Manager@2026!`
2. راح تلقين كل الصفحات ما عدا:
   - التقارير
   - الرواتب
   - اليوزرات
   - الإعدادات

### 👑 كمالكة
1. سجّلي: `owner@befirstlady.com` / `Owner@2026!`
2. راح تلقين **كل شي**:
   - 13 صفحة في الـsidebar
   - 3 إشعارات في الجرس
   - صلاحيّة إنشاء يوزرات
   - تقارير · رواتب · إعدادات

---

## ✅ قائمة فحص سريعة

- [ ] Supabase project مُنشأ
- [ ] الـ10 migrations تمّت بنجاح
- [ ] 46 خدمة في الجدول
- [ ] 4 حسابات مُنشأة
- [ ] البيانات التجريبيّة مزروعة
- [ ] المشروع على GitHub
- [ ] Vercel يبني بدون أخطاء
- [ ] الموقع يفتح على رابط Vercel
- [ ] تسجيل الدخول يشتغل لكل الأدوار
- [ ] كل دور يشوف صفحاته فقط

---

## 🔧 مشاكل شائعة وحلولها

### "Invalid API Key" عند تسجيل الدخول
→ تأكّدي من `NEXT_PUBLIC_SUPABASE_ANON_KEY` في Vercel · ونفس القيمة اللي في `.env.local` محلياً

### "User not found" بعد إنشاء الحسابات
→ شغّلي السكريبت بعد ما تنتهي الـmigrations · ليس قبلها

### الصفحات ما تفتح بعد تسجيل الدخول
→ تأكّدي أن `profiles` فيها الدور الصحيح (owner/manager/staff/customer)

### Build يفشل على Vercel
→ تحقّقي من `.env` كامل · والـNode version `18.x` أو أحدث

### لا توجد خدمات في `/booking`
→ شغّلي `supabase/seed/01_categories_services.sql` (الـ46 خدمة)

---

## 🎯 الخطوات التالية بعد النجاح

### مرحلة 1 (نفس اليوم):
- [ ] اربطي دومينك الخاص (befirstlady.com) من Vercel → Domains
- [ ] فعّلي SSL (تلقائي من Vercel)
- [ ] جرّبي كل الـflows (حجز · إجازة · تقرير)

### مرحلة 2 (الأسبوع الأول):
- [ ] فعّلي WhatsApp Cloud API (مجاناً)
- [ ] فعّلي Resend للبريد (مجاني 3000 بريد)
- [ ] أضيفي صور الخدمات الحقيقيّة
- [ ] أنشئي حسابات الموظفات الفعليّة
- [ ] أضيفي العميلات الموجودات (لو عندكِ قاعدة)

### مرحلة 3 (الشهر الأول):
- [ ] سجّلي في Moyasar للدفع الإلكتروني
- [ ] فعّلي Firebase للـPush Notifications
- [ ] جهّزي حسابات App Store + Google Play
- [ ] ارفعي التطبيق الناتيف للمتجرين

---

## 🆘 لو احتجتِ مساعدة

- **تخلط عليكِ خطوة؟** راسلي شاهين، نكمّل سوا
- **Supabase**: [docs.supabase.com](https://docs.supabase.com)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)

---

**Shaheen Design** · بنيناه لـ Be First Lady 🌸  
*كل خطوة في هذا الدليل مُجرَّبة ومُختبرة · لو شي ما شتغل، المشكلة في البيئة مش في الكود.*
