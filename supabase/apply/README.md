# 📊 Supabase · Database Setup

> دليل تطبيق قاعدة البيانات لـ The First Lady

---

## 🚀 التثبيت السريع (مشروع جديد)

لقاعدة بيانات Supabase جديدة تماماً:

```sql
-- شغّلي هذا الملف الواحد في SQL Editor:
combined-all.sql
```

يُنشئ:
- 23 جدول · كل الـschema
- 90+ سياسة RLS
- كل الـfunctions والـtriggers
- كل الـviews والـmaterialized views

**الوقت المتوقّع:** 10-30 ثانية

---

## 🔄 التحديثات (مشروع موجود)

### آخر تحديث أمني · يجب تطبيقه:

```sql
-- يُضيف حماية لـgift_cards + reviews
security-gift-cards.sql
```

---

## 📁 ملفات أخرى

| الملف | الاستخدام |
|-------|-----------|
| `combined-all.sql` | ✅ **الوحيد المطلوب** لمشروع جديد |
| `security-gift-cards.sql` | 🔒 تحديث أمني إلزامي |
| `fix-payments.sql` | 🛠️ إصلاح جدول payment_intents (موجود في combined) |
| `whatsapp-log.sql` | 📱 جدول whatsapp_log (موجود في combined) |
| `safe-latest.sql` | 🔄 تحديث آخر migration بأمان لو شي ناقص |
| `safe-themes.sql` | 🎨 تحديث themes فقط |
| `latest-only.sql` | 📝 آخر migration لوحده (مرجعي) |

---

## 🎯 سيناريوهات شائعة

### 1. تنصيب لأوّل مرّة
```sql
-- في Supabase SQL Editor:
-- Step 1: تطبيق الـschema الكامل
   → combined-all.sql

-- Step 2: التحديث الأمني الأخير
   → security-gift-cards.sql
```

### 2. تحديث من نسخة سابقة
```sql
-- طبّقي فقط التحديثات الجديدة بالترتيب:
-- 1. safe-latest.sql       ← يضيف ما نقص
-- 2. security-gift-cards.sql  ← الأمان
```

### 3. مشكلة في جدول معيّن
```sql
-- شغّلي الملف المناسب:
-- payments مفقود:     fix-payments.sql
-- whatsapp_log مفقود: whatsapp-log.sql
-- themes متضاربة:     safe-themes.sql
```

---

## ⚠️ تحذير · قبل التنفيذ

قبل تشغيل أي migration على قاعدة بيانات موجودة:

1. ✅ خذي نسخة احتياطيّة:
   ```
   Supabase → Database → Backups → Create Backup
   ```

2. ✅ اختبري على بيئة التطوير أوّلاً

3. ✅ تحقّقي من رسالة النجاح:
   ```
   Success. No rows returned
   ```

---

## 📚 التاريخ · Migrations الأصليّة

الـcombined-all.sql يحتوي على كل هذي بالترتيب:

| # | الملف | الوصف |
|---|-------|--------|
| 001 | initial_schema.sql | profiles · services · bookings · categories · packages · staff |
| 002 | rls_policies.sql | سياسات Row Level Security |
| 003 | gift_bookings.sql | الحجوزات كهديّة |
| 004 | phase2_features.sql | reviews · coupons · banners |
| 005 | hr_attendance.sql | الحضور والدوام |
| 006 | system_hardening.sql | audit logs · rate limits |
| 007 | fix_junction_rls.sql | إصلاح junction tables |
| 008 | tax_settings.sql | إعدادات الضريبة (ZATCA) |
| 009 | gift_cards.sql | بطاقات الهديّة |
| 010 | mobile_app.sql | دعم تطبيق الجوّال |
| 2026-10 | customer_experience.sql | تجربة العميلة · OTP |
| 2026-11 | security + beauty + payments | تحديثات نوفمبر |

كلّها مُدمجة في `combined-all.sql` · ما تحتاجين تطبّقينها فرديّاً.
