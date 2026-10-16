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
