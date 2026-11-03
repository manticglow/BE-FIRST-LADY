-- ═══════════════════════════════════════════════════════════
-- Newsletter subscribers
-- تاريخ: 2026-11-03
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT UNIQUE NOT NULL,
  source           TEXT DEFAULT 'footer',            -- footer · booking · landing
  is_active        BOOLEAN DEFAULT TRUE,
  subscribed_at    TIMESTAMPTZ DEFAULT NOW(),
  resubscribed_at  TIMESTAMPTZ,
  unsubscribed_at  TIMESTAMPTZ,
  tags             TEXT[],
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(is_active) WHERE is_active = TRUE;

-- RLS: only admin/service_role can read; public can insert (upsert handled by API)
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Owner/manager can see all
CREATE POLICY "owners_read_newsletter"
  ON newsletter_subscribers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

NOTIFY pgrst, 'reload schema';
-- ═══════════════════════════════════════════════════════════
-- 🔔 Web Push Subscriptions
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,          -- the push endpoint URL
  p256dh TEXT NOT NULL,                   -- subscription keys
  auth TEXT NOT NULL,                     -- subscription keys
  user_agent TEXT,
  device_label TEXT,                      -- "iPhone 15" · "Chrome Desktop"
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_push_subs_endpoint ON push_subscriptions (endpoint);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subs_self" ON push_subscriptions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_subs_admin" ON push_subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'manager'))
  );
-- ═══════════════════════════════════════════════════════════
-- Staff Requests System
-- تاريخ: 2026-11-04
-- ═══════════════════════════════════════════════════════════
-- يضيف:
--   1. permission_requests  — إذن انصراف مبكّر / تأخّر
--   2. shift_swap_requests  — تبديل دوام بين موظّفتين
--
-- ملاحظة: الإجازات (leave_requests) موجودة بالفعل في migration 005

-- ═══════════════════════════════════════════════════════════
-- 1. إذن انصراف مبكّر أو تأخّر
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS permission_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type    TEXT NOT NULL CHECK (request_type IN ('early_leave', 'late_arrival', 'short_break')),
  request_date    DATE NOT NULL,              -- التاريخ المطلوب له الإذن
  requested_time  TIME NOT NULL,              -- الوقت الفعلي (انصراف/وصول)
  duration_min    INTEGER,                    -- للاستراحة القصيرة فقط
  reason          TEXT NOT NULL,              -- السبب (مطلوب)
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  review_note     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permission_user ON permission_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_status ON permission_requests(status);
CREATE INDEX IF NOT EXISTS idx_permission_date ON permission_requests(request_date);

-- RLS
ALTER TABLE permission_requests ENABLE ROW LEVEL SECURITY;

-- الموظّفة تقرأ/تضيف طلباتها فقط
CREATE POLICY "staff_read_own_permissions"
  ON permission_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "staff_insert_own_permissions"
  ON permission_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "staff_update_own_pending"
  ON permission_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- المالكة/المديرة تقرأ الكل
CREATE POLICY "managers_read_all_permissions"
  ON permission_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

-- المالكة/المديرة تحدّث الحالة
CREATE POLICY "managers_update_permissions"
  ON permission_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

-- ═══════════════════════════════════════════════════════════
-- 2. طلبات تبديل الدوام
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS shift_swap_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- الطالبة (اللي تبي تبدّل)
  requester_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requester_date    DATE NOT NULL,              -- اليوم اللي الطالبة تبي تعطيه

  -- المستقبِلة (اللي ترغب تستبدل معها)
  recipient_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_date    DATE,                       -- اليوم اللي راح تاخذه (اختياري)

  reason            TEXT NOT NULL,

  -- حالة التبديل:
  --   pending         — جديد · ينتظر موافقة الزميلة + الإدارة
  --   colleague_ok    — الزميلة وافقت · ينتظر الإدارة
  --   colleague_no    — الزميلة رفضت
  --   approved        — الإدارة وافقت
  --   rejected        — الإدارة رفضت
  --   cancelled       — ملغي من الطالبة
  status            TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'colleague_ok', 'colleague_no',
    'approved', 'rejected', 'cancelled'
  )),

  colleague_responded_at  TIMESTAMPTZ,
  colleague_note          TEXT,
  reviewed_by             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at             TIMESTAMPTZ,
  review_note             TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_swap_requester ON shift_swap_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_swap_recipient ON shift_swap_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_swap_status ON shift_swap_requests(status);

-- RLS
ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;

-- الطالبة والمستقبِلة تقرأ ما يخصّها
CREATE POLICY "parties_read_own_swap"
  ON shift_swap_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "requester_insert_swap"
  ON shift_swap_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- الطالبة تقدر تلغي · المستقبِلة تقدر توافق/ترفض
CREATE POLICY "parties_update_swap"
  ON shift_swap_requests FOR UPDATE
  USING (
    (auth.uid() = requester_id AND status IN ('pending', 'colleague_ok'))
    OR
    (auth.uid() = recipient_id AND status = 'pending')
  );

-- المالكة/المديرة تقرأ الكل وتُعدّل
CREATE POLICY "managers_read_all_swaps"
  ON shift_swap_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

CREATE POLICY "managers_update_swaps"
  ON shift_swap_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

-- ═══════════════════════════════════════════════════════════
-- 3. View موحّد لكل طلبات الموظّفة (لتسهيل قراءة التطبيق)
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW staff_all_requests AS
  SELECT
    id,
    user_id,
    'leave'::TEXT AS request_kind,
    leave_type AS sub_type,
    start_date AS from_date,
    end_date AS to_date,
    NULL::TIME AS at_time,
    reason,
    status,
    reviewed_by,
    reviewed_at,
    review_note,
    created_at
  FROM leave_requests

  UNION ALL

  SELECT
    id,
    user_id,
    'permission'::TEXT AS request_kind,
    request_type AS sub_type,
    request_date AS from_date,
    request_date AS to_date,
    requested_time AS at_time,
    reason,
    status,
    reviewed_by,
    reviewed_at,
    review_note,
    created_at
  FROM permission_requests

  UNION ALL

  SELECT
    id,
    requester_id AS user_id,
    'swap'::TEXT AS request_kind,
    'swap'::TEXT AS sub_type,
    requester_date AS from_date,
    recipient_date AS to_date,
    NULL::TIME AS at_time,
    reason,
    status,
    reviewed_by,
    reviewed_at,
    review_note,
    created_at
  FROM shift_swap_requests;

NOTIFY pgrst, 'reload schema';
