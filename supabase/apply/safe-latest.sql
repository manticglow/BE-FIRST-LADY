-- ═══════════════════════════════════════════════════════════
-- SAFE-LATEST · آخر 3 migrations · محصّنة من "already exists"
-- ═══════════════════════════════════════════════════════════
-- شغّليها في Supabase SQL Editor مرّة واحدة
-- كل الجداول والفهارس تستخدم IF NOT EXISTS
-- الـpolicies تُحذف وتُعاد عشان ما يفشل الملف
-- ───────────────────────────────────────────────────────────

-- ═══════════════════════════════════════════════════════════
-- 1️⃣ Newsletter subscribers
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT UNIQUE NOT NULL,
  source           TEXT DEFAULT 'footer',
  is_active        BOOLEAN DEFAULT TRUE,
  subscribed_at    TIMESTAMPTZ DEFAULT NOW(),
  resubscribed_at  TIMESTAMPTZ,
  unsubscribed_at  TIMESTAMPTZ,
  tags             TEXT[],
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_active ON newsletter_subscribers(is_active) WHERE is_active = TRUE;

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners_read_newsletter" ON newsletter_subscribers;
CREATE POLICY "owners_read_newsletter"
  ON newsletter_subscribers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

-- ═══════════════════════════════════════════════════════════
-- 2️⃣ Push subscriptions (Web Push notifications)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_manage_own_push_subs" ON push_subscriptions;
CREATE POLICY "users_manage_own_push_subs"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════
-- 3️⃣ Permission requests (إذن انصراف/تأخّر/استراحة)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS permission_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_type    TEXT NOT NULL CHECK (request_type IN ('early_leave', 'late_arrival', 'short_break')),
  request_date    DATE NOT NULL,
  requested_time  TIME NOT NULL,
  duration_min    INTEGER,
  reason          TEXT NOT NULL,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  review_note     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permission_user ON permission_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_status ON permission_requests(status);
CREATE INDEX IF NOT EXISTS idx_permission_date ON permission_requests(request_date);

ALTER TABLE permission_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_read_own_permissions" ON permission_requests;
CREATE POLICY "staff_read_own_permissions"
  ON permission_requests FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "staff_insert_own_permissions" ON permission_requests;
CREATE POLICY "staff_insert_own_permissions"
  ON permission_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "staff_update_own_pending" ON permission_requests;
CREATE POLICY "staff_update_own_pending"
  ON permission_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "managers_read_all_permissions" ON permission_requests;
CREATE POLICY "managers_read_all_permissions"
  ON permission_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

DROP POLICY IF EXISTS "managers_update_permissions" ON permission_requests;
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
-- 4️⃣ Shift swap requests (تبديل الدوام)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS shift_swap_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  requester_date    DATE NOT NULL,
  recipient_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  recipient_date    DATE,
  reason            TEXT NOT NULL,
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

ALTER TABLE shift_swap_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parties_read_own_swap" ON shift_swap_requests;
CREATE POLICY "parties_read_own_swap"
  ON shift_swap_requests FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

DROP POLICY IF EXISTS "requester_insert_swap" ON shift_swap_requests;
CREATE POLICY "requester_insert_swap"
  ON shift_swap_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "parties_update_swap" ON shift_swap_requests;
CREATE POLICY "parties_update_swap"
  ON shift_swap_requests FOR UPDATE
  USING (
    (auth.uid() = requester_id AND status IN ('pending', 'colleague_ok'))
    OR
    (auth.uid() = recipient_id AND status = 'pending')
  );

DROP POLICY IF EXISTS "managers_read_all_swaps" ON shift_swap_requests;
CREATE POLICY "managers_read_all_swaps"
  ON shift_swap_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

DROP POLICY IF EXISTS "managers_update_swaps" ON shift_swap_requests;
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
-- 5️⃣ View موحّد لكل طلبات الموظّفة
-- ═══════════════════════════════════════════════════════════
DROP VIEW IF EXISTS staff_all_requests;
CREATE VIEW staff_all_requests AS
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

-- ═══════════════════════════════════════════════════════════
-- ✅ تحديث الـschema cache
-- ═══════════════════════════════════════════════════════════
NOTIFY pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════
-- 🎉 خلاص! لو وصلتِ هنا بدون أخطاء · كل شي تمام
-- ═══════════════════════════════════════════════════════════
