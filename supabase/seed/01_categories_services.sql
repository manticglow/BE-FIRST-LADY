-- ═══════════════════════════════════════════════════════════
-- Be First Lady · Seed · 11 أقسام + 46 خدمة + ساعات العمل
-- ═══════════════════════════════════════════════════════════

-- الأقسام
INSERT INTO categories (slug, name_ar, name_en, icon, display_order) VALUES
  ('massage',   'خدمات المساج',        'Massage',            '💆‍♀️', 1),
  ('bath',      'الحمّام المغربي',       'Moroccan Bath',      '🫖',   2),
  ('facial',    'العناية بالبشرة',       'Facials',            '✨',   3),
  ('nails',     'المانيكير والبديكير',   'Nails',              '💅',   4),
  ('brows',     'الحواجب',              'Brows',              '👁️',   5),
  ('hair-color','صبغات الشعر',         'Hair Color',         '🎨',   6),
  ('hair-cut',  'قص الشعر',            'Haircut',            '✂️',   7),
  ('blow-dry',  'الاستشوار',           'Blow-Dry',           '💇‍♀️', 8),
  ('hair-style','تسريح الشعر',          'Hair Styling',       '👑',   9),
  ('hair-treat','معالجات الشعر',        'Hair Treatments',    '💧',   10),
  ('makeup',    'المكياج',              'Makeup',             '💄',   11);

-- ─── المساج (7) ──────────────────────────────────────
INSERT INTO services (category_id, name_ar, name_en, price, duration_min, display_order)
SELECT c.id, v.name_ar, v.name_en, v.price, v.duration_min, v.ord
FROM categories c, (VALUES
  ('مساج ملكي',          'Royal Massage',         350, 90, 1),
  ('مساج سويدي',         'Swedish Massage',       280, 60, 2),
  ('مساج أحجار ساخنة',   'Hot Stone Massage',     320, 75, 3),
  ('مساج ديب تيشو',      'Deep Tissue Massage',   310, 75, 4),
  ('مساج تايلندي',       'Thai Massage',          340, 90, 5),
  ('مساج زيوت عطريّة',   'Aromatherapy Massage',  290, 60, 6),
  ('مساج الحامل',        'Prenatal Massage',      240, 60, 7)
) AS v(name_ar, name_en, price, duration_min, ord)
WHERE c.slug = 'massage';

-- ─── الحمّام (5) ─────────────────────────────────────
INSERT INTO services (category_id, name_ar, name_en, price, duration_min, display_order)
SELECT c.id, v.name_ar, v.name_en, v.price, v.duration_min, v.ord
FROM categories c, (VALUES
  ('حمّام مغربي كلاسيك',  'Classic Moroccan Bath', 280, 75,  1),
  ('حمّام ملكي بالذهب',   'Royal Gold Bath',       480, 120, 2),
  ('حمّام الحليب والعسل', 'Milk & Honey Bath',     350, 90,  3),
  ('تقشير جسم كامل',      'Full Body Scrub',       180, 45,  4),
  ('تقشير + ترطيب',       'Scrub & Moisturize',    240, 60,  5)
) AS v(name_ar, name_en, price, duration_min, ord)
WHERE c.slug = 'bath';

-- ─── البشرة (7) ──────────────────────────────────────
INSERT INTO services (category_id, name_ar, name_en, price, duration_min, display_order)
SELECT c.id, v.name_ar, v.name_en, v.price, v.duration_min, v.ord
FROM categories c, (VALUES
  ('تنظيف بشرة عميق',       'Deep Cleansing Facial',  240, 60, 1),
  ('هيدرا فيشال',           'Hydra Facial',           450, 60, 2),
  ('فيشال الذهب 24K',       '24K Gold Facial',        550, 75, 3),
  ('فيشال الكاربوكسي',      'Carboxy Facial',         400, 60, 4),
  ('تبييض بشرة',            'Whitening Facial',       380, 75, 5),
  ('علاج الهالات السوداء',  'Dark Circles Treatment', 220, 45, 6),
  ('إزالة شعر الوجه',       'Face Threading',         80,  20, 7)
) AS v(name_ar, name_en, price, duration_min, ord)
WHERE c.slug = 'facial';

-- ─── الأظافر (6) ─────────────────────────────────────
INSERT INTO services (category_id, name_ar, name_en, price, duration_min, display_order)
SELECT c.id, v.name_ar, v.name_en, v.price, v.duration_min, v.ord
FROM categories c, (VALUES
  ('مانيكير كلاسيك',  'Classic Manicure',  60,  30, 1),
  ('باديكير كلاسيك',  'Classic Pedicure',  80,  45, 2),
  ('مانيكير جل',      'Gel Manicure',      120, 45, 3),
  ('باديكير جل',      'Gel Pedicure',      150, 60, 4),
  ('نيل آرت',         'Nail Art',          180, 60, 5),
  ('فرنسي',           'French',            100, 45, 6)
) AS v(name_ar, name_en, price, duration_min, ord)
WHERE c.slug = 'nails';

-- ─── الحواجب (3) ─────────────────────────────────────
INSERT INTO services (category_id, name_ar, name_en, price, duration_min, display_order)
SELECT c.id, v.name_ar, v.name_en, v.price, v.duration_min, v.ord
FROM categories c, (VALUES
  ('تنظيف حواجب', 'Brow Threading', 50, 20, 1),
  ('رسم حواجب',   'Brow Shaping',   70, 30, 2),
  ('صبغ حواجب',   'Brow Tinting',   60, 25, 3)
) AS v(name_ar, name_en, price, duration_min, ord)
WHERE c.slug = 'brows';

-- ─── صبغات الشعر (3) ─────────────────────────────────
INSERT INTO services (category_id, name_ar, name_en, price, duration_min, display_order)
SELECT c.id, v.name_ar, v.name_en, v.price, v.duration_min, v.ord
FROM categories c, (VALUES
  ('صبغة كاملة', 'Full Color',       320, 90,  1),
  ('هاي لايت',   'Highlights',       380, 120, 2),
  ('بلاج فرنسي', 'French Balayage',  450, 150, 3)
) AS v(name_ar, name_en, price, duration_min, ord)
WHERE c.slug = 'hair-color';

-- ─── قص الشعر (2) ────────────────────────────────────
INSERT INTO services (category_id, name_ar, name_en, price, duration_min, display_order)
SELECT c.id, v.name_ar, v.name_en, v.price, v.duration_min, v.ord
FROM categories c, (VALUES
  ('قص شعر',      'Haircut',       150, 30, 1),
  ('قص وتخفيف',   'Cut & Thin',    180, 45, 2)
) AS v(name_ar, name_en, price, duration_min, ord)
WHERE c.slug = 'hair-cut';

-- ─── الاستشوار (2) ───────────────────────────────────
INSERT INTO services (category_id, name_ar, name_en, price, duration_min, display_order)
SELECT c.id, v.name_ar, v.name_en, v.price, v.duration_min, v.ord
FROM categories c, (VALUES
  ('استشوار',          'Blow-Dry',        100, 30, 1),
  ('استشوار + سيشوار', 'Blow-Dry + Iron', 150, 45, 2)
) AS v(name_ar, name_en, price, duration_min, ord)
WHERE c.slug = 'blow-dry';

-- ─── تسريح الشعر (2) ─────────────────────────────────
INSERT INTO services (category_id, name_ar, name_en, price, duration_min, display_order)
SELECT c.id, v.name_ar, v.name_en, v.price, v.duration_min, v.ord
FROM categories c, (VALUES
  ('تسريحة بسيطة', 'Simple Updo',   180, 45, 1),
  ('تسريحة سهرة',  'Evening Updo',  280, 60, 2)
) AS v(name_ar, name_en, price, duration_min, ord)
WHERE c.slug = 'hair-style';

-- ─── معالجات الشعر (4) ───────────────────────────────
INSERT INTO services (category_id, name_ar, name_en, price, duration_min, display_order)
SELECT c.id, v.name_ar, v.name_en, v.price, v.duration_min, v.ord
FROM categories c, (VALUES
  ('بروتين برازيلي',  'Brazilian Protein',  450, 120, 1),
  ('كيراتين',         'Keratin Treatment',  550, 150, 2),
  ('بوتوكس شعر',      'Hair Botox',         600, 120, 3),
  ('علاج الكافيار',   'Caviar Treatment',   650, 90,  4)
) AS v(name_ar, name_en, price, duration_min, ord)
WHERE c.slug = 'hair-treat';

-- ─── المكياج (5) ─────────────────────────────────────
INSERT INTO services (category_id, name_ar, name_en, price, duration_min, display_order)
SELECT c.id, v.name_ar, v.name_en, v.price, v.duration_min, v.ord
FROM categories c, (VALUES
  ('مكياج ناعم (نهاري)', 'Day Makeup',       280,  45, 1),
  ('مكياج سهرة',         'Evening Makeup',   420,  60, 2),
  ('مكياج عروس',         'Bridal Makeup',    1200, 90, 3),
  ('مكياج خطوبة',        'Engagement Makeup',650,  75, 4),
  ('رموش',               'Lashes',           80,   20, 5)
) AS v(name_ar, name_en, price, duration_min, ord)
WHERE c.slug = 'makeup';

-- ─── ساعات العمل ─────────────────────────────────────
INSERT INTO hours (section, open_time, close_time, note) VALUES
  ('spa',   '10:00', '00:00', '١٢ ساعة يومياً · ٧ أيام في الأسبوع'),
  ('salon', '13:00', '23:00', '١٠ ساعات يومياً · ٧ أيام في الأسبوع')
ON CONFLICT DO NOTHING;