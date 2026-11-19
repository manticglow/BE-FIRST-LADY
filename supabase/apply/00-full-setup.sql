-- ═══════════════════════════════════════════════════════════════════════
-- 🚀 THE FIRST LADY · 00 Full Setup (شامل · ملف واحد)
-- ═══════════════════════════════════════════════════════════════════════
-- يدمج 4 ملفّات في ملف واحد · شغّليه مرّة واحدة في Supabase SQL Editor
-- 
-- الأقسام:
--   PART 1 · SECURITY HARDENING (12 ثغرة + marketing_consent)
--   PART 2 · COMPLIANCE TABLES (PDPL · شكاوى · طلبات بيانات)
--   PART 3 · SERVICE IMAGES BUCKET (رفع الصور)
--   PART 4 · TEST ACCOUNTS (رغد · ريناد · غيداء)
-- 
-- idempotent · آمن للتشغيل مرّات متعدّدة · لا يحذف بيانات.
-- ═══════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════
-- PART 1 of 4 · 🔒 SECURITY HARDENING
-- ═══════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════
-- PART 2 of 4 · 📋 COMPLIANCE TABLES
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 📋 Compliance Tables · PDPL + E-Commerce Law
-- ═══════════════════════════════════════════════════════════════════════
-- يضيف جداول متطلّبة للامتثال:
--   - complaints · الشكاوى (نظام التجارة الإلكترونيّة)
--   - data_access_requests · طلبات الوصول للبيانات (PDPL Article 4)
--   - breach_log · سجلّ الاختراقات للإبلاغ 72 ساعة (PDPL Article 24)
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. الشكاوى
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  type TEXT NOT NULL CHECK (type IN (
    'service', 'staff', 'payment', 'booking',
    'privacy', 'suggestion', 'other'
  )),
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'acknowledged', 'investigating', 'resolved', 'rejected', 'escalated'
  )),
  responded_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  assigned_to UUID REFERENCES profiles(id),
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status, created_at);
CREATE INDEX IF NOT EXISTS idx_complaints_phone ON complaints(phone);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_only_complaints" ON complaints;
CREATE POLICY "service_only_complaints" ON complaints FOR ALL
  USING (auth.role() = 'service_role');

-- 2. طلبات الوصول للبيانات (حقّ العميلة بموجب PDPL)
CREATE TABLE IF NOT EXISTS data_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  phone TEXT,
  request_type TEXT NOT NULL CHECK (request_type IN (
    'access',       -- طلب نسخة من البيانات
    'correction',   -- طلب تصحيح
    'deletion',     -- طلب حذف (Article 17)
    'portability',  -- طلب نقل البيانات
    'withdraw_consent'  -- سحب الموافقة
  )),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'processing', 'completed', 'rejected'
  )),
  notes TEXT,
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMPTZ,
  -- حسب PDPL · 15 يوم للرد
  deadline_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '15 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dar_customer ON data_access_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_dar_status ON data_access_requests(status, deadline_at);

ALTER TABLE data_access_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own_dar" ON data_access_requests;
CREATE POLICY "own_dar" ON data_access_requests FOR ALL
  USING (customer_id = auth.uid() OR auth.role() = 'service_role');

-- 3. سجلّ الاختراقات (للإبلاغ 72 ساعة · PDPL Article 24)
CREATE TABLE IF NOT EXISTS breach_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reported_to_sdaia_at TIMESTAMPTZ,
  sdaia_reference TEXT,
  breach_type TEXT NOT NULL CHECK (breach_type IN (
    'unauthorized_access', 'data_loss', 'accidental_disclosure',
    'cyber_attack', 'other'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  affected_records INTEGER,
  data_types_affected TEXT[],
  description TEXT NOT NULL,
  mitigation_steps TEXT,
  customers_notified BOOLEAN DEFAULT FALSE,
  customers_notified_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE breach_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_only_breach" ON breach_log;
CREATE POLICY "owner_only_breach" ON breach_log FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner')
    OR auth.role() = 'service_role'
  );

-- Function: فحص الشكاوى المتأخّرة (أكثر من 24 ساعة بلا رد)
CREATE OR REPLACE FUNCTION overdue_complaints() RETURNS TABLE(
  reference TEXT, name TEXT, created_at TIMESTAMPTZ, hours_open NUMERIC
) AS $$
  SELECT
    reference, name, created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 AS hours_open
  FROM complaints
  WHERE status IN ('open', 'acknowledged')
    AND created_at < NOW() - INTERVAL '24 hours'
  ORDER BY created_at;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function: فحص اختراقات لم تُبلَّغ خلال 72 ساعة
CREATE OR REPLACE FUNCTION unreported_breaches() RETURNS TABLE(
  id UUID, breach_type TEXT, severity TEXT,
  discovered_at TIMESTAMPTZ, hours_since NUMERIC
) AS $$
  SELECT
    id, breach_type, severity, discovered_at,
    EXTRACT(EPOCH FROM (NOW() - discovered_at)) / 3600 AS hours_since
  FROM breach_log
  WHERE reported_to_sdaia_at IS NULL
    AND discovered_at < NOW() - INTERVAL '60 hours'  -- تنبيه قبل 72 بـ 12 ساعة
  ORDER BY discovered_at;
$$ LANGUAGE sql SECURITY DEFINER;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- ✅ Verification
-- ═══════════════════════════════════════════════════════════════════════
SELECT table_name,
  CASE WHEN rowsecurity THEN '✓ RLS' ELSE '✗ NO RLS' END AS status
FROM information_schema.tables t
JOIN pg_tables p ON p.tablename = t.table_name AND p.schemaname = t.table_schema
WHERE t.table_schema = 'public'
  AND t.table_name IN ('complaints', 'data_access_requests', 'breach_log');


-- ═══════════════════════════════════════════════════════════════════════
-- PART 3 of 4 · 📸 SERVICE IMAGES BUCKET
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 📸 Storage Bucket · service-images
-- ═══════════════════════════════════════════════════════════════════════
-- يُنشئ bucket عام للصور · مع policies مناسبة
-- شغّليه مرّة واحدة في Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════

-- 1. أنشئي الـbucket (public · لأنّ الصور تعرض للعميلات)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-images',
  'service-images',
  TRUE,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE
  SET public = TRUE,
      file_size_limit = 5242880,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- 2. Policies · الرفع للـowner/manager فقط · القراءة للجميع
DROP POLICY IF EXISTS "Public can read service images" ON storage.objects;
CREATE POLICY "Public can read service images" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'service-images');

DROP POLICY IF EXISTS "Admin can upload service images" ON storage.objects;
CREATE POLICY "Admin can upload service images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'service-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

DROP POLICY IF EXISTS "Admin can delete service images" ON storage.objects;
CREATE POLICY "Admin can delete service images" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'service-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('owner', 'manager')
    )
  );

-- 3. تأكّدي من image_url على services (موجود · نضيفه احتياطاً)
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ═══════════════════════════════════════════════════════════════════════
-- ✅ تحقّق
-- ═══════════════════════════════════════════════════════════════════════
SELECT
  id AS "اسم الـbucket",
  CASE WHEN public THEN '✓ عام' ELSE '✗ خاص' END AS "الحالة",
  pg_size_pretty(file_size_limit::BIGINT) AS "الحدّ الأقصى",
  allowed_mime_types AS "الأنواع المسموحة"
FROM storage.buckets
WHERE id = 'service-images';


-- ═══════════════════════════════════════════════════════════════════════
-- PART 4 of 4 · 👥 TEST ACCOUNTS
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 🌸 إنشاء 3 حسابات تجريبيّة · The First Lady
-- ═══════════════════════════════════════════════════════════════════════
-- 👑 رغد الزهراني · مالكة  · owner@thefirstlady.sa  / Raghad@2026!
-- 👩‍💼 ريناد السالم · موظّفة · renad@thefirstlady.sa  / Renad@2026!
-- 🌸 غيداء العتيبي · عميلة  · ghaida@thefirstlady.sa / Ghaida@2026!
--
-- ⚠️ ملاحظة: إنشاء auth.users مباشرة في SQL ممكن لكن غير مُستحسن.
-- الأسلم: استخدمي السكريبت `scripts/create-test-accounts.ts` أو
-- سجّلي كل حساب من صفحة /signup يدوياً · ثمّ شغّلي الـUPDATE أدناه
-- لرفع الأدوار.
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 🅐 الطريقة المباشرة · أنشئي الحسابات في auth.users
-- ─────────────────────────────────────────────────────────────────────
-- ملاحظة: كلمة السرّ bcrypt-hashed (نولّدها بـcrypt + gen_salt)

-- 👑 رغد · المالكة
DO $$
DECLARE
  v_uid UUID;
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'owner@thefirstlady.sa',
    crypt('Raghad@2026!', gen_salt('bf')),
    NOW(),
    jsonb_build_object('full_name', 'رغد الزهراني', 'phone', '0504134147'),
    NOW(), NOW(), '', '', '', ''
  )
  ON CONFLICT (email) DO UPDATE
    SET encrypted_password = crypt('Raghad@2026!', gen_salt('bf')),
        email_confirmed_at = NOW(),
        raw_user_meta_data = jsonb_build_object('full_name', 'رغد الزهراني', 'phone', '0504134147')
  RETURNING id INTO v_uid;

  -- profile
  INSERT INTO profiles (id, email, full_name, phone, role)
  VALUES (v_uid, 'owner@thefirstlady.sa', 'رغد الزهراني', '0504134147', 'owner')
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, role = 'owner';

  RAISE NOTICE '👑 رغد · owner@thefirstlady.sa / Raghad@2026!';
END $$;

-- 👩‍💼 ريناد · الموظّفة
DO $$
DECLARE
  v_uid UUID;
  v_staff_id UUID;
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'renad@thefirstlady.sa',
    crypt('Renad@2026!', gen_salt('bf')),
    NOW(),
    jsonb_build_object('full_name', 'ريناد السالم', 'phone', '0501234567'),
    NOW(), NOW(), '', '', '', ''
  )
  ON CONFLICT (email) DO UPDATE
    SET encrypted_password = crypt('Renad@2026!', gen_salt('bf')),
        email_confirmed_at = NOW()
  RETURNING id INTO v_uid;

  INSERT INTO profiles (id, email, full_name, phone, role)
  VALUES (v_uid, 'renad@thefirstlady.sa', 'ريناد السالم', '0501234567', 'staff')
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, role = 'staff';

  -- ضيفيها في جدول الموظّفات
  INSERT INTO staff (profile_id, name, job_title, specialties, is_active, display_order)
  VALUES (
    v_uid,
    'ريناد السالم',
    'أخصّائية سبا وتشقير',
    ARRAY['سبا', 'مساج', 'تشقير', 'بشرة']::TEXT[],
    TRUE,
    20
  )
  ON CONFLICT (profile_id) DO UPDATE
    SET name = EXCLUDED.name, job_title = EXCLUDED.job_title, is_active = TRUE
  RETURNING id INTO v_staff_id;

  -- جدول دوام · الأحد-الخميس · 10ص-10م
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time)
  SELECT v_staff_id, d, '10:00'::TIME, '22:00'::TIME
  FROM generate_series(0, 4) d
  ON CONFLICT (staff_id, day_of_week) DO UPDATE
    SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time;

  RAISE NOTICE '👩‍💼 ريناد · renad@thefirstlady.sa / Renad@2026!';
END $$;

-- 🌸 غيداء · العميلة
DO $$
DECLARE
  v_uid UUID;
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email,
    encrypted_password, email_confirmed_at,
    raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated', 'authenticated',
    'ghaida@thefirstlady.sa',
    crypt('Ghaida@2026!', gen_salt('bf')),
    NOW(),
    jsonb_build_object('full_name', 'غيداء العتيبي', 'phone', '0509876543'),
    NOW(), NOW(), '', '', '', ''
  )
  ON CONFLICT (email) DO UPDATE
    SET encrypted_password = crypt('Ghaida@2026!', gen_salt('bf')),
        email_confirmed_at = NOW()
  RETURNING id INTO v_uid;

  INSERT INTO profiles (
    id, email, full_name, phone, role,
    marketing_consent, marketing_consent_at, birthday
  )
  VALUES (
    v_uid, 'ghaida@thefirstlady.sa', 'غيداء العتيبي', '0509876543', 'customer',
    TRUE, NOW(), '1998-04-15'
  )
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone, role = 'customer',
        marketing_consent = TRUE, birthday = EXCLUDED.birthday;

  RAISE NOTICE '🌸 غيداء · ghaida@thefirstlady.sa / Ghaida@2026!';
END $$;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- ✅ تحقّق · شوفي الحسابات الـ3 الجديدة
-- ═══════════════════════════════════════════════════════════════════════
SELECT
  CASE p.role
    WHEN 'owner' THEN '👑 مالكة'
    WHEN 'staff' THEN '👩‍💼 موظّفة'
    WHEN 'customer' THEN '🌸 عميلة'
    ELSE p.role
  END AS "الدور",
  p.full_name AS "الاسم",
  p.email AS "الإيميل",
  p.phone AS "الجوّال"
FROM profiles p
WHERE p.email IN (
  'owner@thefirstlady.sa',
  'renad@thefirstlady.sa',
  'ghaida@thefirstlady.sa'
)
ORDER BY
  CASE p.role WHEN 'owner' THEN 1 WHEN 'staff' THEN 2 ELSE 3 END;


-- ═══════════════════════════════════════════════════════════════════════
-- ✅ تحقّق نهائي
-- ═══════════════════════════════════════════════════════════════════════
SELECT 
  'الحسابات' AS "البند", COUNT(*)::TEXT AS "القيمة"
FROM profiles WHERE role IN ('owner', 'staff', 'customer')
UNION ALL
SELECT 'الجداول', COUNT(*)::TEXT FROM pg_tables WHERE schemaname = 'public'
UNION ALL
SELECT 'buckets التخزين', COUNT(*)::TEXT FROM storage.buckets;
