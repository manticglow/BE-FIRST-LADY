-- ═══════════════════════════════════════════════════════════
-- 🔔 Reminders · تتبّع تذكيرات الحجز
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS booking_reminders (
  id BIGSERIAL PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('24h', '1h', 'birthday', 'followup')),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  message_id TEXT,                      -- WhatsApp message id
  channel TEXT DEFAULT 'whatsapp',
  UNIQUE (booking_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_booking_reminders_booking
  ON booking_reminders (booking_id);

ALTER TABLE booking_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking_reminders_admin" ON booking_reminders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager'))
  );


-- ─── عمود review_request_sent_at ───
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS review_request_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_bookings_review_pending
  ON bookings (updated_at, status)
  WHERE status = 'completed' AND review_request_sent_at IS NULL;
