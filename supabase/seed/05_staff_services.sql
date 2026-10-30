-- ═══════════════════════════════════════════════════════════
-- Staff ↔ Services Link — ربط الموظفات بالخدمات
-- ═══════════════════════════════════════════════════════════
-- يربط كل موظفة بالخدمات اللي تقدر تسوّيها حسب قسمها
--
-- 💇🏻‍♀️ قسم الشعر → قص · صبغ · تجفيف · تسريحات · علاج شعر · ميك اب
-- 🧖🏻‍♀️ قسم السبا والتشقير → مساج · حمّام · بشرة · حواجب (تشقير) · أظافر
--
-- 💡 آمن للتشغيل مرات متعدّدة (ON CONFLICT DO NOTHING)
-- ═══════════════════════════════════════════════════════════

-- ─── خطوة 1 · تنظيف الربط القديم للموظفات هذولا بس (اختياري) ───
-- لو تبغين تبدأين نظيف · شيلي -- من السطر التالي:
-- DELETE FROM staff_services WHERE staff_id IN (
--   SELECT id FROM staff WHERE name IN (
--     'إخلاص','لين','آي','منى','غدير','سمر','صوفيا','خديجة',
--     'حياة','زبيبة','ليسا','ستي','ديما','دارين','هني'
--   )
-- );


-- ─── خطوة 2 · ربط موظفات الشعر بخدمات الشعر + الميك اب ───
INSERT INTO staff_services (staff_id, service_id)
SELECT
  st.id,
  sv.id
FROM staff st
CROSS JOIN services sv
JOIN categories c ON c.id = sv.category_id
WHERE
  st.name IN ('إخلاص','لين','آي','منى','غدير','سمر','صوفيا','خديجة')
  AND sv.is_active = true
  AND c.slug IN ('hair-cut','hair-color','blow-dry','hair-style','hair-treat','makeup')
ON CONFLICT (staff_id, service_id) DO NOTHING;


-- ─── خطوة 3 · ربط موظفات السبا بخدمات السبا + الأظافر ───
INSERT INTO staff_services (staff_id, service_id)
SELECT
  st.id,
  sv.id
FROM staff st
CROSS JOIN services sv
JOIN categories c ON c.id = sv.category_id
WHERE
  st.name IN ('حياة','زبيبة','ليسا','ستي','ديما','دارين','هني')
  AND sv.is_active = true
  AND c.slug IN ('massage','bath','facial','brows','nails')
ON CONFLICT (staff_id, service_id) DO NOTHING;


-- ─── خطوة 4 · تقرير التحقّق ───
SELECT
  st.name                     AS "الموظفة",
  st.job_title                AS "القسم",
  COUNT(ss.service_id)        AS "عدد الخدمات",
  STRING_AGG(DISTINCT c.name_ar, '، ' ORDER BY c.name_ar) AS "الفئات"
FROM staff st
LEFT JOIN staff_services ss ON ss.staff_id = st.id
LEFT JOIN services sv       ON sv.id = ss.service_id
LEFT JOIN categories c      ON c.id = sv.category_id
WHERE st.name IN (
  'إخلاص','لين','آي','منى','غدير','سمر','صوفيا','خديجة',
  'حياة','زبيبة','ليسا','ستي','ديما','دارين','هني'
)
GROUP BY st.id, st.name, st.job_title, st.display_order
ORDER BY st.display_order;


-- ─── خطوة 5 · فحص إذا في فئات ما ارتبطت بأحد (مهم!) ───
-- لو طلعت لك فئة هنا · معناها لازم تربطينها بأحد
SELECT
  c.slug                      AS "الفئة",
  c.name_ar                   AS "الاسم",
  COUNT(DISTINCT sv.id)       AS "عدد الخدمات",
  COUNT(DISTINCT ss.staff_id) AS "عدد الموظفات المرتبطات"
FROM categories c
LEFT JOIN services sv       ON sv.category_id = c.id AND sv.is_active = true
LEFT JOIN staff_services ss ON ss.service_id = sv.id
WHERE c.is_active = true
GROUP BY c.id, c.slug, c.name_ar, c.display_order
HAVING COUNT(DISTINCT ss.staff_id) = 0
   AND COUNT(DISTINCT sv.id) > 0  -- فيه خدمات لكن ما فيه أحد يسوّيها
ORDER BY c.display_order;
