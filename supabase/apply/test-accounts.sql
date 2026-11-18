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
