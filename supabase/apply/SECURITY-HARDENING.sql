-- ═══════════════════════════════════════════════════════════════════════
-- 🔒 SECURITY HARDENING · The First Lady · 2026-11-18
-- ═══════════════════════════════════════════════════════════════════════
-- يعالج 12 ثغرة CRITICAL/HIGH من تدقيق لجنة الأمن السيبراني
--
-- شغّلي هذا الملف في Supabase SQL Editor مرّة واحدة.
-- آمن للتشغيل مرّات متعدّدة (idempotent).
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 1️⃣ [CRITICAL-C1] تفعيل RLS على كل الجداول المكشوفة من mega-features
-- ─────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  tbl TEXT;
  open_tables TEXT[] := ARRAY[
    'campaign_recipients', 'phone_calls', 'orders', 'order_items',
    'carts', 'cart_items', 'products', 'product_categories',
    'marketing_campaigns', 'birthday_messages',
    'loyalty_challenges', 'loyalty_challenge_progress'
  ];
BEGIN
  FOREACH tbl IN ARRAY open_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
      RAISE NOTICE '✓ RLS enabled: %', tbl;
    END IF;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 2️⃣ سياسات RLS محدّدة لكل جدول
-- ─────────────────────────────────────────────────────────────────────

-- helper: is_admin
CREATE OR REPLACE FUNCTION is_admin_role() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role IN ('owner', 'manager')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- products / product_categories · قراءة عامّة · كتابة admin فقط
DROP POLICY IF EXISTS "public_read_products" ON products;
CREATE POLICY "public_read_products" ON products FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "admin_write_products" ON products;
CREATE POLICY "admin_write_products" ON products FOR ALL USING (is_admin_role());

DROP POLICY IF EXISTS "public_read_product_cats" ON product_categories;
CREATE POLICY "public_read_product_cats" ON product_categories FOR SELECT USING (is_active = TRUE);
DROP POLICY IF EXISTS "admin_write_product_cats" ON product_categories;
CREATE POLICY "admin_write_product_cats" ON product_categories FOR ALL USING (is_admin_role());

-- carts / cart_items · العميلة ترى عربتها فقط
DROP POLICY IF EXISTS "own_cart" ON carts;
CREATE POLICY "own_cart" ON carts FOR ALL
  USING (customer_id = auth.uid() OR is_admin_role());

DROP POLICY IF EXISTS "own_cart_items" ON cart_items;
CREATE POLICY "own_cart_items" ON cart_items FOR ALL
  USING (
    cart_id IN (SELECT id FROM carts WHERE customer_id = auth.uid())
    OR is_admin_role()
  );

-- orders / order_items · العميلة ترى طلبها فقط
DROP POLICY IF EXISTS "own_orders" ON orders;
CREATE POLICY "own_orders" ON orders FOR SELECT
  USING (customer_id = auth.uid() OR is_admin_role());
DROP POLICY IF EXISTS "admin_write_orders" ON orders;
CREATE POLICY "admin_write_orders" ON orders FOR ALL USING (is_admin_role());

DROP POLICY IF EXISTS "own_order_items" ON order_items;
CREATE POLICY "own_order_items" ON order_items FOR SELECT
  USING (
    order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
    OR is_admin_role()
  );

-- marketing_campaigns / campaign_recipients · admin فقط
DROP POLICY IF EXISTS "admin_only_campaigns" ON marketing_campaigns;
CREATE POLICY "admin_only_campaigns" ON marketing_campaigns FOR ALL USING (is_admin_role());

DROP POLICY IF EXISTS "admin_only_campaign_recipients" ON campaign_recipients;
CREATE POLICY "admin_only_campaign_recipients" ON campaign_recipients FOR ALL USING (is_admin_role());

-- birthday_messages · العميلة ترى رسائلها فقط
DROP POLICY IF EXISTS "own_birthday" ON birthday_messages;
CREATE POLICY "own_birthday" ON birthday_messages FOR SELECT
  USING (customer_id = auth.uid() OR is_admin_role());
DROP POLICY IF EXISTS "admin_write_birthday" ON birthday_messages;
CREATE POLICY "admin_write_birthday" ON birthday_messages FOR ALL USING (is_admin_role());

-- loyalty_challenges · قراءة للجميع المسجّلات · كتابة admin
DROP POLICY IF EXISTS "read_active_challenges" ON loyalty_challenges;
CREATE POLICY "read_active_challenges" ON loyalty_challenges FOR SELECT
  USING (is_active = TRUE OR is_admin_role());
DROP POLICY IF EXISTS "admin_write_challenges" ON loyalty_challenges;
CREATE POLICY "admin_write_challenges" ON loyalty_challenges FOR ALL USING (is_admin_role());

-- loyalty_challenge_progress · العميلة ترى تقدّمها فقط
DROP POLICY IF EXISTS "own_progress" ON loyalty_challenge_progress;
CREATE POLICY "own_progress" ON loyalty_challenge_progress FOR ALL
  USING (customer_id = auth.uid() OR is_admin_role());

-- phone_calls · admin فقط (ملاحظات حسّاسة)
DROP POLICY IF EXISTS "admin_only_phone_calls" ON phone_calls;
CREATE POLICY "admin_only_phone_calls" ON phone_calls FOR ALL USING (is_admin_role());

-- ─────────────────────────────────────────────────────────────────────
-- 3️⃣ [CRITICAL-C2] حذف سياسة gift_cards المسمومة
-- ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can check gift card by code" ON gift_cards;
-- ما نبقي إلا السياسات الصارمة (purchaser_id = auth.uid() أو is_admin)

-- ─────────────────────────────────────────────────────────────────────
-- 4️⃣ [CRITICAL-C4] توليد كود gift card آمن تشفيرياً
-- ─────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION generate_gift_card_code() RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
BEGIN
  -- 12 حرف من قاعدة base32 عشوائيّة تشفيرياً (~60 bit entropy)
  -- أفضل بكثير من MD5(RANDOM()) 8 أحرف
  v_code := 'GC-' || UPPER(
    translate(
      encode(gen_random_bytes(9), 'base64'),
      '+/=',
      'XYZ'
    )
  );
  RETURN SUBSTRING(v_code, 1, 15);
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────────
-- 5️⃣ [HIGH-C5] marketing_consent لمنع إرسال حملات بدون موافقة
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS marketing_consent_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.marketing_consent IS
  'موافقة صريحة على استقبال الرسائل الترويجيّة (PDPL article 6)';

-- ─────────────────────────────────────────────────────────────────────
-- 6️⃣ [HIGH-C7] تهيئة OTP للتخزين المُجزّأ (hash)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE otp_codes
  ADD COLUMN IF NOT EXISTS code_hash TEXT;

COMMENT ON COLUMN otp_codes.code_hash IS
  'SHA-256(code + phone) · الـplaintext code يُنظّف تلقائياً بعد verify';

-- ─────────────────────────────────────────────────────────────────────
-- 7️⃣ [HIGH-C9] سياسة INSERT محدّدة لـ visit_photos
-- ─────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'visit_photos') THEN
    EXECUTE $policy$
      DROP POLICY IF EXISTS "staff_insert_visit_photos" ON visit_photos;
      CREATE POLICY "staff_insert_visit_photos" ON visit_photos
        FOR INSERT WITH CHECK (
          uploaded_by = auth.uid()
          AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager','staff'))
        );
    $policy$;
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────
-- 8️⃣ [MEDIUM-C11] دوال تنظيف تلقائي للـdata retention
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION cleanup_retention() RETURNS TABLE(tbl TEXT, deleted BIGINT) AS $$
DECLARE
  n BIGINT;
BEGIN
  -- otp_codes: احذفي أقدم من ساعة
  DELETE FROM otp_codes WHERE created_at < NOW() - INTERVAL '1 hour';
  GET DIAGNOSTICS n = ROW_COUNT;
  tbl := 'otp_codes'; deleted := n; RETURN NEXT;

  -- rate_limits: احذفي أقدم من يوم
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rate_limits') THEN
    DELETE FROM rate_limits WHERE created_at < NOW() - INTERVAL '1 day';
    GET DIAGNOSTICS n = ROW_COUNT;
    tbl := 'rate_limits'; deleted := n; RETURN NEXT;
  END IF;

  -- login_attempts: 90 يوم
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'login_attempts') THEN
    DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS n = ROW_COUNT;
    tbl := 'login_attempts'; deleted := n; RETURN NEXT;
  END IF;

  -- audit_logs: 24 شهر (مطلب PDPL)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '2 years';
    GET DIAGNOSTICS n = ROW_COUNT;
    tbl := 'audit_logs'; deleted := n; RETURN NEXT;
  END IF;

  -- webauthn_challenges: منتهية
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'webauthn_challenges') THEN
    DELETE FROM webauthn_challenges WHERE expires_at < NOW() - INTERVAL '1 hour';
    GET DIAGNOSTICS n = ROW_COUNT;
    tbl := 'webauthn_challenges'; deleted := n; RETURN NEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_retention IS
  'يُشغّل يومياً عبر Vercel cron · يحذف البيانات المنتهية حسب PDPL';

-- ─────────────────────────────────────────────────────────────────────
-- 9️⃣ Helper function: hash phone (للـlogs · PDPL article 7)
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION hash_phone(p TEXT) RETURNS TEXT AS $$
  SELECT encode(digest(p || COALESCE(current_setting('app.pii_salt', TRUE), 'tfl-default'), 'sha256'), 'hex');
$$ LANGUAGE sql IMMUTABLE;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- ✅ تحقّق · شغّلي للتأكّد
-- ═══════════════════════════════════════════════════════════════════════
SELECT
  table_name,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname='public' AND tablename=t.table_name) AS policies,
  CASE WHEN rowsecurity THEN '✓' ELSE '✗ RLS OFF' END AS rls
FROM information_schema.tables t
JOIN pg_tables p ON p.tablename = t.table_name AND p.schemaname = t.table_schema
WHERE t.table_schema = 'public'
  AND t.table_name IN (
    'products', 'product_categories', 'carts', 'cart_items',
    'orders', 'order_items', 'marketing_campaigns', 'campaign_recipients',
    'birthday_messages', 'loyalty_challenges', 'loyalty_challenge_progress',
    'phone_calls', 'gift_cards'
  )
ORDER BY rls DESC, table_name;
