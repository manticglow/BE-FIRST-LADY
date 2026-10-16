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
