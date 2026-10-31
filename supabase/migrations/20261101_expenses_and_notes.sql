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
