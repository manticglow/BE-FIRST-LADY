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
