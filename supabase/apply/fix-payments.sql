-- ═══════════════════════════════════════════════════════════
-- 💳 FIX PAYMENTS · Safe migration for payment_intents
-- شغّليه في: Supabase → SQL Editor → New Query
-- آمن للتشغيل عدّة مرّات (idempotent)
-- ═══════════════════════════════════════════════════════════

-- 1️⃣ إنشاء الجدول (إذا مش موجود)
CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SAR',
  gateway TEXT NOT NULL CHECK (gateway IN ('moyasar','tabby','tamara','manual_cash')),
  method TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','authorized','paid','failed','refunded','partially_refunded','cancelled')),
  gateway_payment_id TEXT,
  gateway_invoice_id TEXT,
  checkout_url TEXT,
  loyalty_points_used INTEGER DEFAULT 0,
  loyalty_points_discount NUMERIC(10,2) DEFAULT 0,
  gift_card_code TEXT,
  gift_card_amount NUMERIC(10,2) DEFAULT 0,
  deposit_only BOOLEAN DEFAULT false,
  deposit_percentage INTEGER DEFAULT 100,
  gateway_response JSONB,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 hour')
);

-- 2️⃣ الفهارس
CREATE INDEX IF NOT EXISTS idx_payment_intents_booking ON payment_intents (booking_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_customer ON payment_intents (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_intents_gateway_payment ON payment_intents (gateway, gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_intents_status ON payment_intents (status, created_at DESC);

-- 3️⃣ RLS
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_intents_own" ON payment_intents;
CREATE POLICY "payment_intents_own" ON payment_intents
  FOR SELECT USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "payment_intents_admin" ON payment_intents;
CREATE POLICY "payment_intents_admin" ON payment_intents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager'))
  );

-- 4️⃣ أعمدة company_settings
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'company_settings') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='company_settings' AND column_name='payment_deposit_pct') THEN
      ALTER TABLE company_settings
        ADD COLUMN payment_deposit_pct INTEGER DEFAULT 25,
        ADD COLUMN payment_deposit_threshold NUMERIC(10,2) DEFAULT 500,
        ADD COLUMN loyalty_point_value NUMERIC(10,4) DEFAULT 0.10;
    END IF;
  END IF;
END $$;

-- 5️⃣ عمود active_payment_intent_id في bookings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='bookings' AND column_name='active_payment_intent_id') THEN
    ALTER TABLE bookings
      ADD COLUMN active_payment_intent_id UUID REFERENCES payment_intents(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- ✅ تم · شوفي الجدول:
-- SELECT * FROM payment_intents LIMIT 5;
-- ═══════════════════════════════════════════════════════════
