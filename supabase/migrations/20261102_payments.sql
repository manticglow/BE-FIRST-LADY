-- ═══════════════════════════════════════════════════════════
-- 💳 Payments · payment_intents + payment settings
-- ═══════════════════════════════════════════════════════════

-- جدول payment_intents · كل محاولة دفع (ناجحة أو فاشلة)
CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- المبالغ
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',

  -- البوّابة
  gateway TEXT NOT NULL CHECK (gateway IN ('moyasar','tabby','tamara','manual_cash')),
  method TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','authorized','paid','failed','refunded','partially_refunded','cancelled')),

  -- IDs من البوّابة
  gateway_payment_id TEXT,
  gateway_invoice_id TEXT,
  checkout_url TEXT,

  -- خصومات
  loyalty_points_used INTEGER DEFAULT 0,
  loyalty_points_discount NUMERIC(10,2) DEFAULT 0,
  gift_card_code TEXT,
  gift_card_amount NUMERIC(10,2) DEFAULT 0,

  -- عربون
  deposit_only BOOLEAN DEFAULT false,
  deposit_percentage INTEGER DEFAULT 100,

  -- التفاصيل الكاملة
  gateway_response JSONB,
  failure_reason TEXT,

  -- التواريخ
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 hour')
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_booking ON payment_intents (booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_customer ON payment_intents (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_intents_gateway_payment ON payment_intents (gateway, gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents (status, created_at DESC);

-- RLS
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_intents_own" ON payment_intents
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "payment_intents_admin" ON payment_intents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager'))
  );


-- ─── payment settings في company_settings (لو مش موجودة) ───
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_settings') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='company_settings' AND column_name='payment_deposit_pct') THEN
      ALTER TABLE company_settings
        ADD COLUMN payment_deposit_pct INTEGER DEFAULT 25,
        ADD COLUMN payment_deposit_threshold NUMERIC(10,2) DEFAULT 500,
        ADD COLUMN loyalty_point_value NUMERIC(10,4) DEFAULT 0.10;
      -- 1 نقطة = 0.10 ر.س · 100 نقطة = 10 ر.س
    END IF;
  END IF;
END $$;


-- ─── bookings · إضافة حقل payment_intent_id ───
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS active_payment_intent_id UUID REFERENCES payment_intents(id);


-- ─── Function · تحديث حالة الحجز عند نجاح الدفع ───
CREATE OR REPLACE FUNCTION on_payment_paid()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    -- تحديث حالة الحجز
    IF NEW.booking_id IS NOT NULL THEN
      UPDATE bookings
      SET
        payment_status = CASE
          WHEN NEW.deposit_only THEN 'deposit_paid'
          ELSE 'paid'
        END,
        status = CASE
          WHEN status = 'pending' THEN 'confirmed'
          ELSE status
        END
      WHERE id = NEW.booking_id;
    END IF;

    -- تحديث paid_at لو ما تحدّث
    IF NEW.paid_at IS NULL THEN
      NEW.paid_at := now();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_payment_paid ON payment_intents;
CREATE TRIGGER trg_on_payment_paid
  BEFORE UPDATE ON payment_intents
  FOR EACH ROW EXECUTE FUNCTION on_payment_paid();
