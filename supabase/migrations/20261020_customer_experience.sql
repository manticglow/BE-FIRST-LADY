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
