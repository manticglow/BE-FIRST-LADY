-- ═══════════════════════════════════════════════════════════════════════
-- 🧹 CLEANUP · تنظيف البيانات التجريبيّة قبل الإطلاق
-- ═══════════════════════════════════════════════════════════════════════
-- يحذف:
--   ✗ كل الحجوزات التجريبيّة
--   ✗ كل التقييمات التجريبيّة
--   ✗ كل كروت الهدايا التجريبيّة
--   ✗ كل الحسابات التجريبيّة (test@/customer@/staff@)
--   ✗ سجلّات الدخول والـOTP والـaudit
--   ✗ الحضور والاستئذانات التجريبيّة
--
-- يحافظ على:
--   ✓ الفئات والخدمات الفعليّة (الباقات · الأسعار · الصور)
--   ✓ الموظفات الفعليّات (الاسم والتخصّص والدوام)
--   ✓ ساعات العمل · الإعدادات الضريبيّة · معلومات المنشأة
--   ✓ المعرض (الصور الحقيقيّة)
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────
-- 1️⃣  حذف الحجوزات والمعاملات المرتبطة بها (آمن · بالترتيب)
-- ─────────────────────────────────────────────────────────────────
TRUNCATE TABLE
  booking_reminders,
  booking_items,
  payments,
  payment_intents,
  bookings
RESTART IDENTITY CASCADE;

-- ─────────────────────────────────────────────────────────────────
-- 2️⃣  حذف التقييمات (كلّها تجريبيّة)
-- ─────────────────────────────────────────────────────────────────
TRUNCATE TABLE reviews RESTART IDENTITY CASCADE;

-- ─────────────────────────────────────────────────────────────────
-- 3️⃣  حذف كروت الهدايا واستخداماتها
-- ─────────────────────────────────────────────────────────────────
TRUNCATE TABLE
  gift_card_redemptions,
  gift_cards
RESTART IDENTITY CASCADE;

-- ─────────────────────────────────────────────────────────────────
-- 4️⃣  حذف الكوبونات التجريبيّة (احتفظي بالفعليّة لو موجودة)
-- ─────────────────────────────────────────────────────────────────
TRUNCATE TABLE
  coupon_uses,
  coupons
RESTART IDENTITY CASCADE;

-- ─────────────────────────────────────────────────────────────────
-- 5️⃣  حذف نقاط الولاء وحركاتها
-- ─────────────────────────────────────────────────────────────────
TRUNCATE TABLE loyalty_transactions RESTART IDENTITY CASCADE;

-- تصفير نقاط الولاء في profiles
UPDATE profiles
SET
  loyalty_points     = 0,
  loyalty_tier       = 'silver',
  total_spent        = 0,
  bookings_count     = 0
WHERE loyalty_points > 0 OR total_spent > 0;

-- ─────────────────────────────────────────────────────────────────
-- 6️⃣  حذف الحضور والاستئذانات التجريبيّة
-- ─────────────────────────────────────────────────────────────────
TRUNCATE TABLE
  attendance_records,
  leave_requests
RESTART IDENTITY CASCADE;

-- ─────────────────────────────────────────────────────────────────
-- 7️⃣  حذف سجلّات الرواتب والمخزون التجريبي
-- ─────────────────────────────────────────────────────────────────
TRUNCATE TABLE
  payroll_records,
  inventory_movements
RESTART IDENTITY CASCADE;

-- حذف المصروفات التجريبيّة (إذا تبين تحتفظين بالفعليّة · علّقي السطر)
TRUNCATE TABLE expenses RESTART IDENTITY CASCADE;

-- ─────────────────────────────────────────────────────────────────
-- 8️⃣  حذف صور الزيارات والمفضّلات
-- ─────────────────────────────────────────────────────────────────
TRUNCATE TABLE
  visit_photos,
  customer_favorites
RESTART IDENTITY CASCADE;

-- ─────────────────────────────────────────────────────────────────
-- 9️⃣  حذف الـAuth logs والـOTP والـnotifications القديمة
-- ─────────────────────────────────────────────────────────────────
TRUNCATE TABLE
  otp_codes,
  login_attempts,
  session_activity,
  rate_limits,
  audit_log,
  audit_logs,
  push_notifications_log,
  push_subscriptions,
  device_tokens,
  permission_requests
RESTART IDENTITY CASCADE;

-- ─────────────────────────────────────────────────────────────────
-- 🔟  حذف سجلّ رسائل واتساب التجريبيّة (إذا الجدول موجود)
-- ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_log') THEN
    EXECUTE 'TRUNCATE TABLE whatsapp_log RESTART IDENTITY CASCADE';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_logs') THEN
    EXECUTE 'TRUNCATE TABLE whatsapp_logs RESTART IDENTITY CASCADE';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- 1️⃣1️⃣  حذف الحسابات التجريبيّة المعروفة
-- ─────────────────────────────────────────────────────────────────
-- ⚠️ احذفي من auth.users = يحذف من profiles تلقائياً عبر CASCADE
DELETE FROM auth.users
WHERE email IN (
  'customer@thefirstlady.sa',
  'staff@thefirstlady.sa',
  'manager@thefirstlady.com',
  -- حسابات اختبار قديمة محتملة
  'test@thefirstlady.sa',
  'demo@thefirstlady.sa',
  'customer@befirstlady.com',
  'staff@befirstlady.com',
  'manager@befirstlady.com',
  'owner@befirstlady.com'
);

-- 🔴 نحتفظ مؤقّتاً بـ owner@thefirstlady.com حتى تكمل رغد التسجيل
--     وبعدين تحذفينه يدوياً
-- SELECT * FROM auth.users WHERE email = 'owner@thefirstlady.com';
-- DELETE FROM auth.users WHERE email = 'owner@thefirstlady.com';  -- بعد تسجيل رغد

-- ─────────────────────────────────────────────────────────────────
-- 1️⃣2️⃣  حذف أي عميلة إضافيّة أنشأتها عبر الاختبار (role=customer)
--       ⚠️ هذه الخطوة اختياريّة · فعّليها لو تبين كل العملاء يبدأون من صفر
-- ─────────────────────────────────────────────────────────────────
-- DELETE FROM auth.users
-- WHERE id IN (SELECT id FROM profiles WHERE role = 'customer');

-- ─────────────────────────────────────────────────────────────────
-- 1️⃣3️⃣  حذف موظّفة الاختبار "هديل القحطاني" إذا موجودة
-- ─────────────────────────────────────────────────────────────────
DELETE FROM staff
WHERE name IN ('هديل القحطاني', 'سارة الزهراني', 'Hadeel', 'Sarah');

-- ─────────────────────────────────────────────────────────────────
-- 1️⃣4️⃣  حذف صور الـgallery التجريبيّة (لو في)
-- ─────────────────────────────────────────────────────────────────
-- DELETE FROM gallery WHERE created_by IS NULL;  -- فعّلي لو تبين

-- ─────────────────────────────────────────────────────────────────
-- 1️⃣5️⃣  حذف العروض التجريبيّة (offers)
-- ─────────────────────────────────────────────────────────────────
TRUNCATE TABLE offers RESTART IDENTITY CASCADE;

-- ─────────────────────────────────────────────────────────────────
-- 1️⃣6️⃣  حذف التواريخ المحظورة التجريبيّة (ما قبل اليوم)
-- ─────────────────────────────────────────────────────────────────
DELETE FROM blocked_dates WHERE date < CURRENT_DATE;

-- ─────────────────────────────────────────────────────────────────
-- 1️⃣7️⃣  النشرة البريديّة (newsletter) · تنظيف
-- ─────────────────────────────────────────────────────────────────
TRUNCATE TABLE newsletter_subscribers RESTART IDENTITY CASCADE;

-- ═══════════════════════════════════════════════════════════════════════
-- ✅ تقرير نهائي · تأكّدي من الأرقام
-- ═══════════════════════════════════════════════════════════════════════
COMMIT;

-- بعد الـCOMMIT · شغّلي هذا للتحقّق:
SELECT 'bookings'               AS tbl, COUNT(*) AS cnt FROM bookings UNION ALL
SELECT 'reviews'                     , COUNT(*)        FROM reviews UNION ALL
SELECT 'gift_cards'                  , COUNT(*)        FROM gift_cards UNION ALL
SELECT 'otp_codes'                   , COUNT(*)        FROM otp_codes UNION ALL
SELECT 'audit_logs'                  , COUNT(*)        FROM audit_logs UNION ALL
SELECT 'login_attempts'              , COUNT(*)        FROM login_attempts UNION ALL
SELECT 'profiles (customers)'        , COUNT(*)        FROM profiles WHERE role = 'customer' UNION ALL
SELECT 'profiles (staff)'            , COUNT(*)        FROM profiles WHERE role = 'staff' UNION ALL
SELECT 'profiles (owner/manager)'    , COUNT(*)        FROM profiles WHERE role IN ('owner','manager') UNION ALL
SELECT 'staff (employees list)'      , COUNT(*)        FROM staff UNION ALL
SELECT 'services (menu)'             , COUNT(*)        FROM services UNION ALL
SELECT 'categories'                  , COUNT(*)        FROM categories;

-- ═══════════════════════════════════════════════════════════════════════
-- 📋 النتيجة المتوقّعة:
--   bookings              = 0   ✓ نظيف
--   reviews               = 0   ✓ نظيف
--   gift_cards            = 0   ✓ نظيف
--   otp_codes             = 0   ✓ نظيف
--   audit_logs            = 0   ✓ نظيف
--   login_attempts        = 0   ✓ نظيف
--   profiles (customers)  = 0   ✓ نظيف (ما في عميلات تجريبيّات)
--   profiles (staff)      = 0   ✓ نظيف
--   profiles (owner/mgr)  = 1   ✓ owner@thefirstlady.com احتفظ به مؤقّتاً
--   staff (employees)     = 15  ✓ الموظّفات الحقيقيّات محفوظات
--   services              = 60+ ✓ كل الخدمات محفوظة
--   categories            = 10+ ✓ الفئات محفوظة
-- ═══════════════════════════════════════════════════════════════════════
