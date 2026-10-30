-- ═══════════════════════════════════════════════════════════
-- ربط صور الخدمات · النسخة المطابقة بالضبط لقاعدة البيانات
-- ═══════════════════════════════════════════════════════════

-- 💆 المساج (7 خدمات)
UPDATE services SET image_url = '/images/services/swedish-massage.jpg'       WHERE name_ar = 'مساج سويدي';
UPDATE services SET image_url = '/images/services/therapeutic-massage.jpg'   WHERE name_ar = 'مساج ديب تيشو';
UPDATE services SET image_url = '/images/services/hot-stone-massage.jpg'     WHERE name_ar = 'مساج أحجار ساخنة';
UPDATE services SET image_url = '/images/services/thai-massage.jpg'          WHERE name_ar = 'مساج تايلندي';
UPDATE services SET image_url = '/images/services/postnatal-massage.jpg'     WHERE name_ar = 'مساج الحامل';
UPDATE services SET image_url = '/images/services/lymphatic-massage.jpg'     WHERE name_ar = 'مساج ملكي';
UPDATE services SET image_url = '/images/services/cupping-massage.jpg'       WHERE name_ar = 'مساج زيوت عطريّة';

-- 🫖 الحمام المغربي (3 خدمات)
UPDATE services SET image_url = '/images/services/classic-moroccan-bath.jpg' WHERE name_ar = 'حمّام مغربي كلاسيك';
UPDATE services SET image_url = '/images/services/royal-moroccan-bath.jpg'   WHERE name_ar = 'حمّام ملكي بالذهب';
UPDATE services SET image_url = '/images/services/golden-moroccan-bath.jpg'  WHERE name_ar = 'حمّام الحليب والعسل';

-- 🧴 تقشير الجسم (2 خدمات)
UPDATE services SET image_url = '/images/services/foot-reflexology.jpg'      WHERE name_ar = 'تقشير جسم كامل';
UPDATE services SET image_url = '/images/services/manicure-pedicure.jpg'     WHERE name_ar = 'تقشير + ترطيب';

-- ✨ تنظيف البشرة والفيشال (7 خدمات)
UPDATE services SET image_url = '/images/services/deep-facial-cleansing.jpg' WHERE name_ar = 'تنظيف بشرة عميق';
UPDATE services SET image_url = '/images/services/hollywood-facial.jpg'      WHERE name_ar = 'هيدرا فيشال';
UPDATE services SET image_url = '/images/services/carboxy-facial.jpg'        WHERE name_ar = 'فيشال الكاربوكسي';
UPDATE services SET image_url = '/images/services/gold-mask.jpg'             WHERE name_ar = 'فيشال الذهب 24K';
UPDATE services SET image_url = '/images/services/bridal-hairstyle.jpg'      WHERE name_ar = 'تبييض بشرة';
UPDATE services SET image_url = '/images/services/brow-lamination.jpg'       WHERE name_ar = 'علاج الهالات السوداء';
UPDATE services SET image_url = '/images/services/short-blow-dry.jpg'        WHERE name_ar = 'علاج الكافيار';

-- 💅 الأظافر (6 خدمات)
UPDATE services SET image_url = '/images/services/classic-manicure.jpg'      WHERE name_ar = 'مانيكير كلاسيك';
UPDATE services SET image_url = '/images/services/classic-pedicure.jpg'      WHERE name_ar = 'باديكير كلاسيك';
UPDATE services SET image_url = '/images/services/gel-polish.jpg'            WHERE name_ar = 'مانيكير جل';
UPDATE services SET image_url = '/images/services/acrylic-nails.jpg'         WHERE name_ar = 'باديكير جل';
UPDATE services SET image_url = '/images/services/ombr-.jpg'                 WHERE name_ar = 'نيل آرت';
UPDATE services SET image_url = '/images/services/balayage.jpg'              WHERE name_ar = 'فرنسي';

-- 👁 الحواجب والرموش (5 خدمات)
UPDATE services SET image_url = '/images/services/eyebrow-threading.jpg'     WHERE name_ar = 'تنظيف حواجب';
UPDATE services SET image_url = '/images/services/eyebrow-tinting.jpg'       WHERE name_ar = 'صبغ حواجب';
UPDATE services SET image_url = '/images/services/lash-lift.jpg'             WHERE name_ar = 'رسم حواجب';
UPDATE services SET image_url = '/images/services/classic-lash-extensions.jpg' WHERE name_ar = 'رموش';
UPDATE services SET image_url = '/images/services/hair-mask.jpg'             WHERE name_ar = 'إزالة شعر الوجه';

-- 🎨 صبغات الشعر (3 خدمات)
UPDATE services SET image_url = '/images/services/full-hair-color.jpg'       WHERE name_ar = 'صبغة كاملة';
UPDATE services SET image_url = '/images/services/highlights.jpg'            WHERE name_ar = 'هاي لايت';
UPDATE services SET image_url = '/images/services/balayage.jpg'              WHERE name_ar = 'بلاج فرنسي';

-- ✂️ قص الشعر والاستشوار (4 خدمات)
UPDATE services SET image_url = '/images/services/simple-haircut.jpg'        WHERE name_ar = 'قص شعر';
UPDATE services SET image_url = '/images/services/cut-style.jpg'             WHERE name_ar = 'قص وتخفيف';
UPDATE services SET image_url = '/images/services/medium-blow-dry.jpg'       WHERE name_ar = 'استشوار';
UPDATE services SET image_url = '/images/services/long-blow-dry.jpg'         WHERE name_ar = 'استشوار + سيشوار';

-- 👑 تسريحات الشعر (2 خدمات)
UPDATE services SET image_url = '/images/services/soft-hairstyle.jpg'        WHERE name_ar = 'تسريحة بسيطة';
UPDATE services SET image_url = '/images/services/event-hairstyle.jpg'       WHERE name_ar = 'تسريحة سهرة';

-- 💧 معالجات الشعر (3 خدمات)
UPDATE services SET image_url = '/images/services/protein-treatment.jpg'     WHERE name_ar = 'بروتين برازيلي';
UPDATE services SET image_url = '/images/services/keratin-treatment.jpg'     WHERE name_ar = 'كيراتين';
UPDATE services SET image_url = '/images/services/hair-botox.jpg'            WHERE name_ar = 'بوتوكس شعر';

-- 💄 المكياج (4 خدمات)
UPDATE services SET image_url = '/images/services/soft-makeup.jpg'           WHERE name_ar = 'مكياج ناعم (نهاري)';
UPDATE services SET image_url = '/images/services/event-makeup.jpg'          WHERE name_ar = 'مكياج سهرة';
UPDATE services SET image_url = '/images/services/bridal-makeup.jpg'         WHERE name_ar = 'مكياج عروس';
UPDATE services SET image_url = '/images/services/event-makeup.jpg'          WHERE name_ar = 'مكياج خطوبة';

-- ═══════════════════════════════════════════════════════════
-- التحقق · لازم ترجع 46
SELECT COUNT(*) AS linked_count FROM services WHERE image_url IS NOT NULL;

-- اعرضي اللي ما تم ربطه (المفروض 0)
SELECT name_ar FROM services WHERE image_url IS NULL AND is_active = TRUE;
