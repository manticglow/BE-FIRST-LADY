-- ═══════════════════════════════════════════════════════════
-- Security Hardening · Gift Cards + Reviews
-- ═══════════════════════════════════════════════════════════
-- يُضيف:
--   1. gift_cards.purchaser_id      (ربط البطاقة بالمشترية)
--   2. gift_cards.payment_status    (pending/paid/failed)
--   3. reviews.customer_id          (ربط التقييم بالعميلة)
-- ═══════════════════════════════════════════════════════════

-- 1. gift_cards: ربط بالمشترية + حالة الدفع
ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS purchaser_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'paid' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

CREATE INDEX IF NOT EXISTS idx_gift_cards_purchaser ON gift_cards(purchaser_id);
CREATE INDEX IF NOT EXISTS idx_gift_cards_payment_status ON gift_cards(payment_status);

-- البطاقات القديمة · نعتبرها مدفوعة بما أنّها كانت تُنشأ مباشرة (قبل التحسين الأمني)
UPDATE gift_cards SET payment_status = 'paid' WHERE payment_status IS NULL;

-- 2. reviews: ربط بالعميلة
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_reviews_customer ON reviews(customer_id);

-- ملء العميلة من الحجز للتقييمات القديمة
UPDATE reviews r
SET customer_id = b.customer_id
FROM bookings b
WHERE r.booking_id = b.id
  AND r.customer_id IS NULL
  AND b.customer_id IS NOT NULL;

-- 3. تعزيز سياسات RLS

-- gift_cards: المشترية ترى بطاقاتها فقط (الموظّفات/الأدمن عبر admin client)
DROP POLICY IF EXISTS "purchasers_see_own_gift_cards" ON gift_cards;
CREATE POLICY "purchasers_see_own_gift_cards" ON gift_cards
  FOR SELECT
  TO authenticated
  USING (
    purchaser_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
    )
  );

-- reviews: العميلة ترى تقييماتها + كل التقييمات المعتمدة
DROP POLICY IF EXISTS "customers_see_approved_reviews" ON reviews;
CREATE POLICY "customers_see_approved_reviews" ON reviews
  FOR SELECT
  TO authenticated
  USING (
    is_approved = true
    OR customer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff')
    )
  );

-- حماية: لا تُنشئ تقييمات من غير حساب
DROP POLICY IF EXISTS "customers_create_own_reviews" ON reviews;
CREATE POLICY "customers_create_own_reviews" ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

COMMENT ON COLUMN gift_cards.purchaser_id IS 'ربط البطاقة بالعميلة اللي اشترتها · لمنع spam creation';
COMMENT ON COLUMN gift_cards.payment_status IS 'حالة الدفع · pending حتى يتأكّد webhook الدفع';
COMMENT ON COLUMN reviews.customer_id IS 'ربط التقييم بصاحبته · منع كتابة باسم غيرها';
