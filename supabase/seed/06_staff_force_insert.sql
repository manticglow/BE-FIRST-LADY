-- ═══════════════════════════════════════════════════════════
-- 🔧 FORCE INSERT · إصلاح جذري لإضافة الموظفات
-- ═══════════════════════════════════════════════════════════
-- لو الـSQL السابق ما ضاف الموظفات · هذا يضمن إضافتهن
-- يحذف أي موظفة بنفس الاسم · ثم يضيف جديد
-- ═══════════════════════════════════════════════════════════

-- ─── خطوة 1 · تقرير "قبل" ─────────────────────────────────
DO $$
DECLARE
  before_count INT;
BEGIN
  SELECT COUNT(*) INTO before_count FROM staff;
  RAISE NOTICE '📊 عدد الموظفات قبل: %', before_count;
END $$;


-- ─── خطوة 2 · حذف أي سجلات قديمة بنفس الأسماء ────────────
-- (آمن · لأن أسماء الموظفات الجدد مميزة)
DELETE FROM staff
WHERE name IN (
  'إخلاص','لين','آي','منى','غدير','سمر','صوفيا','خديجة',
  'حياة','زبيبة','ليسا','ستي','ديما','دارين','هني'
);


-- ─── خطوة 3 · إضافة بدون ON CONFLICT (قسري) ──────────────
INSERT INTO staff (name, job_title, specialties, is_active, display_order) VALUES
  ('إخلاص',  'مصفّفة شعر', ARRAY['شعر','قص','صبغ','تسريحات']::text[], true, 1),
  ('لين',    'مصفّفة شعر', ARRAY['شعر','قص','صبغ','تسريحات']::text[], true, 2),
  ('آي',     'مصفّفة شعر', ARRAY['شعر','قص','صبغ','تسريحات']::text[], true, 3),
  ('منى',    'مصفّفة شعر', ARRAY['شعر','قص','صبغ','تسريحات']::text[], true, 4),
  ('غدير',   'مصفّفة شعر', ARRAY['شعر','قص','صبغ','تسريحات']::text[], true, 5),
  ('سمر',    'مصفّفة شعر', ARRAY['شعر','قص','صبغ','تسريحات']::text[], true, 6),
  ('صوفيا',  'مصفّفة شعر', ARRAY['شعر','قص','صبغ','تسريحات']::text[], true, 7),
  ('خديجة',  'مصفّفة شعر', ARRAY['شعر','قص','صبغ','تسريحات']::text[], true, 8),
  ('حياة',   'أخصّائية سبا وتشقير', ARRAY['سبا','مساج','تشقير','بشرة']::text[], true, 9),
  ('زبيبة',  'أخصّائية سبا وتشقير', ARRAY['سبا','مساج','تشقير','بشرة']::text[], true, 10),
  ('ليسا',   'أخصّائية سبا وتشقير', ARRAY['سبا','مساج','تشقير','بشرة']::text[], true, 11),
  ('ستي',    'أخصّائية سبا وتشقير', ARRAY['سبا','مساج','تشقير','بشرة']::text[], true, 12),
  ('ديما',   'أخصّائية سبا وتشقير', ARRAY['سبا','مساج','تشقير','بشرة']::text[], true, 13),
  ('دارين',  'أخصّائية سبا وتشقير', ARRAY['سبا','مساج','تشقير','بشرة']::text[], true, 14),
  ('هني',    'أخصّائية سبا وتشقير', ARRAY['سبا','مساج','تشقير','بشرة']::text[], true, 15);


-- ─── خطوة 4 · إضافة الدوام ──────────────────────────────
DO $$
DECLARE sid UUID;
BEGIN
  -- حذف أي دوام قديم للموظفات هذولا
  DELETE FROM staff_schedule WHERE staff_id IN (
    SELECT id FROM staff WHERE name IN (
      'إخلاص','لين','آي','منى','غدير','سمر','صوفيا','خديجة',
      'حياة','زبيبة','ليسا','ستي','ديما','دارين','هني'
    )
  );

  -- إخلاص · السبت
  SELECT id INTO sid FROM staff WHERE name='إخلاص' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES (sid, 6, '14:00', '22:00');

  -- لين · الاثنين
  SELECT id INTO sid FROM staff WHERE name='لين' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES (sid, 1, '15:00', '23:00');

  -- آي · الأحد
  SELECT id INTO sid FROM staff WHERE name='آي' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES (sid, 0, '15:00', '23:00');

  -- منى · الأربعاء
  SELECT id INTO sid FROM staff WHERE name='منى' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES (sid, 3, '14:00', '22:00');

  -- غدير · الأحد
  SELECT id INTO sid FROM staff WHERE name='غدير' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES (sid, 0, '13:00', '21:00');

  -- سمر · الأحد + الاثنين + الثلاثاء
  SELECT id INTO sid FROM staff WHERE name='سمر' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES
    (sid, 0, '15:00', '23:00'),
    (sid, 1, '15:00', '23:00'),
    (sid, 2, '15:00', '23:00');

  -- صوفيا · الأحد + الاثنين + الثلاثاء + الأربعاء
  SELECT id INTO sid FROM staff WHERE name='صوفيا' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES
    (sid, 0, '13:00', '21:00'),
    (sid, 1, '13:00', '21:00'),
    (sid, 2, '13:00', '21:00'),
    (sid, 3, '13:00', '21:00');

  -- خديجة · الاثنين
  SELECT id INTO sid FROM staff WHERE name='خديجة' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES (sid, 1, '15:00', '23:00');

  -- حياة · الأحد
  SELECT id INTO sid FROM staff WHERE name='حياة' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES (sid, 0, '15:00', '23:00');

  -- زبيبة · السبت
  SELECT id INTO sid FROM staff WHERE name='زبيبة' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES (sid, 6, '10:00', '18:00');

  -- ليسا · الثلاثاء
  SELECT id INTO sid FROM staff WHERE name='ليسا' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES (sid, 2, '14:00', '22:00');

  -- ستي · الجمعة
  SELECT id INTO sid FROM staff WHERE name='ستي' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES (sid, 5, '16:00', '23:59');

  -- ديما · الأحد
  SELECT id INTO sid FROM staff WHERE name='ديما' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES (sid, 0, '16:00', '23:59');

  -- دارين · الاثنين
  SELECT id INTO sid FROM staff WHERE name='دارين' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES (sid, 1, '16:00', '23:59');

  -- هني · السبت
  SELECT id INTO sid FROM staff WHERE name='هني' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES (sid, 6, '10:00', '18:00');

  RAISE NOTICE '✅ تمت إضافة الدوام للـ15 موظفة';
END $$;


-- ─── خطوة 5 · ربط الموظفات بالخدمات ──────────────────────
DELETE FROM staff_services WHERE staff_id IN (
  SELECT id FROM staff WHERE name IN (
    'إخلاص','لين','آي','منى','غدير','سمر','صوفيا','خديجة',
    'حياة','زبيبة','ليسا','ستي','ديما','دارين','هني'
  )
);

-- شعر → خدمات الشعر + ميك اب
INSERT INTO staff_services (staff_id, service_id)
SELECT st.id, sv.id
FROM staff st, services sv
JOIN categories c ON c.id = sv.category_id
WHERE st.name IN ('إخلاص','لين','آي','منى','غدير','سمر','صوفيا','خديجة')
  AND sv.is_active = true
  AND c.slug IN ('hair-cut','hair-color','blow-dry','hair-style','hair-treat','makeup');

-- سبا → خدمات السبا + الأظافر
INSERT INTO staff_services (staff_id, service_id)
SELECT st.id, sv.id
FROM staff st, services sv
JOIN categories c ON c.id = sv.category_id
WHERE st.name IN ('حياة','زبيبة','ليسا','ستي','ديما','دارين','هني')
  AND sv.is_active = true
  AND c.slug IN ('massage','bath','facial','brows','nails');


-- ─── خطوة 6 · التقرير النهائي ──────────────────────────
SELECT
  '✅ النتيجة النهائية' AS "التقرير",
  (SELECT COUNT(*) FROM staff WHERE name IN (
    'إخلاص','لين','آي','منى','غدير','سمر','صوفيا','خديجة',
    'حياة','زبيبة','ليسا','ستي','ديما','دارين','هني'
  )) AS "عدد الموظفات الجدد",
  (SELECT COUNT(*) FROM staff_schedule WHERE staff_id IN (
    SELECT id FROM staff WHERE name IN (
      'إخلاص','لين','آي','منى','غدير','سمر','صوفيا','خديجة',
      'حياة','زبيبة','ليسا','ستي','ديما','دارين','هني'
    )
  )) AS "عدد سجلات الدوام",
  (SELECT COUNT(*) FROM staff_services WHERE staff_id IN (
    SELECT id FROM staff WHERE name IN (
      'إخلاص','لين','آي','منى','غدير','سمر','صوفيا','خديجة',
      'حياة','زبيبة','ليسا','ستي','ديما','دارين','هني'
    )
  )) AS "عدد الخدمات المربوطة";

-- عرض الموظفات بالترتيب
SELECT
  display_order AS "الترتيب",
  name AS "الاسم",
  job_title AS "القسم",
  is_active AS "نشطة"
FROM staff
WHERE name IN (
  'إخلاص','لين','آي','منى','غدير','سمر','صوفيا','خديجة',
  'حياة','زبيبة','ليسا','ستي','ديما','دارين','هني'
)
ORDER BY display_order;
