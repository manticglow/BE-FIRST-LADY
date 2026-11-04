-- ═══════════════════════════════════════════════════════════
-- Monitoring & Resilience
-- تاريخ: 2026-11-05
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- 1. api_errors — سجلّ أخطاء APIs
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_errors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path          TEXT NOT NULL,
  method        TEXT NOT NULL,
  message       TEXT NOT NULL,
  stack         TEXT,
  duration_ms   INTEGER,
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ip_address    INET,
  user_agent    TEXT,
  resolved      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_errors_path ON api_errors(path);
CREATE INDEX IF NOT EXISTS idx_errors_created ON api_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_errors_unresolved ON api_errors(resolved) WHERE resolved = FALSE;

ALTER TABLE api_errors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners_read_errors" ON api_errors;
CREATE POLICY "owners_read_errors"
  ON api_errors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

DROP POLICY IF EXISTS "owners_update_errors" ON api_errors;
CREATE POLICY "owners_update_errors"
  ON api_errors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'owner'
    )
  );

-- حذف تلقائي لأخطاء أقدم من 30 يوم (يُنفّذ يدوياً أو من cron)
-- DELETE FROM api_errors WHERE created_at < NOW() - INTERVAL '30 days';

-- ───────────────────────────────────────────────────────────
-- 2. api_request_log — سجلّ موجز للطلبات (اختياري · للتحليل)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_request_log (
  id            BIGSERIAL PRIMARY KEY,
  path          TEXT NOT NULL,
  method        TEXT NOT NULL,
  status_code   INTEGER NOT NULL,
  duration_ms   INTEGER,
  user_id       UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_req_log_created ON api_request_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_req_log_path ON api_request_log(path);

ALTER TABLE api_request_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners_read_req_log" ON api_request_log;
CREATE POLICY "owners_read_req_log"
  ON api_request_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

NOTIFY pgrst, 'reload schema';
