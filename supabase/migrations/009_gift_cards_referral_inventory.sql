-- ═══════════════════════════════════════════════════════════
-- 009 — بطاقات هدية + إحالة + مخزون + رواتب
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- 1) بطاقات الهدية (Gift Cards) — رصيد مُسبق
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gift_cards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            TEXT UNIQUE NOT NULL,       -- GC-XXXXXX (توليد تلقائي)
  initial_amount  NUMERIC(10,2) NOT NULL CHECK (initial_amount > 0),
  balance         NUMERIC(10,2) NOT NULL,
  purchaser_name  TEXT NOT NULL,
  purchaser_phone TEXT NOT NULL,
  recipient_name  TEXT,
  recipient_phone TEXT,
  message         TEXT,
  design          TEXT DEFAULT 'gold',         -- gold/pink/floral
  expires_at      TIMESTAMPTZ,                 -- NULL = ما ينتهي
  is_active       BOOLEAN DEFAULT TRUE,
  activated_at    TIMESTAMPTZ DEFAULT NOW(),   -- متى اشترت
  sent_at         TIMESTAMPTZ,                 -- متى أُرسلت للمستلمة
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON gift_cards(code);

CREATE TABLE IF NOT EXISTS gift_card_redemptions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gift_card_id   UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
  booking_id     UUID REFERENCES bookings(id) ON DELETE SET NULL,
  amount         NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  balance_after  NUMERIC(10,2) NOT NULL,
  used_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_redemptions_card ON gift_card_redemptions(gift_card_id);

-- دالة توليد كود بطاقة فريد
CREATE OR REPLACE FUNCTION generate_gift_card_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  tries INT := 0;
BEGIN
  LOOP
    code := 'GC-' || UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8));
    IF NOT EXISTS (SELECT 1 FROM gift_cards WHERE code = code) THEN
      RETURN code;
    END IF;
    tries := tries + 1;
    IF tries > 10 THEN
      RAISE EXCEPTION 'Could not generate unique code';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────
-- 2) الإحالة (Referral)
-- ─────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS referral_credit NUMERIC(10,2) DEFAULT 0;

-- توليد كود إحالة تلقائي عند التسجيل
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTR(MD5(NEW.id::TEXT), 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_referral_code ON profiles;
CREATE TRIGGER trg_referral_code
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION generate_referral_code();

-- حدّث الموجودين
UPDATE profiles SET referral_code = UPPER(SUBSTR(MD5(id::TEXT), 1, 6)) WHERE referral_code IS NULL;

-- ─────────────────────────────────────────────────────────
-- 3) المخزون (Inventory)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar         TEXT NOT NULL,
  name_en         TEXT,
  sku             TEXT UNIQUE,
  category        TEXT,                        -- shampoo, cream, etc
  unit            TEXT DEFAULT 'قطعة',
  cost_price      NUMERIC(10,2) DEFAULT 0,     -- سعر الشراء
  sell_price      NUMERIC(10,2) DEFAULT 0,     -- سعر البيع
  stock_qty       INTEGER DEFAULT 0,
  low_stock_alert INTEGER DEFAULT 5,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_active ON inventory_items(is_active);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id       UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'adjustment', 'return')),
  qty           INTEGER NOT NULL,              -- موجب للدخول، سالب للخروج
  balance_after INTEGER NOT NULL,
  reason        TEXT,
  booking_id    UUID REFERENCES bookings(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────
-- 4) الرواتب (محسوبة من الحضور)
-- ─────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2),      -- ر.س / ساعة
  ADD COLUMN IF NOT EXISTS monthly_salary NUMERIC(10,2);    -- أو راتب شهري ثابت

-- جدول الرواتب (snapshots شهرية)
CREATE TABLE IF NOT EXISTS payroll_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_month    INTEGER NOT NULL,            -- 1-12
  period_year     INTEGER NOT NULL,
  total_hours     NUMERIC(10,2) NOT NULL DEFAULT 0,
  hourly_rate     NUMERIC(10,2),
  base_amount     NUMERIC(10,2) NOT NULL,       -- الراتب الأساسي
  bonuses         NUMERIC(10,2) DEFAULT 0,      -- مكافآت
  deductions      NUMERIC(10,2) DEFAULT 0,      -- خصومات
  net_amount      NUMERIC(10,2) NOT NULL,       -- الصافي
  paid_at         TIMESTAMPTZ,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_month, period_year)
);

-- ─────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────
ALTER TABLE gift_cards              ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_card_redemptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records         ENABLE ROW LEVEL SECURITY;

-- Gift cards: الأدمن يُدير، أي شخص يتحقق من كود
CREATE POLICY "Admin manages gift cards" ON gift_cards FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Anyone can check gift card by code" ON gift_cards FOR SELECT TO anon, authenticated USING (TRUE);

CREATE POLICY "Admin manages redemptions" ON gift_card_redemptions FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Inventory: الأدمن فقط
CREATE POLICY "Admin manages inventory" ON inventory_items FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Admin manages inventory movements" ON inventory_movements FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- Payroll: الموظفة تشوف راتبها، الأدمن يُدير
CREATE POLICY "User views own payroll" ON payroll_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin manages payroll" ON payroll_records FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
