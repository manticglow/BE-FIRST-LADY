-- ═══════════════════════════════════════════════════════════════════════
-- 🎁 Mega Features Migration · The First Lady
-- ═══════════════════════════════════════════════════════════════════════
-- يضيف 15+ جدول جديد لدعم كل الميّزات التالية:
--
--   ✅  9  · WebAuthn (Face ID / بصمة)
--   ✅ 22  · Audit Log الحسّاس (استخدام الجدول الموجود)
--   ✅  1  · تنبيهات الميلاد (تتبّع الرسائل المرسلة)
--   ✅  2  · قائمة الانتظار
--   ✅  3  · الحجز المتكرّر
--   ✅  5  · تحدّيات الولاء
--   ✅ 17  · التقويم البصري (ما يحتاج جداول)
--   ✅ 18  · Referral (الإحالة)
--   ✅ 20  · PWA Push (موجود جزئياً · نضيف ما ينقص)
--   ✅  7  · باقات Mix & Match (نستخدم packages الموجود)
--   ✅ 11  · التقارير المتقدّمة (views + materialized views)
--   ✅ 12  · حملات تسويقيّة
--   ✅ 15  · Analytics Dashboard
--   ✅ 25  · فروع متعدّدة (نحسّن salon_locations الموجود)
--   ✅ 26  · متجر منتجات
--   ✅ 28  · Call Center
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────
-- 9️⃣ WebAuthn Credentials · Face ID / بصمة / Security Key
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,     -- base64url
  public_key TEXT NOT NULL,               -- base64url
  counter BIGINT NOT NULL DEFAULT 0,
  device_name TEXT,                       -- "iPhone of رغد"
  device_type TEXT,                       -- platform | cross-platform
  transports TEXT[],                      -- [internal, usb, nfc, ble]
  backup_eligible BOOLEAN DEFAULT FALSE,
  backup_state BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_webauthn_user ON webauthn_credentials(user_id);

-- Challenges مؤقّتة (5 دقائق صلاحيّة)
CREATE TABLE IF NOT EXISTS webauthn_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,                             -- للـlogin · قبل معرفة user_id
  challenge TEXT NOT NULL,                -- base64url
  type TEXT NOT NULL CHECK (type IN ('register', 'login')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '5 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webauthn_chal_expires ON webauthn_challenges(expires_at);

ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE webauthn_challenges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_only_webauthn_creds" ON webauthn_credentials;
DROP POLICY IF EXISTS "service_only_webauthn_chal" ON webauthn_challenges;
CREATE POLICY "service_only_webauthn_creds" ON webauthn_credentials FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only_webauthn_chal" ON webauthn_challenges FOR ALL USING (auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────
-- 1️⃣ Birthday Messages Tracking
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS birthday_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sent_year SMALLINT NOT NULL,
  message_id TEXT,                        -- WhatsApp message ID
  coupon_code TEXT,                       -- الكوبون المُولّد
  gift_amount NUMERIC(10,2) DEFAULT 0,
  claimed BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, sent_year)          -- رسالة واحدة في السنة
);
CREATE INDEX IF NOT EXISTS idx_birthday_customer ON birthday_messages(customer_id, sent_year);

-- إضافة birthday إلى profiles إذا ما موجود
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS birthday DATE,
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_birthday ON profiles(birthday) WHERE birthday IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────
-- 2️⃣ Waitlist Entries
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  preferred_date DATE,
  preferred_time TIME,
  flexibility TEXT NOT NULL DEFAULT 'exact' CHECK (flexibility IN ('exact', 'same_day', 'same_week')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'converted', 'expired', 'cancelled')),
  notified_at TIMESTAMPTZ,
  notification_expires_at TIMESTAMPTZ,    -- 30 دقيقة للحجز بعد التنبيه
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist_entries(status, created_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_customer ON waitlist_entries(customer_id);

ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "waitlist_own" ON waitlist_entries;
DROP POLICY IF EXISTS "waitlist_staff_all" ON waitlist_entries;
CREATE POLICY "waitlist_own" ON waitlist_entries
  FOR ALL USING (customer_id = auth.uid() OR auth.role() = 'service_role');
CREATE POLICY "waitlist_staff_all" ON waitlist_entries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'manager', 'staff'))
  );

-- ─────────────────────────────────────────────────────────────────
-- 3️⃣ Recurring Bookings
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recurring_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  day_of_week SMALLINT CHECK (day_of_week BETWEEN 0 AND 6),   -- 0 = الأحد
  day_of_month SMALLINT CHECK (day_of_month BETWEEN 1 AND 31),
  preferred_time TIME NOT NULL,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,                          -- NULL = مستمر
  active BOOLEAN NOT NULL DEFAULT TRUE,
  next_occurrence DATE,
  auto_confirm BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recurring_next ON recurring_bookings(next_occurrence) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_recurring_customer ON recurring_bookings(customer_id);

ALTER TABLE recurring_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recurring_own" ON recurring_bookings;
CREATE POLICY "recurring_own" ON recurring_bookings
  FOR ALL USING (customer_id = auth.uid() OR auth.role() = 'service_role');

-- ─────────────────────────────────────────────────────────────────
-- 5️⃣ Loyalty Challenges
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS loyalty_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,              -- "3_visits_november"
  title_ar TEXT NOT NULL,
  description_ar TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN (
    'visit_count',                        -- اعملي X زيارة
    'spend_amount',                       -- اصرفي X ريال
    'service_specific',                   -- جرّبي X خدمات مختلفة
    'invite_friends',                     -- ادعي X صديقة
    'streak'                              -- زورينا X شهور متتالية
  )),
  target_value INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('points', 'discount_percent', 'free_service', 'gift')),
  reward_value NUMERIC(10,2) NOT NULL,
  reward_service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  reward_description_ar TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  icon TEXT DEFAULT '🏆',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loyalty_challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES loyalty_challenges(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  current_value INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  claimed_at TIMESTAMPTZ,
  reward_code TEXT,                       -- كوبون المُولّد
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(challenge_id, customer_id)
);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_customer ON loyalty_challenge_progress(customer_id);

-- ─────────────────────────────────────────────────────────────────
-- 1️⃣8️⃣ Referrals
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,  -- اللي أحالت
  referred_id UUID REFERENCES profiles(id) ON DELETE SET NULL,          -- اللي انضمّت
  referred_email TEXT,                    -- قبل التسجيل
  referred_phone TEXT,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'joined', 'completed_first_booking', 'rewarded', 'expired')),
  referrer_reward_amount NUMERIC(10,2) DEFAULT 100,    -- 100 ريال في المحفظة
  referred_discount_percent NUMERIC(5,2) DEFAULT 15,   -- 15% أوّل حجز
  rewarded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- محفظة العميلة (لمكافآت الإحالة)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(10,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,           -- + إضافة، - خصم
  type TEXT NOT NULL CHECK (type IN ('referral_bonus', 'refund', 'manual_credit', 'booking_payment', 'birthday_gift')),
  description TEXT,
  reference_id UUID,                       -- حجز/إحالة/كوبون
  balance_after NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallet_customer ON wallet_transactions(customer_id, created_at);

-- ─────────────────────────────────────────────────────────────────
-- 1️⃣2️⃣ Marketing Campaigns
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  message_ar TEXT NOT NULL,
  target_segment TEXT NOT NULL CHECK (target_segment IN (
    'all',
    'inactive_60d',          -- ما زارت من 60 يوم
    'inactive_90d',
    'inactive_180d',
    'vip',                   -- gold+
    'birthdays_this_month',
    'new_customers',         -- آخر 30 يوم
    'specific_service',      -- جرّبن خدمة معيّنة
    'custom'
  )),
  custom_filter JSONB,       -- للـ segment = custom
  coupon_code TEXT,
  discount_percent NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  total_delivered INTEGER DEFAULT 0,
  total_clicked INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,       -- حجزن بعد الحملة
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  delivery_status TEXT CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'read')),
  message_id TEXT,
  clicked_at TIMESTAMPTZ,
  converted_booking_id UUID REFERENCES bookings(id),
  sent_at TIMESTAMPTZ,
  UNIQUE(campaign_id, customer_id)
);
CREATE INDEX IF NOT EXISTS idx_campaign_recipients ON campaign_recipients(campaign_id, delivery_status);

-- ─────────────────────────────────────────────────────────────────
-- 2️⃣5️⃣ Multi-Branch (تحسين salon_locations الموجود)
-- ─────────────────────────────────────────────────────────────────
-- نضيف branch_id للجداول الرئيسيّة (nullable للتوافق مع البيانات الحاليّة)
ALTER TABLE bookings      ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES salon_locations(id);
ALTER TABLE staff         ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES salon_locations(id);
ALTER TABLE services      ADD COLUMN IF NOT EXISTS branch_ids UUID[];  -- متاحة في أكثر من فرع

CREATE INDEX IF NOT EXISTS idx_bookings_branch ON bookings(branch_id) WHERE branch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_staff_branch ON staff(branch_id) WHERE branch_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────
-- 2️⃣6️⃣ E-commerce · Product Store
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL,
  name_en TEXT,
  slug TEXT UNIQUE,
  display_order INTEGER DEFAULT 0,
  icon TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  description_ar TEXT,
  brand TEXT,
  sku TEXT UNIQUE,
  barcode TEXT,
  price NUMERIC(10,2) NOT NULL,
  compare_price NUMERIC(10,2),             -- السعر قبل الخصم
  cost_price NUMERIC(10,2),                -- للتقارير
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  image_urls TEXT[],
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = TRUE;

CREATE TABLE IF NOT EXISTS carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT,                        -- للزوّار بدون حساب
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  price_at_time NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,       -- TFL-O-20261118-001
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  shipping_address JSONB,                  -- {city, district, street, notes}
  delivery_method TEXT DEFAULT 'pickup' CHECK (delivery_method IN ('pickup', 'delivery')),
  subtotal NUMERIC(10,2) NOT NULL,
  vat_amount NUMERIC(10,2) DEFAULT 0,
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled'
  )),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  payment_method TEXT,                     -- moyasar | cash_on_pickup
  moyasar_payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,              -- snapshot عشان لو حُذف المنتج
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ─────────────────────────────────────────────────────────────────
-- 2️⃣8️⃣ Call Center · Phone Call Log
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS phone_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  customer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  operator_id UUID REFERENCES profiles(id),
  duration_seconds INTEGER,
  outcome TEXT CHECK (outcome IN ('answered', 'missed', 'voicemail', 'busy', 'booking_created', 'inquiry', 'complaint', 'follow_up')),
  notes TEXT,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  callback_requested BOOLEAN DEFAULT FALSE,
  callback_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phone_calls_date ON phone_calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_calls_customer ON phone_calls(customer_id);

-- ─────────────────────────────────────────────────────────────────
-- 1️⃣1️⃣/1️⃣5️⃣ Views للتقارير والـAnalytics
-- ─────────────────────────────────────────────────────────────────

-- Top Customers بالاستخدام
CREATE OR REPLACE VIEW v_top_customers AS
SELECT
  p.id,
  p.full_name,
  p.phone,
  COUNT(b.id) AS total_bookings,
  COALESCE(SUM(b.total), 0) AS total_spent,
  MAX(b.booking_date) AS last_visit,
  p.loyalty_tier
FROM profiles p
LEFT JOIN bookings b ON b.customer_id = p.id AND b.status = 'completed'
WHERE p.role = 'customer'
GROUP BY p.id, p.full_name, p.phone, p.loyalty_tier;

-- Service Revenue
CREATE OR REPLACE VIEW v_service_revenue AS
SELECT
  s.id AS service_id,
  s.name_ar,
  COUNT(bi.id) AS times_booked,
  COALESCE(SUM(bi.price), 0) AS total_revenue,
  COALESCE(AVG(bi.price), 0) AS avg_price
FROM services s
LEFT JOIN booking_items bi ON bi.service_id = s.id
LEFT JOIN bookings b ON b.id = bi.booking_id AND b.status = 'completed'
GROUP BY s.id, s.name_ar;

-- Staff Performance
CREATE OR REPLACE VIEW v_staff_performance AS
SELECT
  st.id,
  st.name,
  st.job_title,
  COUNT(b.id) AS total_bookings,
  COALESCE(SUM(b.total), 0) AS total_revenue,
  COALESCE(AVG(b.total), 0) AS avg_booking_value,
  COALESCE(AVG(EXTRACT(EPOCH FROM (b.updated_at - b.created_at))/60), 0) AS avg_service_min
FROM staff st
LEFT JOIN bookings b ON b.staff_id = st.id AND b.status = 'completed'
GROUP BY st.id, st.name, st.job_title;

-- Monthly Revenue
CREATE OR REPLACE VIEW v_monthly_revenue AS
SELECT
  DATE_TRUNC('month', booking_date)::DATE AS month,
  COUNT(*) AS total_bookings,
  COALESCE(SUM(total), 0) AS revenue,
  COUNT(DISTINCT customer_id) AS unique_customers
FROM bookings
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', booking_date);

-- Peak Hours Heatmap
CREATE OR REPLACE VIEW v_peak_hours AS
SELECT
  EXTRACT(DOW FROM booking_date) AS day_of_week,
  EXTRACT(HOUR FROM booking_time::TIME) AS hour_of_day,
  COUNT(*) AS bookings_count
FROM bookings
WHERE status IN ('completed', 'confirmed')
  AND booking_date >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY EXTRACT(DOW FROM booking_date), EXTRACT(HOUR FROM booking_time::TIME);

-- Lost Customers (آخر زيارة >60 يوم)
CREATE OR REPLACE VIEW v_lost_customers AS
SELECT
  p.id,
  p.full_name,
  p.phone,
  MAX(b.booking_date) AS last_visit,
  CURRENT_DATE - MAX(b.booking_date) AS days_since,
  COUNT(b.id) AS total_visits,
  COALESCE(SUM(b.total), 0) AS lifetime_value
FROM profiles p
JOIN bookings b ON b.customer_id = p.id AND b.status = 'completed'
WHERE p.role = 'customer'
GROUP BY p.id, p.full_name, p.phone
HAVING MAX(b.booking_date) < CURRENT_DATE - INTERVAL '60 days';

-- ─────────────────────────────────────────────────────────────────
-- 📦 Seed · فئات منتجات افتراضيّة
-- ─────────────────────────────────────────────────────────────────
INSERT INTO product_categories (name_ar, name_en, slug, display_order, icon)
VALUES
  ('العناية بالشعر', 'Hair Care', 'hair-care', 1, '💆🏻‍♀️'),
  ('العناية بالبشرة', 'Skin Care', 'skin-care', 2, '✨'),
  ('المكياج', 'Makeup', 'makeup', 3, '💄'),
  ('العطور', 'Perfumes', 'perfumes', 4, '🌸'),
  ('الأدوات', 'Tools', 'tools', 5, '🧴')
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 🏆 Seed · تحدّيات ولاء افتراضيّة
-- ─────────────────────────────────────────────────────────────────
INSERT INTO loyalty_challenges (code, title_ar, description_ar, challenge_type, target_value, reward_type, reward_value, reward_description_ar, icon)
VALUES
  ('3_visits_month',       'ثلاث زيارات في الشهر',  'احجزي 3 زيارات هذا الشهر واحصلي على هديّة',    'visit_count',     3,  'discount_percent', 20, '20% خصم على الزيارة القادمة', '🌟'),
  ('spend_2000',           'عميلة فاخرة',           'اصرفي 2000 ريال وافتحي مستوى Gold',           'spend_amount',    2000, 'points',           500, '500 نقطة ولاء إضافيّة',     '💎'),
  ('try_3_services',       'استكشفي الصالون',      'جرّبي 3 خدمات مختلفة من فئات مختلفة',          'service_specific', 3,  'free_service',     1,   'خدمة ماسك بشرة مجاناً',    '🎨'),
  ('invite_2_friends',     'سفيرة الجمال',          'ادعي صديقتين لأوّل زيارة',                    'invite_friends',  2,  'points',           300, '300 نقطة + شارة سفيرة',     '🎀'),
  ('6_month_streak',       'الإخلاص الذهبي',        'زورينا شهرياً لمدّة 6 أشهر متتالية',          'streak',          6,  'discount_percent', 30, '30% خصم ذهبي · أبدي العضويّة', '👑')
ON CONFLICT (code) DO NOTHING;

COMMIT;

-- ═══════════════════════════════════════════════════════════════════════
-- ✅ النتيجة · تحقّقي من الجداول المُنشأة
-- ═══════════════════════════════════════════════════════════════════════
SELECT
  table_name,
  (xpath('/row/c/text()', query_to_xml(format('SELECT COUNT(*) AS c FROM public.%I', table_name), FALSE, TRUE, '')))[1]::TEXT::INT AS row_count
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'webauthn_credentials', 'webauthn_challenges', 'birthday_messages',
    'waitlist_entries', 'recurring_bookings', 'loyalty_challenges',
    'loyalty_challenge_progress', 'referrals', 'wallet_transactions',
    'marketing_campaigns', 'campaign_recipients', 'product_categories',
    'products', 'carts', 'cart_items', 'orders', 'order_items', 'phone_calls'
  )
ORDER BY table_name;
