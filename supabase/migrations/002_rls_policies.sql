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
