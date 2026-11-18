-- ═══════════════════════════════════════════════════════════════════════
-- 📋 Compliance Tables · PDPL + E-Commerce Law
-- ═══════════════════════════════════════════════════════════════════════
-- يضيف جداول متطلّبة للامتثال:
--   - complaints · الشكاوى (نظام التجارة الإلكترونيّة)
--   - data_access_requests · طلبات الوصول للبيانات (PDPL Article 4)
--   - breach_log · سجلّ الاختراقات للإبلاغ 72 ساعة (PDPL Article 24)
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. الشكاوى
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'service', 'staff', 'payment', 'booking',
    'privacy', 'suggestion', 'other'
  )),
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'acknowledged', 'investigating', 'resolved', 'rejected', 'escalated'
  )),
  responded_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  assigned_to UUID REFERENCES profiles(id),
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status, created_at);
CREATE INDEX IF NOT EXISTS idx_complaints_phone ON complaints(phone);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_only_complaints" ON complaints;
CREATE POLICY "service_only_complaints" ON complaints FOR ALL
  USING (auth.role() = 'service_role');

-- 2. طلبات الوصول للبيانات (حقّ العميلة بموجب PDPL)
CREATE TABLE IF NOT EXISTS data_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  phone TEXT,
  request_type TEXT NOT NULL CHECK (request_type IN (
    'access',       -- طلب نسخة من البيانات
    'correction',   -- طلب تصحيح
    'deletion',     -- طلب حذف (Article 17)
    'portability',  -- طلب نقل البيانات
    'withdraw_consent'  -- سحب الموافقة
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'rejected'
  )),
  notes TEXT,
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  -- حسب PDPL · 15 يوم للرد
  deadline_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dar_customer ON data_access_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_dar_status ON data_access_requests(status, deadline_at);

ALTER TABLE data_access_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_dar" ON data_access_requests;
CREATE POLICY "own_dar" ON data_access_requests FOR ALL
  USING (customer_id = auth.uid() OR auth.role() = 'service_role');

-- 3. سجلّ الاختراقات (للإبلاغ 72 ساعة · PDPL Article 24)
CREATE TABLE IF NOT EXISTS breach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reported_to_sdaia_at TIMESTAMPTZ,
  sdaia_reference TEXT,
  breach_type TEXT NOT NULL CHECK (breach_type IN (
    'unauthorized_access', 'data_loss', 'accidental_disclosure',
    'cyber_attack', 'other'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  affected_records INTEGER,
  data_types_affected TEXT[],
  description TEXT NOT NULL,
  mitigation_steps TEXT,
  customers_notified BOOLEAN DEFAULT FALSE,
  customers_notified_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE breach_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_only_breach" ON breach_log;
CREATE POLICY "owner_only_breach" ON breach_log FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
    OR auth.role() = 'service_role'
  );

-- Function: فحص الشكاوى المتأخّرة (أكثر من 24 ساعة بلا رد)
CREATE OR REPLACE FUNCTION overdue_complaints() RETURNS TABLE(
  reference TEXT, name TEXT, created_at TIMESTAMPTZ, hours_open NUMERIC
) AS $$
  SELECT
    reference, name, created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 AS hours_open
  FROM complaints
  WHERE status IN ('open', 'acknowledged')
    AND created_at < NOW() - INTERVAL '24 hours'
  ORDER BY created_at;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function: فحص اختراقات لم تُبلَّغ خلال 72 ساعة
CREATE OR REPLACE FUNCTION unreported_breaches() RETURNS TABLE(
  id UUID, breach_type TEXT, severity TEXT,
  discovered_at TIMESTAMPTZ, hours_since NUMERIC
) AS $$
  SELECT
    id, breach_type, severity, discovered_at,
    EXTRACT(EPOCH FROM (NOW() - discovered_at)) / 3600 AS hours_since
  FROM breach_log
  WHERE reported_to_sdaia_at IS NULL
    AND discovered_at < NOW() - INTERVAL '60 hours'  -- تنبيه قبل 72 بـ 12 ساعة
  ORDER BY discovered_at;
$$ LANGUAGE sql SECURITY DEFINER;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- ✅ Verification
-- ═══════════════════════════════════════════════════════════════════════
SELECT table_name,
  CASE WHEN rowsecurity THEN '✓ RLS' ELSE '✗ NO RLS' END AS status
FROM information_schema.tables t
JOIN pg_tables p ON p.tablename = t.table_name AND p.schemaname = t.table_schema
WHERE t.table_schema = 'public'
  AND t.table_name IN ('complaints', 'data_access_requests', 'breach_log');
