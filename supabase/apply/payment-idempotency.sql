-- ═══════════════════════════════════════════════════════════
-- 🛡 Payment Idempotency + Invoice Sequence
-- ═══════════════════════════════════════════════════════════
-- يحمي من:
--   - خصم مزدوج للنقاط والبطاقات (webhook retries)
--   - أرقام فواتير متكرّرة

BEGIN;

-- 1. عمود idempotency على payment_intents
ALTER TABLE payment_intents
  ADD COLUMN IF NOT EXISTS discounts_applied_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_pi_status_idem
  ON payment_intents(id, status, discounts_applied_at);

-- 2. invoice_number تسلسلي على bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS invoice_issued_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_invoice_number
  ON bookings(invoice_number) WHERE invoice_number IS NOT NULL;

-- 3. دالة لحجز رقم فاتورة تسلسلي
CREATE OR REPLACE FUNCTION allocate_invoice_number(p_booking_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_existing TEXT;
  v_counter INTEGER;
  v_prefix TEXT;
  v_year TEXT;
  v_num TEXT;
BEGIN
  -- لو الحجز له رقم فاتورة · أعيديه
  SELECT invoice_number INTO v_existing FROM bookings WHERE id = p_booking_id;
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  -- اجلبي البادئة من tax_settings
  SELECT COALESCE(invoice_prefix, 'TFL') INTO v_prefix
  FROM tax_settings WHERE is_active = TRUE LIMIT 1;

  -- السنة
  v_year := TO_CHAR(NOW() AT TIME ZONE 'Asia/Riyadh', 'YYYY');

  -- حدّثي العدّاد ذريّاً
  UPDATE tax_settings
  SET invoice_counter = COALESCE(invoice_counter, 0) + 1
  WHERE is_active = TRUE
  RETURNING invoice_counter INTO v_counter;

  -- صيغة الرقم: TFL-2026-00001
  v_num := v_prefix || '-' || v_year || '-' || LPAD(v_counter::TEXT, 5, '0');

  -- احفظيه على الحجز
  UPDATE bookings
  SET invoice_number = v_num,
      invoice_issued_at = NOW()
  WHERE id = p_booking_id AND invoice_number IS NULL;

  RETURN v_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION allocate_invoice_number IS
  'يحجز رقم فاتورة تسلسلي للحجز (مرّة واحدة) · آمن ذريّاً';

-- 4. لو tax_settings ما فيه invoice_counter · أضيفيه
ALTER TABLE tax_settings
  ADD COLUMN IF NOT EXISTS invoice_counter INTEGER DEFAULT 0;

COMMIT;

-- ═══════════════════════════════════════════════════════════
-- ✅ تحقّق
-- ═══════════════════════════════════════════════════════════
SELECT
  'payment_intents.discounts_applied_at' AS feature,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_intents' AND column_name = 'discounts_applied_at'
  ) AS installed
UNION ALL
SELECT 'bookings.invoice_number',
  EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings' AND column_name = 'invoice_number')
UNION ALL
SELECT 'allocate_invoice_number()',
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'allocate_invoice_number');
