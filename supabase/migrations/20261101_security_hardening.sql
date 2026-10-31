-- ═══════════════════════════════════════════════════════════
-- 🛡️ Security Hardening — Rate Limiting + Audit Log
-- ═══════════════════════════════════════════════════════════

-- ─── 1. Rate Limiting Table ───────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGSERIAL PRIMARY KEY,
  key TEXT NOT NULL,                    -- IP · phone · user_id
  category TEXT NOT NULL,               -- 'otp' · 'login' · 'forgot-password'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index على key + category + created_at للبحث السريع
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
  ON rate_limits (key, category, created_at DESC);

-- RLS: فقط service_role يقدر يقرأ/يكتب (مش anon)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- حذف القديم (أكثر من 24 ساعة) تلقائياً · شغلّوه عن طريق cron أو trigger
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limits WHERE created_at < now() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── 2. Audit Log Table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,                 -- 'login' · 'gift_card.issue' · 'booking.delete' · إلخ
  resource_type TEXT,                   -- 'booking' · 'gift_card' · 'customer' · 'expense'
  resource_id TEXT,
  metadata JSONB,                       -- تفاصيل إضافيّة (قيم قديمة/جديدة)
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs (resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs (created_at DESC);

-- RLS: فقط owner يقرا · service_role يكتب
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_owner_read" ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'owner'
    )
  );


-- ─── 3. Login Attempts (tracking failed logins) ──────────
CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGSERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,             -- phone/email
  ip_address TEXT,
  success BOOLEAN NOT NULL,
  error_type TEXT,                      -- 'wrong_password' · 'wrong_otp' · 'rate_limited'
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier
  ON login_attempts (identifier, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip
  ON login_attempts (ip_address, created_at DESC);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "login_attempts_owner_read" ON login_attempts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'owner'
    )
  );


-- ─── 4. Session Activity (idle timeout tracking) ─────────
CREATE TABLE IF NOT EXISTS session_activity (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE session_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_activity_self" ON session_activity
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
