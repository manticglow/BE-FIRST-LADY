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
