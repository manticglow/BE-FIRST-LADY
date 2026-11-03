# 🗄️ تطبيق قاعدة البيانات · دليل الاستخدام

## 📋 الملفات بالترتيب (22 ملف)

افتحي **Supabase Dashboard → SQL Editor** · ونفّذي الملفات بالترتيب التالي:

### 🏗️ الأساسيات (مرة واحدة فقط · لأوّل مرة)

| # | الملف | الوظيفة |
|---|---|---|
| 1 | `001_initial_schema.sql` | الجداول الأساسيّة (profiles · categories · services · bookings · ...) |
| 2 | `002_rls_policies.sql` | سياسات الأمان (RLS) |
| 3 | `003_gift_bookings.sql` | حجوزات الهدايا |
| 4 | `004_phase2_features.sql` | staff_schedule · blocked_dates · loyalty · coupons |
| 5 | `005_hr_attendance.sql` | الحضور والانصراف + leave_requests |
| 6 | `006_system_hardening.sql` | تحسينات أمنيّة |
| 7 | `007_fix_junction_rls.sql` | إصلاح junction tables RLS |
| 8 | `008_tax_settings.sql` | الضرائب (VAT · ZATCA) |
| 9 | `009_gift_cards_referral_inventory.sql` | بطاقات الهديّة · الإحالة · المخزون |
| 10 | `010_mobile_app.sql` | إعدادات التطبيق الجوّال |

### 📅 أكتوبر 2026

| # | الملف | الوظيفة |
|---|---|---|
| 11 | `20261019_otp_codes.sql` | رموز OTP للدخول بالجوّال |
| 12 | `20261020_customer_experience.sql` | تحسينات تجربة العميلة |

### 📅 نوفمبر 2026

| # | الملف | الوظيفة |
|---|---|---|
| 13 | `20261101_expenses_and_notes.sql` | المصروفات والملاحظات |
| 14 | `20261101_security_hardening.sql` | تشديد الأمان |
| 15 | `20261102_beauty_profile.sql` | ملف الجمال (العميلة) |
| 16 | `20261102_customer_prefs.sql` | تفضيلات العميلة |
| 17 | `20261102_gift_cards_email.sql` | إيميل بطاقات الهديّة |
| 18 | `20261102_payments.sql` | **المدفوعات (موياسر · تابي · تمارا)** |
| 19 | `20261102_reminders.sql` | التذكيرات التلقائيّة |
| 20 | `20261103_newsletter.sql` | **اشتراك النشرة البريديّة** |
| 21 | `20261103_push_subscriptions.sql` | **Web Push notifications** |
| 22 | `20261104_staff_requests.sql` | ⭐ **نظام طلبات الموظّفات (الأحدث)** |

---

## ✅ ملاحظات مهمّة

- **كل الملفات idempotent** — تقدرين تنفّذي أي ملف أكثر من مرّة بدون مشاكل (تستخدم `IF NOT EXISTS`)
- لو كنتِ طبّقتي بعضها من قبل · شغّلي فقط الملفات الجديدة من 20 إلى 22
- لو تبدأين من الصفر · شغّلي كل الـ22 بالترتيب
- بعد كل ملف · شوفي رسالة النجاح قبل ما تنتقلي للي بعده

---

## 🚀 طريقة سريعة (إذا الملفات كثيرة)

افتحي `combined-all.sql` (مُجمَّع في نفس المجلّد) ونفّذيه مرّة واحدة.

> ⚠️ **تحذير:** الملف الـcombined كبير (~2200 سطر). Supabase SQL Editor يقبله لكن ممكن ياخذ 20-30 ثانية.
