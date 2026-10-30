-- ═══════════════════════════════════════════════════════════
-- Seed Data — الفئات والخدمات الأساسية
-- ═══════════════════════════════════════════════════════════

-- Categories
INSERT INTO categories (slug, name_ar, name_en, icon, display_order) VALUES
  ('massage',  'خدمات المساج',       'Massage Services',   '💆‍♀️', 1),
  ('bath',     'خدمات الحمام المغربي', 'Moroccan Bath',    '🫖',   2),
  ('facial',   'خدمات تنظيف البشرة',   'Facials',          '✨',   3),
  ('nails',    'المانيكير والبديكير',  'Manicure & Pedicure','💅', 4),
  ('brows',    'الحواجب',             'Eyebrows',         '👁️',  5),
  ('hair-color','صبغات الشعر',       'Hair Coloring',     '🎨',   6),
  ('hair-cut', 'قص الشعر',           'Haircuts',          '✂️',  7),
  ('blow-dry', 'الاستشوار',          'Blow-Dry',          '💇‍♀️', 8),
  ('hair-style','تسريح الشعر',       'Hair Styling',      '👑',   9),
  ('hair-treat','معالجات الشعر',     'Hair Treatments',   '💧',   10),
  ('makeup',   'خدمات المكياج',      'Makeup',            '💄',   11);

-- Services: Massage (sample — add rest in production)
INSERT INTO services (category_id, name_ar, name_en, price, duration_min, description_ar, display_order)
SELECT c.id, 'مساج سويدي', 'Swedish Massage', 189, 45,
  'حركات انسيابية لطيفة تُذيب التوتر وتُنشّط الدورة الدموية لاسترخاء كامل', 1
FROM categories c WHERE c.slug = 'massage';

INSERT INTO services (category_id, name_ar, name_en, price, duration_min, description_ar, display_order)
SELECT c.id, 'مساج علاجي', 'Therapeutic Massage', 199, 60,
  'ضغط عميق يستهدف العقد العضلية ويخفّف آلام الظهر والرقبة', 2
FROM categories c WHERE c.slug = 'massage';

INSERT INTO services (category_id, name_ar, name_en, price, duration_min, description_ar, display_order)
SELECT c.id, 'مساج أحجار ساخنة', 'Hot Stone Massage', 230, 60, NULL, 3
FROM categories c WHERE c.slug = 'massage';

INSERT INTO services (category_id, name_ar, name_en, price, duration_min, display_order)
SELECT c.id, 'مساج كاسات الهواء', 'Cupping Massage', 230, 60, 4
FROM categories c WHERE c.slug = 'massage';

INSERT INTO services (category_id, name_ar, name_en, price, duration_min, display_order)
SELECT c.id, 'مساج ما بعد الولادة', 'Postnatal Massage', 260, 60, 5
FROM categories c WHERE c.slug = 'massage';

-- Hours (أوقات العمل الافتراضية)
INSERT INTO hours (section, open_time, close_time, note) VALUES
  ('spa',   '10:00', '00:00', '١٢ ساعة يومياً · ٧ أيام في الأسبوع'),
  ('salon', '13:00', '23:00', '١٠ ساعات يومياً · ٧ أيام في الأسبوع');

-- Summer Package
INSERT INTO packages (slug, name_ar, name_en, description_ar, price, original_price, is_active, display_order)
VALUES ('summer-2026', 'بكج الصيف', 'Summer Package',
        'خدمتين من اختيارك بـ ٢٩٩ ريال · + خصم إضافي ١٥٪ على البديكير والمنكير',
        299, 480, TRUE, 1);
