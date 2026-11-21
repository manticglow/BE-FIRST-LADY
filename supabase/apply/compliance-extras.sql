-- ═══════════════════════════════════════════════════════════════════════
-- 📋 Compliance Extras · حقول + جداول تقرير الامتثال
-- ═══════════════════════════════════════════════════════════════════════
-- يُضيف ما يحتاجه /admin/compliance:
--   - أعمدة DPO + معروف على tax_settings
--   - جدول deletion_log لتتبّع حذف الحسابات (PDPL Art.4)
--
-- idempotent · آمن للتشغيل مرّات متعدّدة
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. حقول إضافيّة على tax_settings
ALTER TABLE tax_settings
  ADD COLUMN IF NOT EXISTS dpo_name  TEXT,
  ADD COLUMN IF NOT EXISTS dpo_email TEXT,
  ADD COLUMN IF NOT EXISTS maroof_id TEXT;

COMMENT ON COLUMN tax_settings.dpo_name  IS 'اسم مسؤول حماية البيانات · PDPL Art.32';
COMMENT ON COLUMN tax_settings.dpo_email IS 'إيميل DPO للتواصل';
COMMENT ON COLUMN tax_settings.maroof_id IS 'رقم التسجيل في منصّة معروف';

-- 2. جدول سجلّ حذف الحسابات (PDPL Art.4 · حقّ المحو)
CREATE TABLE IF NOT EXISTS deletion_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID,                       -- الهويّة الأصليّة قبل الحذف
  phone_hash    TEXT,                       -- هاش الجوّال (للمنع من إعادة التسجيل بسرعة)
  email_hash    TEXT,                       -- هاش البريد
  deleted_at    TIMESTAMPTZ DEFAULT NOW(),
  deleted_by    UUID,                       -- NULL إذا حذفت نفسها · UUID إذا أدمن
  reason        TEXT,                       -- اختياري · سبب الحذف
  retention_days INTEGER DEFAULT 180,       -- أيّام الاحتفاظ للدفاتر (قانون)
  purged_at     TIMESTAMPTZ                 -- متى حُذفت كلّ البيانات الفعليّة
);

CREATE INDEX IF NOT EXISTS idx_deletion_log_deleted_at ON deletion_log(deleted_at);

COMMENT ON TABLE deletion_log IS 'سجلّ حذف الحسابات · PDPL Article 4 · حقّ المحو';

-- 3. RLS · القراءة للأدمن فقط
ALTER TABLE deletion_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read deletion log" ON deletion_log;
CREATE POLICY "Admin can read deletion log" ON deletion_log
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'manager')
  ));

DROP POLICY IF EXISTS "System can insert deletion log" ON deletion_log;
CREATE POLICY "System can insert deletion log" ON deletion_log
  FOR INSERT TO authenticated
  WITH CHECK (TRUE);  -- يُسمح بالإدراج من أيّ مستخدم مسجّل (يحذف نفسه)

COMMIT;

-- ─────────────────────────────────────────────────────────────────────
-- ✅ تحقّق
-- ─────────────────────────────────────────────────────────────────────
SELECT
  'tax_settings · dpo_name'   AS "البند",
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tax_settings' AND column_name = 'dpo_name'
  ) THEN '✓ موجود' ELSE '✗ ناقص' END AS "الحالة"
UNION ALL
SELECT 'deletion_log',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'deletion_log'
  ) THEN '✓ موجود' ELSE '✗ ناقص' END;
