-- ═══════════════════════════════════════════════════════════
-- 📱 whatsapp_log · سجلّ رسائل الواتساب (Test Mode + حقيقي)
-- شغّليه في: Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS whatsapp_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  template_code TEXT,           -- booking_confirmation · otp_login · إلخ
  context JSONB,                -- {booking_id, customer_name, إلخ}
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','delivered','failed','test')),
  gateway_response JSONB,       -- رد Meta الكامل
  gateway_message_id TEXT,      -- wamid من Meta
  error_message TEXT,
  mode TEXT NOT NULL DEFAULT 'live'
    CHECK (mode IN ('live','test')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_log_phone ON whatsapp_log (phone, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_status ON whatsapp_log (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_log_mode ON whatsapp_log (mode, created_at DESC);

-- RLS: فقط الأدمنات يشوفون
ALTER TABLE whatsapp_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "whatsapp_log_admin" ON whatsapp_log;
CREATE POLICY "whatsapp_log_admin" ON whatsapp_log
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager'))
  );

SELECT '✅ whatsapp_log جاهز' AS result;
