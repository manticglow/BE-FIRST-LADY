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
