-- ═══════════════════════════════════════════════════════════
-- 💅 ملف الجمال وتاريخ الزيارات
-- ═══════════════════════════════════════════════════════════

-- ─── Beauty Profile · حقول في profiles ───
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS beauty_profile JSONB DEFAULT '{}'::jsonb;

-- الحقول المتوقّعة داخل beauty_profile:
-- {
--   skin_type: 'normal'|'dry'|'oily'|'combo'|'sensitive',
--   hair_type: 'straight'|'wavy'|'curly'|'coily',
--   hair_treated: boolean,
--   allergies: string[],
--   medical_notes: string,         -- خاص · ما يُشارَك
--   pregnancy_status: 'none'|'pregnant'|'nursing',
--   favorite_fragrances: string[],
--   skin_concerns: string[],       -- acne, pigmentation, aging, ...
-- }

COMMENT ON COLUMN profiles.beauty_profile IS
  'ملف الجمال · نوع البشرة والشعر والحساسيّات · تطّلع عليه الموظفة قبل الجلسة';


-- ─── Visit Photos · صور قبل/بعد لكل زيارة ───
CREATE TABLE IF NOT EXISTS visit_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_type TEXT NOT NULL CHECK (photo_type IN ('before', 'after', 'reference')),
  photo_url TEXT NOT NULL,
  caption TEXT,
  is_shareable BOOLEAN DEFAULT false,       -- هل سمحت العميلة بالمشاركة؟
  uploaded_by UUID REFERENCES auth.users(id),  -- من رفع الصورة (العميلة/الموظفة)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visit_photos_booking
  ON visit_photos (booking_id);
CREATE INDEX IF NOT EXISTS idx_visit_photos_customer_date
  ON visit_photos (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visit_photos_shareable
  ON visit_photos (is_shareable, photo_type)
  WHERE is_shareable = true;

-- RLS: العميلة ترى صورها فقط · الإدارة ترى الكل
ALTER TABLE visit_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visit_photos_own" ON visit_photos
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "visit_photos_admin" ON visit_photos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner','manager','staff'))
  );


-- ─── Supabase Storage bucket for visit photos ───
-- يُنشَأ يدوياً في Supabase Dashboard · اسم الـbucket: 'visit-photos'
-- Policies:
--   - Insert: authenticated users (الإدارة)
--   - Select: policy based on visit_photos.customer_id
--   - 10MB max size · images only

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visit-photos', 'visit-photos', false, 10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
