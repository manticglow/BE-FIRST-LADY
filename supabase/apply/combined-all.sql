-- ═══════════════════════════════════════════════════════════
-- Be First Lady — Database Schema
-- Initial migration · 2026-10-13
-- ═══════════════════════════════════════════════════════════
--
-- 📊 الجداول:
--   1. profiles       — ملفات المستخدمين (ترتبط بـ auth.users)
--   2. categories     — أقسام الخدمات (مساج، شعر، بشرة...)
--   3. services       — الخدمات المفردة (مع السعر والمدة)
--   4. packages       — البكجات (بكج الصيف، إلخ)
--   5. staff          — الموظفات
--   6. bookings       — الحجوزات
--   7. booking_items  — الخدمات في كل حجز
--   8. payments       — المدفوعات
--   9. gallery        — صور معرض الأعمال
--   10. reviews       — التقييمات
--   11. hours         — ساعات العمل
--   12. offers        — العروض الفعّالة
--   13. audit_log     — سجلّ العمليات (للمتابعة)
-- ═══════════════════════════════════════════════════════════

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ═══════════════════════════════════════════════════════════
-- 1. PROFILES (مرتبط بـ auth.users)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  phone           TEXT UNIQUE,
  email           TEXT UNIQUE,
  role            TEXT NOT NULL DEFAULT 'customer'
                  CHECK (role IN ('customer', 'staff', 'manager', 'owner')),
  avatar_url      TEXT,
  birthday        DATE,
  notes           TEXT,  -- ملاحظات داخلية (للأدمن)
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ═══════════════════════════════════════════════════════════
-- 2. CATEGORIES (أقسام الخدمات)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,  -- مثل: massage, hair, nails
  name_ar         TEXT NOT NULL,          -- مثل: خدمات المساج
  name_en         TEXT NOT NULL,          -- مثل: Massage Services
  icon            TEXT,                   -- اسم أيقونة أو emoji
  color           TEXT DEFAULT '#7d613b',
  description_ar  TEXT,
  description_en  TEXT,
  display_order   INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_order ON categories(display_order);

-- ═══════════════════════════════════════════════════════════
-- 3. SERVICES (الخدمات المفردة)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE services (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id     UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name_ar         TEXT NOT NULL,          -- مثل: مساج سويدي
  name_en         TEXT NOT NULL,          -- Swedish Massage
  description_ar  TEXT,
  description_en  TEXT,
  price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  price_from      BOOLEAN DEFAULT FALSE,   -- "يبدأ من 300"
  duration_min    INTEGER NOT NULL CHECK (duration_min > 0), -- بالدقائق
  image_url       TEXT,
  is_featured     BOOLEAN DEFAULT FALSE,
  is_active       BOOLEAN DEFAULT TRUE,
  display_order   INTEGER DEFAULT 0,
  notes_ar        TEXT,  -- ملاحظات (مثل: "لا يشمل الرموش")
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_services_featured ON services(is_featured);

-- ═══════════════════════════════════════════════════════════
-- 4. PACKAGES (البكجات مثل بكج الصيف)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE packages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,
  name_ar         TEXT NOT NULL,
  name_en         TEXT,
  description_ar  TEXT,
  price           NUMERIC(10,2) NOT NULL,
  original_price  NUMERIC(10,2),  -- السعر قبل الخصم
  cover_image_url TEXT,
  valid_from      DATE,
  valid_until     DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- خدمات كل بكج
CREATE TABLE package_services (
  package_id      UUID REFERENCES packages(id) ON DELETE CASCADE,
  service_id      UUID REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (package_id, service_id)
);

-- ═══════════════════════════════════════════════════════════
-- 5. STAFF (الموظفات)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE staff (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  job_title       TEXT NOT NULL,         -- أخصائية مساج، مصففة شعر
  specialties     TEXT[],                 -- ['مساج', 'بشرة']
  avatar_url      TEXT,
  bio             TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- التخصّصات: ربط موظفة بخدمات تقدر تسوّيها
CREATE TABLE staff_services (
  staff_id    UUID REFERENCES staff(id) ON DELETE CASCADE,
  service_id  UUID REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);

-- ═══════════════════════════════════════════════════════════
-- 6. BOOKINGS (الحجوزات) ⭐ الجدول الأهم
-- ═══════════════════════════════════════════════════════════
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number  TEXT UNIQUE NOT NULL DEFAULT ('BK-' || LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 1000000)::TEXT, 6, '0')),

  -- العميلة (قد تكون حساب أو زائرة)
  customer_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,
  customer_phone  TEXT NOT NULL,
  customer_email  TEXT,

  -- التوقيت
  booking_date    DATE NOT NULL,
  booking_time    TIME NOT NULL,
  duration_min    INTEGER NOT NULL,  -- مجموع مدد الخدمات

  -- الموظفة (اختياري)
  staff_id        UUID REFERENCES staff(id) ON DELETE SET NULL,

  -- المبالغ
  subtotal        NUMERIC(10,2) NOT NULL,
  discount        NUMERIC(10,2) DEFAULT 0,
  tax             NUMERIC(10,2) DEFAULT 0,
  total           NUMERIC(10,2) NOT NULL,

  -- الحالة
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  payment_status  TEXT NOT NULL DEFAULT 'unpaid'
                  CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),

  -- ملاحظات
  customer_notes  TEXT,  -- طلبات العميلة
  admin_notes     TEXT,  -- ملاحظات داخلية

  -- التتبّع
  source          TEXT DEFAULT 'website' CHECK (source IN ('website', 'whatsapp', 'walk-in', 'phone')),
  cancellation_reason TEXT,
  cancelled_at    TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_phone ON bookings(customer_phone);

-- ═══════════════════════════════════════════════════════════
-- 7. BOOKING_ITEMS (الخدمات في كل حجز)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE booking_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id    UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_id    UUID REFERENCES services(id) ON DELETE SET NULL,
  service_name  TEXT NOT NULL,  -- نسخة مجمّدة من الاسم وقت الحجز
  price         NUMERIC(10,2) NOT NULL,
  duration_min  INTEGER NOT NULL,
  quantity      INTEGER DEFAULT 1 CHECK (quantity > 0),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_booking_items_booking ON booking_items(booking_id);

-- ═══════════════════════════════════════════════════════════
-- 8. PAYMENTS (المدفوعات)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id      UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount          NUMERIC(10,2) NOT NULL,
  method          TEXT NOT NULL CHECK (method IN ('cash', 'card', 'transfer', 'mada', 'applepay', 'stc')),
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  gateway         TEXT,  -- 'moyasar', 'tap', 'manual'
  gateway_ref     TEXT,  -- reference ID من البوّابة
  receipt_url     TEXT,
  paid_at         TIMESTAMPTZ,
  refunded_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ═══════════════════════════════════════════════════════════
-- 9. GALLERY (معرض الأعمال)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE gallery (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_ar        TEXT,
  title_en        TEXT,
  image_url       TEXT NOT NULL,
  thumbnail_url   TEXT,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_featured     BOOLEAN DEFAULT FALSE,  -- للصور العريضة
  display_order   INTEGER DEFAULT 0,
  is_published    BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- 10. REVIEWS (التقييمات)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id      UUID REFERENCES bookings(id) ON DELETE SET NULL,
  customer_name   TEXT NOT NULL,
  rating          INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  source          TEXT DEFAULT 'internal' CHECK (source IN ('internal', 'google', 'instagram')),
  is_approved     BOOLEAN DEFAULT FALSE,  -- للمراجعة قبل النشر
  is_featured     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_reviews_approved ON reviews(is_approved);

-- ═══════════════════════════════════════════════════════════
-- 11. HOURS (ساعات العمل)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE hours (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section         TEXT NOT NULL CHECK (section IN ('spa', 'salon')),
  day_of_week     INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- NULL = كل الأيام
  open_time       TIME NOT NULL,
  close_time      TIME NOT NULL,
  is_closed       BOOLEAN DEFAULT FALSE,
  special_date    DATE,  -- لأيام خاصة (أعياد، إجازات)
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- 12. OFFERS (العروض الحالية)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE offers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,
  title_ar        TEXT NOT NULL,
  subtitle_ar     TEXT,
  description_ar  TEXT,
  discount_type   TEXT CHECK (discount_type IN ('percentage', 'fixed', 'package')),
  discount_value  NUMERIC(10,2),
  valid_from      DATE NOT NULL,
  valid_until     DATE NOT NULL,
  banner_image    TEXT,
  is_active       BOOLEAN DEFAULT TRUE,
  display_order   INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- 13. AUDIT_LOG (سجلّ العمليات - للتتبّع)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,       -- 'booking.created', 'service.updated'
  entity_type TEXT NOT NULL,       -- 'booking', 'service'
  entity_id   UUID,
  details     JSONB,
  ip_address  INET,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_date ON audit_log(created_at DESC);

-- ═══════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGER (تحديث updated_at تلقائياً)
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated   BEFORE UPDATE ON profiles   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_services_updated   BEFORE UPDATE ON services   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_bookings_updated   BEFORE UPDATE ON bookings   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ═══════════════════════════════════════════════════════════
-- Be First Lady — Row Level Security Policies
-- ═══════════════════════════════════════════════════════════
--
-- 🔒 الصلاحيات:
--   • public (عميلات/زوّار): يشوفوا الخدمات، المعرض، التقييمات
--   • customer: يشوفوا حجوزاتهم الخاصة فقط
--   • staff: يشوفوا حجوزاتهم كموظفات + حجوزات اليوم
--   • manager/owner: يشوفوا ويعدّلوا كل شي
-- ═══════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE services       ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff          ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews        ENABLE ROW LEVEL SECURITY;
ALTER TABLE hours          ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log      ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════
-- HELPER FUNCTION: هل المستخدم أدمن؟
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('manager', 'owner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_staff() RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('staff', 'manager', 'owner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════
-- PROFILES
-- ═══════════════════════════════════════════════════════════
-- كل مستخدم يشوف ملفه، الأدمن يشوف الكل
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins manage all profiles"
  ON profiles FOR ALL
  USING (is_admin());

-- ═══════════════════════════════════════════════════════════
-- CATEGORIES & SERVICES (قراءة عامة · تعديل أدمن)
-- ═══════════════════════════════════════════════════════════
CREATE POLICY "Public reads active categories"
  ON categories FOR SELECT
  USING (is_active = TRUE OR is_admin());

CREATE POLICY "Admins manage categories"
  ON categories FOR ALL USING (is_admin());

CREATE POLICY "Public reads active services"
  ON services FOR SELECT
  USING (is_active = TRUE OR is_admin());

CREATE POLICY "Admins manage services"
  ON services FOR ALL USING (is_admin());

-- ═══════════════════════════════════════════════════════════
-- PACKAGES
-- ═══════════════════════════════════════════════════════════
CREATE POLICY "Public reads active packages"
  ON packages FOR SELECT
  USING (is_active = TRUE OR is_admin());

CREATE POLICY "Admins manage packages"
  ON packages FOR ALL USING (is_admin());

CREATE POLICY "Public reads package services"
  ON package_services FOR SELECT USING (TRUE);

CREATE POLICY "Admins manage package services"
  ON package_services FOR ALL USING (is_admin());

-- ═══════════════════════════════════════════════════════════
-- STAFF
-- ═══════════════════════════════════════════════════════════
CREATE POLICY "Public reads active staff"
  ON staff FOR SELECT
  USING (is_active = TRUE OR is_admin());

CREATE POLICY "Admins manage staff"
  ON staff FOR ALL USING (is_admin());

-- ═══════════════════════════════════════════════════════════
-- BOOKINGS (الحجوزات - الأهم)
-- ═══════════════════════════════════════════════════════════
-- العميلة تشوف حجوزاتها
CREATE POLICY "Customers read own bookings"
  ON bookings FOR SELECT
  USING (customer_id = auth.uid() OR is_staff());

-- العميلة تنشئ حجز لنفسها
CREATE POLICY "Customers create own bookings"
  ON bookings FOR INSERT
  WITH CHECK (customer_id = auth.uid() OR customer_id IS NULL);

-- العميلة تلغي حجزها (قبل الموعد بـ 24 ساعة)
CREATE POLICY "Customers cancel own bookings"
  ON bookings FOR UPDATE
  USING (customer_id = auth.uid() AND status IN ('pending', 'confirmed'))
  WITH CHECK (status = 'cancelled');

-- الأدمن يعدّل كل شي
CREATE POLICY "Admins manage all bookings"
  ON bookings FOR ALL USING (is_admin());

-- الموظفات يشوفن ويحدّثن حجوزاتهن
CREATE POLICY "Staff read assigned bookings"
  ON bookings FOR SELECT
  USING (staff_id IN (SELECT id FROM staff WHERE profile_id = auth.uid()) OR is_admin());

-- Booking items تتبع نفس صلاحيات الحجز
CREATE POLICY "Booking items follow booking access"
  ON booking_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_id
    AND (b.customer_id = auth.uid() OR is_staff())
  ));

CREATE POLICY "Admins manage booking items"
  ON booking_items FOR ALL USING (is_admin());

-- ═══════════════════════════════════════════════════════════
-- PAYMENTS
-- ═══════════════════════════════════════════════════════════
CREATE POLICY "Customers read own payments"
  ON payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_id
    AND (b.customer_id = auth.uid() OR is_admin())
  ));

CREATE POLICY "Admins manage payments"
  ON payments FOR ALL USING (is_admin());

-- ═══════════════════════════════════════════════════════════
-- GALLERY (قراءة عامة)
-- ═══════════════════════════════════════════════════════════
CREATE POLICY "Public reads published gallery"
  ON gallery FOR SELECT
  USING (is_published = TRUE OR is_admin());

CREATE POLICY "Admins manage gallery"
  ON gallery FOR ALL USING (is_admin());

-- ═══════════════════════════════════════════════════════════
-- REVIEWS
-- ═══════════════════════════════════════════════════════════
CREATE POLICY "Public reads approved reviews"
  ON reviews FOR SELECT
  USING (is_approved = TRUE OR is_admin());

CREATE POLICY "Customers create reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage reviews"
  ON reviews FOR ALL USING (is_admin());

-- ═══════════════════════════════════════════════════════════
-- HOURS, OFFERS
-- ═══════════════════════════════════════════════════════════
CREATE POLICY "Public reads hours"
  ON hours FOR SELECT USING (TRUE);

CREATE POLICY "Admins manage hours"
  ON hours FOR ALL USING (is_admin());

CREATE POLICY "Public reads active offers"
  ON offers FOR SELECT
  USING (is_active = TRUE AND valid_until >= CURRENT_DATE OR is_admin());

CREATE POLICY "Admins manage offers"
  ON offers FOR ALL USING (is_admin());

-- ═══════════════════════════════════════════════════════════
-- AUDIT LOG (admin only read)
-- ═══════════════════════════════════════════════════════════
CREATE POLICY "Admins read audit log"
  ON audit_log FOR SELECT USING (is_admin());
-- ═══════════════════════════════════════════════════════════
-- 003 — خدمة الهدية (Gift Bookings)
-- ═══════════════════════════════════════════════════════════
--
-- السيناريو:
--   عميلة ترغب تحجز لصديقتها/أمها/أختها كهدية —
--   تدفع هي، والمستقبِلة تستلم دعوة فاخرة واتساب فيها رمز QR
--   تدخل فيه الصالون وتحضر الموعد.
-- ═══════════════════════════════════════════════════════════

-- 1) إضافة أعمدة للحجز
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS is_gift          BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gift_from_name   TEXT,      -- اسم المرسِلة
  ADD COLUMN IF NOT EXISTS gift_from_phone  TEXT,      -- جوال المرسِلة (للتواصل)
  ADD COLUMN IF NOT EXISTS gift_message     TEXT,      -- رسالة شخصية ("من قلبي، أم العيال 💛")
  ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ;  -- وقت إرسال الدعوة

-- 2) السماح للعامة بقراءة الحجز عبر booking_number للدعوات فقط
-- (المستقبِلة ما عندها حساب، فتدخل عبر رابط الدعوة)
CREATE POLICY "Public can view gift bookings by number"
ON bookings FOR SELECT TO anon, authenticated
USING (is_gift = TRUE);

-- 3) السماح بقراءة عناصر الحجز للدعوات
CREATE POLICY "Public can view gift booking items"
ON booking_items FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_id AND b.is_gift = TRUE
  )
);
-- ═══════════════════════════════════════════════════════════
-- 004 — Phase 2 Features
-- ═══════════════════════════════════════════════════════════
-- - جدولة الموظفات (أسبوعية)
-- - أيام الإغلاق/العطل
-- - نقاط الولاء
-- - الكوبونات
-- - تحسينات التقييمات
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- 1) جدولة الموظفات الأسبوعية
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_schedule (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id      UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  day_of_week   INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=الأحد
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  is_off        BOOLEAN DEFAULT FALSE,
  UNIQUE(staff_id, day_of_week)
);
CREATE INDEX IF NOT EXISTS idx_staff_schedule_staff ON staff_schedule(staff_id);

-- ─────────────────────────────────────────────────────────
-- 2) أيام الإغلاق الخاصة (أعياد، صيانة)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blocked_dates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date          DATE NOT NULL,
  reason        TEXT,                  -- "عيد الفطر"، "صيانة"
  all_day       BOOLEAN DEFAULT TRUE,
  start_time    TIME,                  -- إذا جزئياً
  end_time      TIME,
  staff_id      UUID REFERENCES staff(id) ON DELETE CASCADE,  -- NULL = الصالون كله
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON blocked_dates(date);

-- ─────────────────────────────────────────────────────────
-- 3) نقاط الولاء — إضافة لـ profiles
-- ─────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_tier TEXT DEFAULT 'bronze'
    CHECK (loyalty_tier IN ('bronze', 'silver', 'gold', 'diamond')),
  ADD COLUMN IF NOT EXISTS total_spent NUMERIC(10,2) DEFAULT 0;

-- سجل حركات النقاط (شفافية)
CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  points        INTEGER NOT NULL,       -- + أو -
  reason        TEXT NOT NULL,           -- "حجز BK-123"، "خصم بـ 100 نقطة"
  balance_after INTEGER NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loyalty_customer ON loyalty_transactions(customer_id);

-- دالة احسب الطبقة من الإنفاق الكلّي
CREATE OR REPLACE FUNCTION compute_loyalty_tier(spent NUMERIC)
RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
  SELECT CASE
    WHEN spent >= 10000 THEN 'diamond'
    WHEN spent >= 5000  THEN 'gold'
    WHEN spent >= 2000  THEN 'silver'
    ELSE 'bronze'
  END;
$$;

-- Trigger: عند اكتمال الحجز، أضف نقاط
CREATE OR REPLACE FUNCTION award_loyalty_on_completion()
RETURNS TRIGGER AS $$
DECLARE
  points_earned INTEGER;
  new_total     NUMERIC;
  new_balance   INTEGER;
BEGIN
  -- فقط عند التحوّل إلى completed مع دفع
  IF NEW.status = 'completed' AND OLD.status != 'completed'
     AND NEW.payment_status = 'paid' AND NEW.customer_id IS NOT NULL THEN

    points_earned := FLOOR(NEW.total / 10);  -- نقطة لكل 10 ر.س

    -- حدّث الملف
    UPDATE profiles
    SET loyalty_points = loyalty_points + points_earned,
        total_spent    = total_spent + NEW.total,
        loyalty_tier   = compute_loyalty_tier(total_spent + NEW.total)
    WHERE id = NEW.customer_id
    RETURNING loyalty_points, total_spent INTO new_balance, new_total;

    -- سجّل
    INSERT INTO loyalty_transactions (customer_id, booking_id, points, reason, balance_after)
    VALUES (NEW.customer_id, NEW.id, points_earned,
            'حجز ' || NEW.booking_number, new_balance);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_award_loyalty ON bookings;
CREATE TRIGGER trg_award_loyalty
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION award_loyalty_on_completion();

-- ─────────────────────────────────────────────────────────
-- 4) الكوبونات
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT UNIQUE NOT NULL,
  description     TEXT,
  discount_type   TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value  NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  min_total       NUMERIC(10,2) DEFAULT 0,
  max_uses        INTEGER,
  used_count      INTEGER DEFAULT 0,
  expires_at      TIMESTAMPTZ,
  is_active       BOOLEAN DEFAULT TRUE,
  per_customer_limit INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);

-- استخدامات العملاء للكوبونات (منع إساءة الاستخدام)
CREATE TABLE IF NOT EXISTS coupon_uses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id     UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  customer_id   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_phone TEXT,       -- للزوّار
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  discount_applied NUMERIC(10,2) NOT NULL,
  used_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_coupon ON coupon_uses(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_uses_customer ON coupon_uses(customer_id);

-- أضف حقل كوبون للحجز
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC(10,2) DEFAULT 0;

-- ─────────────────────────────────────────────────────────
-- 5) تحسين التقييمات
-- ─────────────────────────────────────────────────────────
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS admin_reply TEXT,
  ADD COLUMN IF NOT EXISTS admin_reply_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS service_names TEXT[];  -- أي خدمات تم تقييمها

-- السماح للجمهور بإنشاء تقييم (معتمد على booking_number)
CREATE POLICY "Public can submit review by booking number"
ON reviews FOR INSERT TO anon, authenticated
WITH CHECK (
  booking_id IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_id
    AND b.status = 'completed'
  )
);

-- ─────────────────────────────────────────────────────────
-- 6) RLS للجداول الجديدة
-- ─────────────────────────────────────────────────────────
ALTER TABLE staff_schedule       ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons              ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_uses          ENABLE ROW LEVEL SECURITY;

-- staff_schedule: الكل يقرأ (للتوفّر)، الأدمن يعدّل
CREATE POLICY "Public read staff schedule" ON staff_schedule FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admin manage staff schedule" ON staff_schedule FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- blocked_dates: الكل يقرأ، الأدمن يعدّل
CREATE POLICY "Public read blocked dates" ON blocked_dates FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admin manage blocked dates" ON blocked_dates FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- loyalty: العميلة تشوف نقاطها، الأدمن يشوف الكل
CREATE POLICY "Customer views own loyalty" ON loyalty_transactions FOR SELECT TO authenticated USING (auth.uid() = customer_id);
CREATE POLICY "Admin views all loyalty" ON loyalty_transactions FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admin inserts loyalty" ON loyalty_transactions FOR INSERT TO authenticated WITH CHECK (is_admin());

-- coupons: الكل يقرأ الكوبونات المفعّلة (للتحقق)، الأدمن يُدير
CREATE POLICY "Public read active coupons" ON coupons FOR SELECT TO anon, authenticated USING (is_active = TRUE);
CREATE POLICY "Admin manage coupons" ON coupons FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- coupon_uses: الأدمن فقط
CREATE POLICY "Admin manage coupon uses" ON coupon_uses FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
-- ═══════════════════════════════════════════════════════════
-- 005 — نظام الحضور والانصراف (HR Attendance)
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- 1) إعدادات موقع الصالون (geofence)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salon_locations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  address     TEXT,
  latitude    NUMERIC(10,7) NOT NULL,
  longitude   NUMERIC(10,7) NOT NULL,
  radius_m    INTEGER NOT NULL DEFAULT 100,   -- نصف قطر منطقة الحضور (متر)
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- أضيفي موقع افتراضي (المدينة المنوّرة — ستُعدَّل من الإعدادات)
INSERT INTO salon_locations (name, address, latitude, longitude, radius_m)
SELECT 'الصالون الرئيسي', 'المدينة المنوّرة', 24.4686, 39.6142, 150
WHERE NOT EXISTS (SELECT 1 FROM salon_locations);

-- ─────────────────────────────────────────────────────────
-- 2) سجلات الحضور والانصراف
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  check_in_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_out_at    TIMESTAMPTZ,
  check_in_lat    NUMERIC(10,7),
  check_in_lng    NUMERIC(10,7),
  check_out_lat   NUMERIC(10,7),
  check_out_lng   NUMERIC(10,7),
  check_in_accuracy_m   INTEGER,
  check_out_accuracy_m  INTEGER,
  location_id     UUID REFERENCES salon_locations(id) ON DELETE SET NULL,
  notes           TEXT,
  is_late         BOOLEAN DEFAULT FALSE,  -- حضرت متأخرة؟ (قيّمها Trigger مستقبلاً)
  total_minutes   INTEGER,                 -- يحسب تلقائياً عند الانصراف
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(check_in_at DESC);

-- Trigger: حدث total_minutes تلقائياً عند الانصراف
CREATE OR REPLACE FUNCTION calc_attendance_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_out_at IS NOT NULL AND OLD.check_out_at IS NULL THEN
    NEW.total_minutes := EXTRACT(EPOCH FROM (NEW.check_out_at - NEW.check_in_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attendance_duration ON attendance_records;
CREATE TRIGGER trg_attendance_duration
BEFORE UPDATE ON attendance_records
FOR EACH ROW
EXECUTE FUNCTION calc_attendance_duration();

-- ─────────────────────────────────────────────────────────
-- 3) طلبات الإجازة (للمستقبل — جاهزة)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type      TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'emergency', 'unpaid', 'other')),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  reason          TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  review_note     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leave_user ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);

-- ─────────────────────────────────────────────────────────
-- 4) RLS
-- ─────────────────────────────────────────────────────────
ALTER TABLE salon_locations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests      ENABLE ROW LEVEL SECURITY;

-- salon_locations: الكل يقرأ (للتحقق)، الأدمن يُعدِّل
CREATE POLICY "Public read salon location" ON salon_locations FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admin manage salon location" ON salon_locations FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- attendance: الموظفة تشوف سجلاتها فقط، الأدمن يشوف الكل
CREATE POLICY "User views own attendance" ON attendance_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User inserts own attendance" ON attendance_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User updates own attendance" ON attendance_records FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin views all attendance" ON attendance_records FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admin manages all attendance" ON attendance_records FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- leave_requests: الموظفة تنشئ طلباتها، الأدمن يراجع
CREATE POLICY "User views own leaves" ON leave_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User creates own leaves" ON leave_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User cancels own pending leaves" ON leave_requests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admin views all leaves" ON leave_requests FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admin reviews leaves" ON leave_requests FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
-- ═══════════════════════════════════════════════════════════
-- 006 — تحصين النظام والمنطق
-- ═══════════════════════════════════════════════════════════
-- - منع تعارض الحجوزات مع نفس الموظفة (DB-level)
-- - validation للسعة
-- - validation لجدولة الموظفة
-- - منع إساءة استخدام الكوبونات (atomic increment)
-- - منع الهدية لنفس الشخص
-- - إصلاحات صغيرة
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- 1) منع حجزين لنفس الموظفة في نفس الوقت
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_booking_conflict()
RETURNS TRIGGER AS $$
DECLARE
  conflicts INTEGER;
BEGIN
  -- فقط إذا الحجز غير ملغي ومرتبط بموظفة محددة
  IF NEW.status IN ('cancelled', 'no_show') OR NEW.staff_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO conflicts
  FROM bookings
  WHERE staff_id = NEW.staff_id
    AND booking_date = NEW.booking_date
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND status NOT IN ('cancelled', 'no_show')
    AND (
      -- تداخل زمني
      (NEW.booking_time, (NEW.booking_time + (NEW.duration_min || ' minutes')::INTERVAL)::TIME)
      OVERLAPS
      (booking_time, (booking_time + (duration_min || ' minutes')::INTERVAL)::TIME)
    );

  IF conflicts > 0 THEN
    RAISE EXCEPTION 'الموظفة لديها حجز آخر في هذا الوقت';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_conflict ON bookings;
CREATE TRIGGER trg_booking_conflict
BEFORE INSERT OR UPDATE OF booking_time, booking_date, staff_id, duration_min
ON bookings
FOR EACH ROW
EXECUTE FUNCTION check_booking_conflict();

-- ─────────────────────────────────────────────────────────
-- 2) التحقق من جدولة الموظفة (end > start)
-- ─────────────────────────────────────────────────────────
ALTER TABLE staff_schedule
  DROP CONSTRAINT IF EXISTS valid_schedule_times;
ALTER TABLE staff_schedule
  ADD CONSTRAINT valid_schedule_times
  CHECK (is_off = TRUE OR end_time > start_time);

-- ─────────────────────────────────────────────────────────
-- 3) زيادة used_count للكوبون atomically (منع race condition)
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION use_coupon(p_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR used_count < max_uses);

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────
-- 4) منع إهداء النفس (gift_from_phone != customer_phone)
-- ─────────────────────────────────────────────────────────
-- 4-أ) أوّلاً · نظّفي أي بيانات مخالفة من قبل الـconstraint
UPDATE bookings
SET is_gift = FALSE,
    gift_from_name = NULL,
    gift_from_phone = NULL,
    gift_message = NULL
WHERE is_gift = TRUE
  AND gift_from_phone IS NOT NULL
  AND customer_phone IS NOT NULL
  AND REGEXP_REPLACE(gift_from_phone, '[^0-9]', '', 'g')
    = REGEXP_REPLACE(customer_phone, '[^0-9]', '', 'g');

-- 4-ب) ثم أضيفي الـconstraint
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS no_self_gift;
ALTER TABLE bookings
  ADD CONSTRAINT no_self_gift
  CHECK (
    is_gift = FALSE
    OR gift_from_phone IS NULL
    OR customer_phone IS NULL
    OR REGEXP_REPLACE(gift_from_phone, '[^0-9]', '', 'g') != REGEXP_REPLACE(customer_phone, '[^0-9]', '', 'g')
  );

-- ─────────────────────────────────────────────────────────
-- 5) التحقق من رقم الجوال السعودي
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION valid_saudi_phone(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF phone IS NULL THEN RETURN TRUE; END IF;
  -- احذف كل الأحرف غير الرقمية
  RETURN REGEXP_REPLACE(phone, '[^0-9]', '', 'g') ~ '^(966|0)?5[0-9]{8}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ─────────────────────────────────────────────────────────
-- 6) منع تسجيل حضور ثاني إذا فيه مفتوح (DB-level)
-- ─────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_open_attendance
ON attendance_records (user_id)
WHERE check_out_at IS NULL;

-- ─────────────────────────────────────────────────────────
-- 7) منع تقييمين لنفس الحجز
-- ─────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_booking_review
ON reviews (booking_id)
WHERE booking_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────
-- 8) تأكد: السعر لا يكون سالب
-- ─────────────────────────────────────────────────────────
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_price_check;
ALTER TABLE services ADD CONSTRAINT services_price_check CHECK (price >= 0);

ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_price_check;
ALTER TABLE packages ADD CONSTRAINT packages_price_check CHECK (price >= 0);

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_total_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_total_check CHECK (total >= 0);

-- ─────────────────────────────────────────────────────────
-- 9) تأكد: مدة الخدمة موجبة
-- ─────────────────────────────────────────────────────────
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_duration_check;
ALTER TABLE services ADD CONSTRAINT services_duration_check CHECK (duration_min > 0 AND duration_min <= 480);

-- ─────────────────────────────────────────────────────────
-- 10) تأكد: تاريخ الحجز في المستقبل أو اليوم
-- (لا نضيف CHECK لأن الحجوزات القديمة تمر هنا — نترك التحقق في API)
-- ─────────────────────────────────────────────────────────
-- ═══════════════════════════════════════════════════════════
-- 007 — إصلاح RLS للجداول الوسيطة
-- ═══════════════════════════════════════════════════════════
-- staff_services و package_services كانت ناقصة سياسات
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- staff_services (ربط الموظفات بالخدمات التي يقدّمنها)
-- ─────────────────────────────────────────────────────────
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read staff services" ON staff_services;
DROP POLICY IF EXISTS "Admin manage staff services" ON staff_services;

CREATE POLICY "Public read staff services"
  ON staff_services FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "Admin manage staff services"
  ON staff_services FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ─────────────────────────────────────────────────────────
-- package_services (تأكد — قد تكون موجودة)
-- ─────────────────────────────────────────────────────────
ALTER TABLE package_services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read package services" ON package_services;
DROP POLICY IF EXISTS "Admin manage package services" ON package_services;

CREATE POLICY "Public read package services"
  ON package_services FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "Admin manage package services"
  ON package_services FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
-- ═══════════════════════════════════════════════════════════
-- 008 — إعدادات الضريبة والفوترة (ZATCA)
-- ═══════════════════════════════════════════════════════════

-- جدول إعدادات المنشأة التجارية (مطابق لمتطلبات ZATCA)
CREATE TABLE IF NOT EXISTS tax_settings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- بيانات المنشأة
  business_name_ar  TEXT NOT NULL DEFAULT 'Be First Lady',
  business_name_en  TEXT,
  commercial_reg    TEXT,              -- السجل التجاري
  vat_number        TEXT,              -- الرقم الضريبي (15 رقم)
  address           TEXT,
  city              TEXT DEFAULT 'المدينة المنوّرة',

  -- إعدادات الضريبة
  apply_vat         BOOLEAN DEFAULT FALSE,  -- هل نطبّق VAT؟
  vat_rate          NUMERIC(5,2) DEFAULT 15.00,  -- النسبة (15% في السعودية)
  prices_include_vat BOOLEAN DEFAULT TRUE,  -- الأسعار شاملة الضريبة؟

  -- إعدادات الفاتورة
  invoice_prefix    TEXT DEFAULT 'INV',   -- بادئة رقم الفاتورة
  invoice_counter   INTEGER DEFAULT 1,     -- عدّاد

  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- أضيفي سجل افتراضي (بدون VAT في البداية — تفعّلها لاحقاً)
INSERT INTO tax_settings (business_name_ar, apply_vat, vat_rate, prices_include_vat)
SELECT 'Be First Lady · صالون السيدة الأولى', FALSE, 15.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM tax_settings);

-- RLS: الكل يقرأ، الأدمن يعدّل
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read tax settings" ON tax_settings;
DROP POLICY IF EXISTS "Admin manage tax settings" ON tax_settings;

CREATE POLICY "Public read tax settings" ON tax_settings
  FOR SELECT TO anon, authenticated USING (TRUE);

CREATE POLICY "Admin manage tax settings" ON tax_settings
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- أضف حقول للفاتورة
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS invoice_issued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vat_rate_applied NUMERIC(5,2);
-- ═══════════════════════════════════════════════════════════
-- 009 — بطاقات هدية + إحالة + مخزون + رواتب
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- 1) بطاقات الهدية (Gift Cards) — رصيد مُسبق
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gift_cards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT UNIQUE NOT NULL,       -- GC-XXXXXX (توليد تلقائي)
  initial_amount  NUMERIC(10,2) NOT NULL CHECK (initial_amount > 0),
  balance         NUMERIC(10,2) NOT NULL,
  purchaser_name  TEXT NOT NULL,
  purchaser_phone TEXT NOT NULL,
  recipient_name  TEXT,
  recipient_phone TEXT,
  message         TEXT,
  design          TEXT DEFAULT 'gold',         -- gold/pink/floral
  expires_at      TIMESTAMPTZ,                 -- NULL = ما ينتهي
  is_active       BOOLEAN DEFAULT TRUE,
  activated_at    TIMESTAMPTZ DEFAULT NOW(),   -- متى اشترت
  sent_at         TIMESTAMPTZ,                 -- متى أُرسلت للمستلمة
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);

CREATE TABLE IF NOT EXISTS gift_card_redemptions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_card_id   UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  booking_id     UUID REFERENCES bookings(id) ON DELETE SET NULL,
  amount         NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  balance_after  NUMERIC(10,2) NOT NULL,
  used_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_redemptions_card ON gift_card_redemptions(gift_card_id);

-- دالة توليد كود بطاقة فريد
CREATE OR REPLACE FUNCTION generate_gift_card_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  tries INT := 0;
BEGIN
  LOOP
    code := 'GC-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8));
    IF NOT EXISTS (SELECT 1 FROM gift_cards WHERE code = code) THEN
      RETURN code;
    END IF;
    tries := tries + 1;
    IF tries > 10 THEN
      RAISE EXCEPTION 'Could not generate unique code';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────
-- 2) الإحالة (Referral)
-- ─────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_credit NUMERIC(10,2) DEFAULT 0;

-- توليد كود إحالة تلقائي عند التسجيل
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTR(MD5(NEW.id::TEXT), 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_referral_code ON profiles;
CREATE TRIGGER trg_referral_code
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION generate_referral_code();

-- حدّث الموجودين
UPDATE profiles SET referral_code = UPPER(SUBSTR(MD5(id::TEXT), 1, 6)) WHERE referral_code IS NULL;

-- ─────────────────────────────────────────────────────────
-- 3) المخزون (Inventory)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar         TEXT NOT NULL,
  name_en         TEXT,
  sku             TEXT UNIQUE,
  category        TEXT,                        -- shampoo, cream, etc
  unit            TEXT DEFAULT 'قطعة',
  cost_price      NUMERIC(10,2) DEFAULT 0,     -- سعر الشراء
  sell_price      NUMERIC(10,2) DEFAULT 0,     -- سعر البيع
  stock_qty       INTEGER DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 5,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_active ON inventory_items(is_active);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id       UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'adjustment', 'return')),
  qty           INTEGER NOT NULL,              -- موجب للدخول، سالب للخروج
  balance_after INTEGER NOT NULL,
  reason        TEXT,
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- 4) الرواتب (محسوبة من الحضور)
-- ─────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2),      -- ر.س / ساعة
  ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC(10,2);    -- أو راتب شهري ثابت

-- جدول الرواتب (snapshots شهرية)
CREATE TABLE IF NOT EXISTS payroll_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_month    INTEGER NOT NULL,            -- 1-12
  period_year     INTEGER NOT NULL,
  total_hours     NUMERIC(10,2) NOT NULL DEFAULT 0,
  hourly_rate     NUMERIC(10,2),
  base_amount     NUMERIC(10,2) NOT NULL,       -- الراتب الأساسي
  bonuses         NUMERIC(10,2) DEFAULT 0,      -- مكافآت
  deductions      NUMERIC(10,2) DEFAULT 0,      -- خصومات
  net_amount      NUMERIC(10,2) NOT NULL,       -- الصافي
  paid_at         TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_month, period_year)
);

-- ─────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────
ALTER TABLE gift_cards              ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_redemptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records         ENABLE ROW LEVEL SECURITY;

-- Gift cards: الأدمن يُدير، أي شخص يتحقق من كود
CREATE POLICY "Admin manages gift cards" ON gift_cards FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Anyone can check gift card by code" ON gift_cards FOR SELECT TO anon, authenticated USING (TRUE);

CREATE POLICY "Admin manages redemptions" ON gift_card_redemptions FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Inventory: الأدمن فقط
CREATE POLICY "Admin manages inventory" ON inventory_items FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin manages inventory movements" ON inventory_movements FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Payroll: الموظفة تشوف راتبها، الأدمن يُدير
CREATE POLICY "User views own payroll" ON payroll_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin manages payroll" ON payroll_records FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
-- ═══════════════════════════════════════════════════════════
-- 010 · Mobile App Support (Device Tokens for Push)
-- ═══════════════════════════════════════════════════════════

-- جدول رموز الأجهزة لإرسال الـ Push Notifications
CREATE TABLE IF NOT EXISTS device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name text,
  app_version text,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_platform ON device_tokens(platform);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- العميلة تدير أجهزتها فقط
CREATE POLICY "users_own_devices" ON device_tokens
  FOR ALL USING (auth.uid() = user_id);

-- المالكة/المديرة تقدر تشوف الكل (للإرسال الجماعي)
CREATE POLICY "admin_sees_all_devices" ON device_tokens
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
            AND role IN ('owner', 'manager'))
  );

-- ─── جدول سجل الإشعارات (للتتبّع) ───────────────────────
CREATE TABLE IF NOT EXISTS push_notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  platform text,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'opened')),
  error text,
  sent_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_log_user ON push_notifications_log(user_id);
CREATE INDEX IF NOT EXISTS idx_push_log_sent ON push_notifications_log(sent_at DESC);

ALTER TABLE push_notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_sees_push_log" ON push_notifications_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
            AND role IN ('owner', 'manager'))
  );

CREATE POLICY "users_see_own_push_log" ON push_notifications_log
  FOR SELECT USING (auth.uid() = user_id);
-- ═══════════════════════════════════════════════════════════
-- OTP Codes · جدول رموز التحقّق للـلتسجيل بالجوال
-- ═══════════════════════════════════════════════════════════

create table if not exists public.otp_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  attempts smallint not null default 0,
  verified boolean not null default false,
  purpose text not null default 'login',   -- login | signup | reset
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create index if not exists idx_otp_phone on public.otp_codes(phone);
create index if not exists idx_otp_expires on public.otp_codes(expires_at);
create index if not exists idx_otp_phone_active on public.otp_codes(phone, verified, expires_at);

-- Rate limiting: ما يقدر يطلب كود أكثر من 5 في 10 دقائق
comment on table public.otp_codes is 'OTP codes for phone verification · auto-expires in 10 min';

-- RLS: لا أحد يقرأ هذا الجدول من الـclient (كل التحقق في الـserver)
alter table public.otp_codes enable row level security;

-- فقط service_role يقدر يكتب/يقرا
create policy "service_role_only" on public.otp_codes
  for all using (auth.role() = 'service_role');

-- دالة تنظيف تلقائي للرموز المنتهية (كل ساعة)
create or replace function cleanup_expired_otps()
returns void as $$
begin
  delete from public.otp_codes
  where expires_at < now() - interval '1 hour';
end;
$$ language plpgsql security definer;

-- لتفعيل التنظيف التلقائي: شغّلي هذا في Supabase (pg_cron):
-- select cron.schedule('cleanup-otps', '0 * * * *', $$select cleanup_expired_otps()$$);
-- ═══════════════════════════════════════════════════════════
-- Customer Experience Pack · ترقية تجربة العميلة
-- ═══════════════════════════════════════════════════════════
-- 1. المفضّلات (customer_favorites)
-- 2. تاريخ الميلاد في profiles (لكوبون عيد الميلاد)
-- 3. حقل الصور في reviews
-- ═══════════════════════════════════════════════════════════

-- ─── 1) جدول المفضّلات ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.customer_favorites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id  UUID REFERENCES services(id) ON DELETE CASCADE,
  staff_id    UUID REFERENCES staff(id)    ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- تأكّد إنه خدمة أو موظفة (مش الاثنين فاضيين)
  CHECK (service_id IS NOT NULL OR staff_id IS NOT NULL),
  -- ما تضيف المفضّلة مرتين
  UNIQUE (customer_id, service_id),
  UNIQUE (customer_id, staff_id)
);

CREATE INDEX IF NOT EXISTS idx_fav_customer ON customer_favorites(customer_id);
CREATE INDEX IF NOT EXISTS idx_fav_service ON customer_favorites(service_id);

-- RLS: العميلة تشوف وتعدّل مفضّلتها فقط
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_favorites_select" ON customer_favorites
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "own_favorites_insert" ON customer_favorites
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "own_favorites_delete" ON customer_favorites
  FOR DELETE USING (customer_id = auth.uid());


-- ─── 2) تاريخ الميلاد لكوبون عيد الميلاد ─────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS birthday_coupon_sent_year SMALLINT;

COMMENT ON COLUMN profiles.date_of_birth IS 'تاريخ ميلاد العميلة (اختياري) · لكوبون عيد الميلاد';
COMMENT ON COLUMN profiles.birthday_coupon_sent_year IS 'آخر سنة تم إرسال كوبون عيد الميلاد فيها · لمنع التكرار';


-- ─── 3) الصور في التقييمات ───────────────────────────────
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT ARRAY[]::TEXT[];

COMMENT ON COLUMN reviews.image_urls IS 'مصفوفة روابط الصور (قبل/بعد) · حد أقصى 4 صور';


-- ─── 4) دالة توليد كوبون عيد الميلاد ─────────────────────
CREATE OR REPLACE FUNCTION generate_birthday_coupon(p_customer_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_customer RECORD;
BEGIN
  SELECT * INTO v_customer FROM profiles WHERE id = p_customer_id;
  IF NOT FOUND THEN RETURN NULL; END IF;

  -- كود الكوبون: HBD-{أول 4 أحرف من الاسم بالإنجليزي أو عشوائي}-{السنة}
  v_code := 'HBD-' || UPPER(SUBSTR(MD5(p_customer_id::TEXT || NOW()::TEXT), 1, 6)) || '-' || EXTRACT(YEAR FROM NOW());

  -- أضيفي الكوبون (خصم 20% ساري 30 يوم)
  INSERT INTO coupons (code, discount_type, discount_value, max_uses, valid_from, valid_until, is_active, notes)
  VALUES (
    v_code,
    'percentage',
    20,
    1,
    NOW(),
    NOW() + INTERVAL '30 days',
    true,
    'كوبون عيد الميلاد لـ ' || COALESCE(v_customer.full_name, 'عميلة')
  )
  ON CONFLICT (code) DO NOTHING;

  -- علامة إنه الكوبون أرسل هالسنة (ما يتكرر)
  UPDATE profiles
  SET birthday_coupon_sent_year = EXTRACT(YEAR FROM NOW())
  WHERE id = p_customer_id;

  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 5) View لآخر حجز لكل عميلة (للـ"كرّري آخر حجز") ────
CREATE OR REPLACE VIEW v_last_booking_per_customer AS
SELECT DISTINCT ON (customer_id)
  customer_id,
  id AS last_booking_id,
  booking_number,
  booking_date,
  booking_time,
  staff_id,
  total
FROM bookings
WHERE customer_id IS NOT NULL
  AND status IN ('confirmed', 'completed')
ORDER BY customer_id, booking_date DESC, booking_time DESC;


-- ═══════════════════════════════════════════════════════════
-- تحقّق · شوفي إنه كل شي اتضاف
-- ═══════════════════════════════════════════════════════════
SELECT
  'customer_favorites' AS "الجدول",
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_favorites') AS "موجود"
UNION ALL SELECT
  'profiles.date_of_birth',
  EXISTS(SELECT 1 FROM information_schema.columns
         WHERE table_name = 'profiles' AND column_name = 'date_of_birth')
UNION ALL SELECT
  'reviews.image_urls',
  EXISTS(SELECT 1 FROM information_schema.columns
         WHERE table_name = 'reviews' AND column_name = 'image_urls')
UNION ALL SELECT
  'generate_birthday_coupon()',
  EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'generate_birthday_coupon')
UNION ALL SELECT
  'v_last_booking_per_customer',
  EXISTS(SELECT 1 FROM information_schema.views WHERE table_name = 'v_last_booking_per_customer');
-- ═══════════════════════════════════════════════════════════
-- v3.3 · نظام المصروفات + ملاحظات العميلة
-- ═══════════════════════════════════════════════════════════

-- ─── 1) جدول المصروفات ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  category      TEXT NOT NULL CHECK (category IN (
    'rent', 'salaries', 'supplies', 'utilities',
    'marketing', 'maintenance', 'equipment', 'other'
  )),
  amount        NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  description   TEXT NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'mada', 'other')),
  receipt_url   TEXT,                     -- رابط صورة إيصال
  notes         TEXT,
  recorded_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- RLS: فقط owner/manager
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage expenses" ON expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );


-- ─── 2) ملاحظات العميلة (للموظفات فقط) ────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS staff_notes TEXT;

COMMENT ON COLUMN profiles.staff_notes IS
  'ملاحظات داخلية للموظفات عن العميلة (تفضيلات · حساسيّات · إلخ). ما تظهر للعميلة.';


-- ─── 3) View ملخّص المصروفات الشهري ──────────────────────
CREATE OR REPLACE VIEW v_expenses_monthly AS
SELECT
  DATE_TRUNC('month', date)::DATE AS month,
  category,
  COUNT(*) AS entries_count,
  SUM(amount) AS total
FROM expenses
GROUP BY DATE_TRUNC('month', date), category;


-- ─── 4) تحقّق ─────────────────────────────────────────────
SELECT
  'expenses table' AS "الجدول",
  EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'expenses') AS "موجود"
UNION ALL SELECT
  'profiles.staff_notes',
  EXISTS(SELECT 1 FROM information_schema.columns
         WHERE table_name = 'profiles' AND column_name = 'staff_notes')
UNION ALL SELECT
  'v_expenses_monthly view',
  EXISTS(SELECT 1 FROM information_schema.views WHERE table_name = 'v_expenses_monthly');
-- ═══════════════════════════════════════════════════════════
-- 🛡️ Security Hardening — Rate Limiting + Audit Log
-- ═══════════════════════════════════════════════════════════

-- ─── 1. Rate Limiting Table ───────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,                    -- IP · phone · user_id
  category TEXT NOT NULL,               -- 'otp' · 'login' · 'forgot-password'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index على key + category + created_at للبحث السريع
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON rate_limits (key, category, created_at DESC);

-- RLS: فقط service_role يقدر يقرأ/يكتب (مش anon)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- حذف القديم (أكثر من 24 ساعة) تلقائياً · شغلّوه عن طريق cron أو trigger
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE created_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 2. Audit Log Table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,                 -- 'login' · 'gift_card.issue' · 'booking.delete' · إلخ
  resource_type TEXT,                   -- 'booking' · 'gift_card' · 'customer' · 'expense'
  resource_id TEXT,
  metadata JSONB,                       -- تفاصيل إضافيّة (قيم قديمة/جديدة)
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);

-- RLS: فقط owner يقرا · service_role يكتب
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_owner_read" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'owner'
    )
  );


-- ─── 3. Login Attempts (tracking failed logins) ──────────
CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGSERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,             -- phone/email
  ip_address TEXT,
  success BOOLEAN NOT NULL,
  error_type TEXT,                      -- 'wrong_password' · 'wrong_otp' · 'rate_limited'
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier
  ON login_attempts (identifier, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip
  ON login_attempts (ip_address, created_at DESC);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "login_attempts_owner_read" ON login_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'owner'
    )
  );


-- ─── 4. Session Activity (idle timeout tracking) ─────────
CREATE TABLE IF NOT EXISTS session_activity (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE session_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_activity_self" ON session_activity
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
-- ═══════════════════════════════════════════════════════════
-- 💅 ملف الجمال وتاريخ الزيارات
-- ═══════════════════════════════════════════════════════════

-- ─── Beauty Profile · حقول في profiles ───
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS beauty_profile JSONB DEFAULT '{}'::jsonb;

-- الحقول المتوقّعة داخل beauty_profile:
-- {
--   skin_type: 'normal'|'dry'|'oily'|'combo'|'sensitive',
--   hair_type: 'straight'|'wavy'|'curly'|'coily',
--   hair_treated: boolean,
--   allergies: string[],
--   medical_notes: string,         -- خاص · ما يُشارَك
--   pregnancy_status: 'none'|'pregnant'|'nursing',
--   favorite_fragrances: string[],
--   skin_concerns: string[],       -- acne, pigmentation, aging, ...
-- }

COMMENT ON COLUMN profiles.beauty_profile IS
  'ملف الجمال · نوع البشرة والشعر والحساسيّات · تطّلع عليه الموظفة قبل الجلسة';


-- ─── Visit Photos · صور قبل/بعد لكل زيارة ───
CREATE TABLE IF NOT EXISTS visit_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after', 'reference')),
  photo_url TEXT NOT NULL,
  caption TEXT,
  is_shareable BOOLEAN DEFAULT false,       -- هل سمحت العميلة بالمشاركة؟
  uploaded_by UUID REFERENCES auth.users(id),  -- من رفع الصورة (العميلة/الموظفة)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visit_photos_booking
  ON visit_photos (booking_id);
CREATE INDEX IF NOT EXISTS idx_visit_photos_customer_date
  ON visit_photos (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visit_photos_shareable
  ON visit_photos (is_shareable, photo_type)
  WHERE is_shareable = true;

-- RLS: العميلة ترى صورها فقط · الإدارة ترى الكل
ALTER TABLE visit_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visit_photos_own" ON visit_photos
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "visit_photos_admin" ON visit_photos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager','staff'))
  );


-- ─── Supabase Storage bucket for visit photos ───
-- يُنشَأ يدوياً في Supabase Dashboard · اسم الـbucket: 'visit-photos'
-- Policies:
--   - Insert: authenticated users (الإدارة)
--   - Select: policy based on visit_photos.customer_id
--   - 10MB max size · images only

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visit-photos', 'visit-photos', false, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
-- ═══════════════════════════════════════════════════════════
-- 💜 تفضيلات العميلة · الموظّفة المفضّلة
-- ═══════════════════════════════════════════════════════════

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS preferred_staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS preferences_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_preferred_staff
  ON profiles (preferred_staff_id)
  WHERE preferred_staff_id IS NOT NULL;

COMMENT ON COLUMN profiles.preferred_staff_id IS 'الموظّفة المفضّلة · تظهر أولاً في اختيار الموظّفة عند الحجز';
COMMENT ON COLUMN profiles.preferences_notes IS 'ملاحظات العميلة عن تفضيلاتها (نوع الموسيقى · درجة الحرارة · إلخ)';
-- ═══════════════════════════════════════════════════════════
-- 📧 Gift Cards · إضافة حقل الإيميل للمستلمة
-- ═══════════════════════════════════════════════════════════
-- يُسمح للمالكة بإرسال البطاقة عبر الإيميل كبديل للواتساب

ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS recipient_email TEXT;

-- Index للبحث السريع عن البطاقات المُرسَلة لإيميل محدّد
CREATE INDEX IF NOT EXISTS idx_gift_cards_recipient_email
  ON gift_cards (recipient_email)
  WHERE recipient_email IS NOT NULL;

COMMENT ON COLUMN gift_cards.recipient_email IS 'إيميل المستلمة · لإرسال البطاقة عبر الإيميل كبديل للواتساب';
-- ═══════════════════════════════════════════════════════════
-- 💳 Payments · payment_intents + payment settings
-- ═══════════════════════════════════════════════════════════

-- جدول payment_intents · كل محاولة دفع (ناجحة أو فاشلة)
CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- المبالغ
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',

  -- البوّابة
  gateway TEXT NOT NULL CHECK (gateway IN ('moyasar','tabby','tamara','manual_cash')),
  method TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','authorized','paid','failed','refunded','partially_refunded','cancelled')),

  -- IDs من البوّابة
  gateway_payment_id TEXT,
  gateway_invoice_id TEXT,
  checkout_url TEXT,

  -- خصومات
  loyalty_points_used INTEGER DEFAULT 0,
  loyalty_points_discount NUMERIC(10,2) DEFAULT 0,
  gift_card_code TEXT,
  gift_card_amount NUMERIC(10,2) DEFAULT 0,

  -- عربون
  deposit_only BOOLEAN DEFAULT false,
  deposit_percentage INTEGER DEFAULT 100,

  -- التفاصيل الكاملة
  gateway_response JSONB,
  failure_reason TEXT,

  -- التواريخ
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 hour')
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_booking ON payment_intents (booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_customer ON payment_intents (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_intents_gateway_payment ON payment_intents (gateway, gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents (status, created_at DESC);

-- RLS
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_intents_own" ON payment_intents
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "payment_intents_admin" ON payment_intents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager'))
  );


-- ─── payment settings في company_settings (لو مش موجودة) ───
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_settings') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='company_settings' AND column_name='payment_deposit_pct') THEN
      ALTER TABLE company_settings
        ADD COLUMN payment_deposit_pct INTEGER DEFAULT 25,
        ADD COLUMN payment_deposit_threshold NUMERIC(10,2) DEFAULT 500,
        ADD COLUMN loyalty_point_value NUMERIC(10,4) DEFAULT 0.10;
      -- 1 نقطة = 0.10 ر.س · 100 نقطة = 10 ر.س
    END IF;
  END IF;
END $$;


-- ─── bookings · إضافة حقل payment_intent_id ───
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS active_payment_intent_id UUID REFERENCES payment_intents(id);


-- ─── Function · تحديث حالة الحجز عند نجاح الدفع ───
CREATE OR REPLACE FUNCTION on_payment_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- تحديث حالة الحجز
    IF NEW.booking_id IS NOT NULL THEN
      UPDATE bookings
      SET
        payment_status = CASE
          WHEN NEW.deposit_only THEN 'deposit_paid'
          ELSE 'paid'
        END,
        status = CASE
          WHEN status = 'pending' THEN 'confirmed'
          ELSE status
        END
      WHERE id = NEW.booking_id;
    END IF;

    -- تحديث paid_at لو ما تحدّث
    IF NEW.paid_at IS NULL THEN
      NEW.paid_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_payment_paid ON payment_intents;
CREATE TRIGGER trg_on_payment_paid
  BEFORE UPDATE ON payment_intents
  FOR EACH ROW EXECUTE FUNCTION on_payment_paid();
-- ═══════════════════════════════════════════════════════════
-- 🔔 Reminders · تتبّع تذكيرات الحجز
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS booking_reminders (
  id BIGSERIAL PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '1h', 'birthday', 'followup')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  message_id TEXT,                      -- WhatsApp message id
  channel TEXT DEFAULT 'whatsapp',
  UNIQUE (booking_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_booking_reminders_booking
  ON booking_reminders (booking_id);

ALTER TABLE booking_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking_reminders_admin" ON booking_reminders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager'))
  );


-- ─── عمود review_request_sent_at ───
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS review_request_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bookings_review_pending
  ON bookings (updated_at, status)
  WHERE status = 'completed' AND review_request_sent_at IS NULL;
-- ═══════════════════════════════════════════════════════════
-- Newsletter subscribers
-- تاريخ: 2026-11-03
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT UNIQUE NOT NULL,
  source           TEXT DEFAULT 'footer',            -- footer · booking · landing
  is_active        BOOLEAN DEFAULT TRUE,
  subscribed_at    TIMESTAMPTZ DEFAULT NOW(),
  resubscribed_at  TIMESTAMPTZ,
  unsubscribed_at  TIMESTAMPTZ,
  tags             TEXT[],
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(is_active) WHERE is_active = TRUE;

-- RLS: only admin/service_role can read; public can insert (upsert handled by API)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Owner/manager can see all
CREATE POLICY "owners_read_newsletter"
  ON newsletter_subscribers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

NOTIFY pgrst, 'reload schema';
-- ═══════════════════════════════════════════════════════════
-- 🔔 Web Push Subscriptions
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,          -- the push endpoint URL
  p256dh TEXT NOT NULL,                   -- subscription keys
  auth TEXT NOT NULL,                     -- subscription keys
  user_agent TEXT,
  device_label TEXT,                      -- "iPhone 15" · "Chrome Desktop"
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON push_subscriptions (endpoint);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subs_self" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subs_admin" ON push_subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'manager'))
  );
-- ═══════════════════════════════════════════════════════════
-- Staff Requests System
-- تاريخ: 2026-11-04
-- ═══════════════════════════════════════════════════════════
-- يضيف:
--   1. permission_requests  — إذن انصراف مبكّر / تأخّر
--   2. shift_swap_requests  — تبديل دوام بين موظّفتين
--
-- ملاحظة: الإجازات (leave_requests) موجودة بالفعل في migration 005

-- ═══════════════════════════════════════════════════════════
-- 1. إذن انصراف مبكّر أو تأخّر
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS permission_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type    TEXT NOT NULL CHECK (request_type IN ('early_leave', 'late_arrival', 'short_break')),
  request_date    DATE NOT NULL,              -- التاريخ المطلوب له الإذن
  requested_time  TIME NOT NULL,              -- الوقت الفعلي (انصراف/وصول)
  duration_min    INTEGER,                    -- للاستراحة القصيرة فقط
  reason          TEXT NOT NULL,              -- السبب (مطلوب)
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  review_note     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permission_user ON permission_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_status ON permission_requests(status);
CREATE INDEX IF NOT EXISTS idx_permission_date ON permission_requests(request_date);

-- RLS
ALTER TABLE permission_requests ENABLE ROW LEVEL SECURITY;

-- الموظّفة تقرأ/تضيف طلباتها فقط
CREATE POLICY "staff_read_own_permissions"
  ON permission_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "staff_insert_own_permissions"
  ON permission_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "staff_update_own_pending"
  ON permission_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- المالكة/المديرة تقرأ الكل
CREATE POLICY "managers_read_all_permissions"
  ON permission_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

-- المالكة/المديرة تحدّث الحالة
CREATE POLICY "managers_update_permissions"
  ON permission_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

-- ═══════════════════════════════════════════════════════════
-- 2. طلبات تبديل الدوام
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS shift_swap_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- الطالبة (اللي تبي تبدّل)
  requester_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requester_date    DATE NOT NULL,              -- اليوم اللي الطالبة تبي تعطيه

  -- المستقبِلة (اللي ترغب تستبدل معها)
  recipient_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_date    DATE,                       -- اليوم اللي راح تاخذه (اختياري)

  reason            TEXT NOT NULL,

  -- حالة التبديل:
  --   pending         — جديد · ينتظر موافقة الزميلة + الإدارة
  --   colleague_ok    — الزميلة وافقت · ينتظر الإدارة
  --   colleague_no    — الزميلة رفضت
  --   approved        — الإدارة وافقت
  --   rejected        — الإدارة رفضت
  --   cancelled       — ملغي من الطالبة
  status            TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'colleague_ok', 'colleague_no',
    'approved', 'rejected', 'cancelled'
  )),

  colleague_responded_at  TIMESTAMPTZ,
  colleague_note          TEXT,
  reviewed_by             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at             TIMESTAMPTZ,
  review_note             TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_swap_requester ON shift_swap_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_swap_recipient ON shift_swap_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_swap_status ON shift_swap_requests(status);

-- RLS
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;

-- الطالبة والمستقبِلة تقرأ ما يخصّها
CREATE POLICY "parties_read_own_swap"
  ON shift_swap_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "requester_insert_swap"
  ON shift_swap_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- الطالبة تقدر تلغي · المستقبِلة تقدر توافق/ترفض
CREATE POLICY "parties_update_swap"
  ON shift_swap_requests FOR UPDATE
  USING (
    (auth.uid() = requester_id AND status IN ('pending', 'colleague_ok'))
    OR
    (auth.uid() = recipient_id AND status = 'pending')
  );

-- المالكة/المديرة تقرأ الكل وتُعدّل
CREATE POLICY "managers_read_all_swaps"
  ON shift_swap_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "managers_update_swaps"
  ON shift_swap_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

-- ═══════════════════════════════════════════════════════════
-- 3. View موحّد لكل طلبات الموظّفة (لتسهيل قراءة التطبيق)
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW staff_all_requests AS
  SELECT
    id,
    user_id,
    'leave'::TEXT AS request_kind,
    leave_type AS sub_type,
    start_date AS from_date,
    end_date AS to_date,
    NULL::TIME AS at_time,
    reason,
    status,
    reviewed_by,
    reviewed_at,
    review_note,
    created_at
  FROM leave_requests

  UNION ALL

  SELECT
    id,
    user_id,
    'permission'::TEXT AS request_kind,
    request_type AS sub_type,
    request_date AS from_date,
    request_date AS to_date,
    requested_time AS at_time,
    reason,
    status,
    reviewed_by,
    reviewed_at,
    review_note,
    created_at
  FROM permission_requests

  UNION ALL

  SELECT
    id,
    requester_id AS user_id,
    'swap'::TEXT AS request_kind,
    'swap'::TEXT AS sub_type,
    requester_date AS from_date,
    recipient_date AS to_date,
    NULL::TIME AS at_time,
    reason,
    status,
    reviewed_by,
    reviewed_at,
    review_note,
    created_at
  FROM shift_swap_requests;

NOTIFY pgrst, 'reload schema';
