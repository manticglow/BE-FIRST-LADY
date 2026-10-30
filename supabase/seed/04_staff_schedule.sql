-- ═══════════════════════════════════════════════════════════
-- Staff + Schedule Seed — بيانات الموظفات ودوامهنّ
-- ═══════════════════════════════════════════════════════════
-- أيام الأسبوع في Postgres: 0=الأحد · 1=الاثنين · 2=الثلاثاء
--                           3=الأربعاء · 4=الخميس · 5=الجمعة · 6=السبت
--
-- 💡 يمكن تشغيل هذا الملف مرات متعدّدة · آمن (ON CONFLICT)
-- ═══════════════════════════════════════════════════════════

-- ─── 1) إضافة الموظفات ─────────────────────────────────────
-- نستخدم UPSERT: إذا الاسم موجود → ما يسوي شي · إذا جديد → يضيف

INSERT INTO staff (name, job_title, specialties, is_active, display_order)
VALUES
  -- قسم الشعر 💇🏻‍♀️
  ('إخلاص',  'مصفّفة شعر', ARRAY['شعر','قص','صبغ','تسريحات'], true, 1),
  ('لين',    'مصفّفة شعر', ARRAY['شعر','قص','صبغ','تسريحات'], true, 2),
  ('آي',     'مصفّفة شعر', ARRAY['شعر','قص','صبغ','تسريحات'], true, 3),
  ('منى',    'مصفّفة شعر', ARRAY['شعر','قص','صبغ','تسريحات'], true, 4),
  ('غدير',   'مصفّفة شعر', ARRAY['شعر','قص','صبغ','تسريحات'], true, 5),
  ('سمر',    'مصفّفة شعر', ARRAY['شعر','قص','صبغ','تسريحات'], true, 6),
  ('صوفيا',  'مصفّفة شعر', ARRAY['شعر','قص','صبغ','تسريحات'], true, 7),
  ('خديجة',  'مصفّفة شعر', ARRAY['شعر','قص','صبغ','تسريحات'], true, 8),

  -- قسم السبا والتشقير 🧖🏻‍♀️
  ('حياة',   'أخصّائية سبا وتشقير', ARRAY['سبا','مساج','تشقير','بشرة'], true, 9),
  ('زبيبة',  'أخصّائية سبا وتشقير', ARRAY['سبا','مساج','تشقير','بشرة'], true, 10),
  ('ليسا',   'أخصّائية سبا وتشقير', ARRAY['سبا','مساج','تشقير','بشرة'], true, 11),
  ('ستي',    'أخصّائية سبا وتشقير', ARRAY['سبا','مساج','تشقير','بشرة'], true, 12),
  ('ديما',   'أخصّائية سبا وتشقير', ARRAY['سبا','مساج','تشقير','بشرة'], true, 13),
  ('دارين',  'أخصّائية سبا وتشقير', ARRAY['سبا','مساج','تشقير','بشرة'], true, 14),
  ('هني',    'أخصّائية سبا وتشقير', ARRAY['سبا','مساج','تشقير','بشرة'], true, 15)
ON CONFLICT DO NOTHING;


-- ─── 2) إضافة الدوام الأسبوعي ──────────────────────────────
-- نستخدم DO block + CTE عشان نجيب staff_id من الاسم ونضيف الـschedule

DO $$
DECLARE
  v_staff_id UUID;
BEGIN

  -- 💇🏻‍♀️ قسم الشعر ────────────────────────────────────────

  -- إخلاص · السبت 2:00م – 10:00م
  SELECT id INTO v_staff_id FROM staff WHERE name = 'إخلاص' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time)
  VALUES (v_staff_id, 6, '14:00', '22:00')
  ON CONFLICT (staff_id, day_of_week) DO UPDATE
    SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_off = false;

  -- لين · الاثنين 3:00م – 11:00م
  SELECT id INTO v_staff_id FROM staff WHERE name = 'لين' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time)
  VALUES (v_staff_id, 1, '15:00', '23:00')
  ON CONFLICT (staff_id, day_of_week) DO UPDATE
    SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_off = false;

  -- آي · الأحد 3:00م – 11:00م
  SELECT id INTO v_staff_id FROM staff WHERE name = 'آي' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time)
  VALUES (v_staff_id, 0, '15:00', '23:00')
  ON CONFLICT (staff_id, day_of_week) DO UPDATE
    SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_off = false;

  -- منى · الأربعاء 2:00م – 10:00م
  SELECT id INTO v_staff_id FROM staff WHERE name = 'منى' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time)
  VALUES (v_staff_id, 3, '14:00', '22:00')
  ON CONFLICT (staff_id, day_of_week) DO UPDATE
    SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_off = false;

  -- غدير · الأحد 1:00م – 9:00م
  SELECT id INTO v_staff_id FROM staff WHERE name = 'غدير' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time)
  VALUES (v_staff_id, 0, '13:00', '21:00')
  ON CONFLICT (staff_id, day_of_week) DO UPDATE
    SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_off = false;

  -- سمر · الأحد + الاثنين + الثلاثاء 3:00م – 11:00م
  SELECT id INTO v_staff_id FROM staff WHERE name = 'سمر' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES
    (v_staff_id, 0, '15:00', '23:00'),
    (v_staff_id, 1, '15:00', '23:00'),
    (v_staff_id, 2, '15:00', '23:00')
  ON CONFLICT (staff_id, day_of_week) DO UPDATE
    SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_off = false;

  -- صوفيا · الأحد + الاثنين + الثلاثاء + الأربعاء 1:00م – 9:00م
  SELECT id INTO v_staff_id FROM staff WHERE name = 'صوفيا' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time) VALUES
    (v_staff_id, 0, '13:00', '21:00'),
    (v_staff_id, 1, '13:00', '21:00'),
    (v_staff_id, 2, '13:00', '21:00'),
    (v_staff_id, 3, '13:00', '21:00')
  ON CONFLICT (staff_id, day_of_week) DO UPDATE
    SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_off = false;

  -- خديجة · الاثنين 3:00م – 11:00م
  SELECT id INTO v_staff_id FROM staff WHERE name = 'خديجة' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time)
  VALUES (v_staff_id, 1, '15:00', '23:00')
  ON CONFLICT (staff_id, day_of_week) DO UPDATE
    SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_off = false;


  -- 🧖🏻‍♀️ قسم السبا والتشقير ─────────────────────────────

  -- حياة · الأحد 3:00م – 11:00م
  SELECT id INTO v_staff_id FROM staff WHERE name = 'حياة' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time)
  VALUES (v_staff_id, 0, '15:00', '23:00')
  ON CONFLICT (staff_id, day_of_week) DO UPDATE
    SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_off = false;

  -- زبيبة · السبت 10:00ص – 6:00م
  SELECT id INTO v_staff_id FROM staff WHERE name = 'زبيبة' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time)
  VALUES (v_staff_id, 6, '10:00', '18:00')
  ON CONFLICT (staff_id, day_of_week) DO UPDATE
    SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_off = false;

  -- ليسا · الثلاثاء 2:00م – 10:00م
  SELECT id INTO v_staff_id FROM staff WHERE name = 'ليسا' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time)
  VALUES (v_staff_id, 2, '14:00', '22:00')
  ON CONFLICT (staff_id, day_of_week) DO UPDATE
    SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_off = false;

  -- ستي · الجمعة 4:00م – 12:00ص (منتصف الليل → نخزّنه 23:59)
  SELECT id INTO v_staff_id FROM staff WHERE name = 'ستي' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time)
  VALUES (v_staff_id, 5, '16:00', '23:59')
  ON CONFLICT (staff_id, day_of_week) DO UPDATE
    SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_off = false;

  -- ديما · الأحد 4:00م – 12:00ص
  SELECT id INTO v_staff_id FROM staff WHERE name = 'ديما' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time)
  VALUES (v_staff_id, 0, '16:00', '23:59')
  ON CONFLICT (staff_id, day_of_week) DO UPDATE
    SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_off = false;

  -- دارين · الاثنين 4:00م – 12:00ص
  SELECT id INTO v_staff_id FROM staff WHERE name = 'دارين' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time)
  VALUES (v_staff_id, 1, '16:00', '23:59')
  ON CONFLICT (staff_id, day_of_week) DO UPDATE
    SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_off = false;

  -- هني · السبت 10:00ص – 6:00م
  SELECT id INTO v_staff_id FROM staff WHERE name = 'هني' LIMIT 1;
  INSERT INTO staff_schedule (staff_id, day_of_week, start_time, end_time)
  VALUES (v_staff_id, 6, '10:00', '18:00')
  ON CONFLICT (staff_id, day_of_week) DO UPDATE
    SET start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, is_off = false;

END $$;


-- ─── 3) تقرير بسيط للتحقّق ─────────────────────────────────
-- اعرضي الموظفات مع عدد أيام دوامهنّ
SELECT
  s.name AS "الموظفة",
  s.job_title AS "القسم",
  COUNT(sch.id) AS "عدد الأيام",
  STRING_AGG(
    CASE sch.day_of_week
      WHEN 0 THEN 'الأحد'
      WHEN 1 THEN 'الاثنين'
      WHEN 2 THEN 'الثلاثاء'
      WHEN 3 THEN 'الأربعاء'
      WHEN 4 THEN 'الخميس'
      WHEN 5 THEN 'الجمعة'
      WHEN 6 THEN 'السبت'
    END,
    '، ' ORDER BY sch.day_of_week
  ) AS "أيام الدوام",
  MIN(sch.start_time)::TEXT || ' - ' || MAX(sch.end_time)::TEXT AS "الوقت"
FROM staff s
LEFT JOIN staff_schedule sch ON sch.staff_id = s.id AND NOT sch.is_off
WHERE s.name IN (
  'إخلاص','لين','آي','منى','غدير','سمر','صوفيا','خديجة',
  'حياة','زبيبة','ليسا','ستي','ديما','دارين','هني'
)
GROUP BY s.id, s.name, s.job_title, s.display_order
ORDER BY s.display_order;
