-- ═══════════════════════════════════════════════════════════
-- 010 · Mobile App Support (Device Tokens for Push)
-- ═══════════════════════════════════════════════════════════

-- جدول رموز الأجهزة لإرسال الـ Push Notifications
CREATE TABLE IF NOT EXISTS device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  platform text NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name text,
  app_version text,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_platform ON device_tokens(platform);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- العميلة تدير أجهزتها فقط
CREATE POLICY "users_own_devices" ON device_tokens
  FOR ALL USING (auth.uid() = user_id);

-- المالكة/المديرة تقدر تشوف الكل (للإرسال الجماعي)
CREATE POLICY "admin_sees_all_devices" ON device_tokens
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
            AND role IN ('owner', 'manager'))
  );

-- ─── جدول سجل الإشعارات (للتتبّع) ───────────────────────
CREATE TABLE IF NOT EXISTS push_notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  platform text,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'opened')),
  error text,
  sent_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_log_user ON push_notifications_log(user_id);
CREATE INDEX IF NOT EXISTS idx_push_log_sent ON push_notifications_log(sent_at DESC);

ALTER TABLE push_notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_sees_push_log" ON push_notifications_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()
            AND role IN ('owner', 'manager'))
  );

CREATE POLICY "users_see_own_push_log" ON push_notifications_log
  FOR SELECT USING (auth.uid() = user_id);
