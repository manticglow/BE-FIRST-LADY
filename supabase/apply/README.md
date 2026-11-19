# 📊 Supabase · Database Setup

> دليل تطبيق قاعدة البيانات لـ The First Lady

---

## 🚀 التثبيت السريع · ملفّان فقط

### الخطوة 1 · الـschema الأساسي

```sql
-- للمشاريع الجديدة · schema كامل (23 جدول · 90+ RLS):
combined-all.sql
```

**الوقت المتوقّع:** 10-30 ثانية

---

### الخطوة 2 · الإعداد الشامل (Launch Setup)

```sql
-- يدمج 4 ملفّات في واحد · شغّليه مرّة واحدة:
00-full-setup.sql
```

يُطبّق:
- 🔒 Security Hardening (12 ثغرة محسومة)
- 📋 Compliance Tables (PDPL · شكاوى · طلبات بيانات)
- 📸 Service Images Bucket (رفع صور الخدمات)
- 👥 Test Accounts (رغد · ريناد · غيداء)

**idempotent · آمن للتشغيل مرّات متعدّدة.**

---

## 🔐 حسابات الاختبار (من 00-full-setup.sql)

| الدور | الاسم | البريد | كلمة السر |
|---|---|---|---|
| 👑 المالكة | رغد الزهراني | owner@thefirstlady.sa | `Raghad@2026!` |
| 👩‍💼 الموظّفة | ريناد السالم | renad@thefirstlady.sa | `Renad@2026!` |
| 🌸 العميلة | غيداء العتيبي | ghaida@thefirstlady.sa | `Ghaida@2026!` |

> **مهمّ:** غيّري كلمات السرّ بعد أوّل دخول من الإعدادات.

---

## 📁 الملفّات الأخرى (مرجعيّة · لا تحتاجينها عادة)

| الملف | متى تستخدمينه |
|-------|-------------|
| `combined-all.sql` | ✅ التثبيت الأوّل (schema كامل) |
| `00-full-setup.sql` | ✅ **الإعداد الشامل الجديد** (يستبدل الـ4 ملفات أدناه) |
| `SECURITY-HARDENING.sql` | منفرد · داخل 00-full-setup |
| `compliance-tables.sql` | منفرد · داخل 00-full-setup |
| `service-images-bucket.sql` | منفرد · داخل 00-full-setup |
| `test-accounts.sql` | منفرد · داخل 00-full-setup |
| `safe-latest.sql` | تحديث جزئي لمشاريع قديمة |
| `security-gift-cards.sql` | تحديث أمني إضافي (gift cards) |
| `safe-themes.sql` | تحديث الـthemes فقط |
| `CLEANUP-for-launch.sql` | حذف البيانات التجريبيّة قبل الإطلاق |

---

## 🎯 سيناريوهات شائعة

### 1. مشروع Supabase جديد تماماً
```
→ combined-all.sql       (الـschema كامل)
→ 00-full-setup.sql      (الأمان + الامتثال + الـbucket + الحسابات)
```

### 2. مشروع فيه بيانات قديمة
```
→ 00-full-setup.sql      (آمن · ما يحذف شيء)
```

### 3. قبل الإطلاق للجمهور
```
→ CLEANUP-for-launch.sql  (يحذف بيانات تجريبيّة)
```

---

## ⚠️ قبل التنفيذ · احتياطات

1. ✅ **خذي نسخة احتياطيّة:**
   ```
   Supabase → Database → Backups → Create Backup
   ```

2. ✅ **اختبري على بيئة التطوير أوّلاً** (لو عندكِ project ثاني)

3. ✅ **تحقّقي من النجاح:** رسالة `Success. No rows returned` أو جدول النتائج النهائي يطلع

---

## 📚 التاريخ الكامل · Migrations الأصليّة

الـ`combined-all.sql` يحتوي على كلّ هذي بالترتيب:

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

---

**آخر تحديث:** 2026-11-20 · 00-full-setup.sql جديد
