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
