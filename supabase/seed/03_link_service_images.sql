-- ═══════════════════════════════════════════════════════════
-- ربط صور الخدمات بأسماء الملفات المحلية في /public/images/services/
-- ═══════════════════════════════════════════════════════════
-- شغّلي هذا الاستعلام في Supabase SQL Editor بعد رفع الصور في:
--   public/images/services/*.jpg
-- يُحدّث حقل image_url في كل خدمة ليربطها بصورتها الصحيحة.
-- ═══════════════════════════════════════════════════════════

-- 💆 المساج (8 خدمات)
UPDATE services SET image_url = '/images/services/swedish-massage.jpg'       WHERE name_ar = 'مساج سويدي';
UPDATE services SET image_url = '/images/services/therapeutic-massage.jpg'   WHERE name_ar = 'مساج علاجي';
UPDATE services SET image_url = '/images/services/hot-stone-massage.jpg'     WHERE name_ar = 'مساج أحجار ساخنة';
UPDATE services SET image_url = '/images/services/cupping-massage.jpg'       WHERE name_ar = 'مساج كاسات الهواء';
UPDATE services SET image_url = '/images/services/postnatal-massage.jpg'     WHERE name_ar = 'مساج ما بعد الولادة';
UPDATE services SET image_url = '/images/services/lymphatic-massage.jpg'     WHERE name_ar = 'مساج ليمفاوي';
UPDATE services SET image_url = '/images/services/thai-massage.jpg'          WHERE name_ar = 'مساج تايلندي';
UPDATE services SET image_url = '/images/services/foot-reflexology.jpg'      WHERE name_ar = 'مساج القدمين';

-- 🫖 الحمام المغربي (3 خدمات)
UPDATE services SET image_url = '/images/services/classic-moroccan-bath.jpg' WHERE name_ar = 'حمام مغربي كلاسيكي';
UPDATE services SET image_url = '/images/services/royal-moroccan-bath.jpg'   WHERE name_ar = 'حمام مغربي ملكي';
UPDATE services SET image_url = '/images/services/golden-moroccan-bath.jpg'  WHERE name_ar = 'حمام مغربي بالذهب';

-- ✨ تنظيف البشرة (4 خدمات)
UPDATE services SET image_url = '/images/services/deep-facial-cleansing.jpg' WHERE name_ar = 'تنظيف بشرة عميق';
UPDATE services SET image_url = '/images/services/hollywood-facial.jpg'      WHERE name_ar = 'تنظيف هوليوود';
UPDATE services SET image_url = '/images/services/carboxy-facial.jpg'        WHERE name_ar = 'تنظيف بالكربوكسي';
UPDATE services SET image_url = '/images/services/gold-mask.jpg'             WHERE name_ar = 'ماسك ذهب';

-- 💅 الأظافر (5 خدمات)
UPDATE services SET image_url = '/images/services/classic-manicure.jpg'      WHERE name_ar = 'مناكير كلاسيك';
UPDATE services SET image_url = '/images/services/classic-pedicure.jpg'      WHERE name_ar = 'بديكير كلاسيك';
UPDATE services SET image_url = '/images/services/manicure-pedicure.jpg'     WHERE name_ar = 'مناكير وبديكير';
UPDATE services SET image_url = '/images/services/gel-polish.jpg'            WHERE name_ar = 'جل بوليش';
UPDATE services SET image_url = '/images/services/acrylic-nails.jpg'         WHERE name_ar = 'أظافر أكريليك';

-- 👁 الحواجب والرموش (5 خدمات)
UPDATE services SET image_url = '/images/services/eyebrow-threading.jpg'     WHERE name_ar = 'ترتيب الحواجب بالخيط';
UPDATE services SET image_url = '/images/services/eyebrow-tinting.jpg'       WHERE name_ar = 'صبغة حواجب';
UPDATE services SET image_url = '/images/services/brow-lamination.jpg'       WHERE name_ar = 'براوز لامينيشن';
UPDATE services SET image_url = '/images/services/lash-lift.jpg'             WHERE name_ar = 'رفع الرموش';
UPDATE services SET image_url = '/images/services/classic-lash-extensions.jpg' WHERE name_ar = 'إكستنشن رموش كلاسيك';

-- 🎨 صبغات الشعر (4 خدمات) · ⚠️ ملاحظة: ombr-.jpg بالاسم هذا بالضبط (مع الشرطة)
UPDATE services SET image_url = '/images/services/full-hair-color.jpg'       WHERE name_ar = 'صبغة شعر كاملة';
UPDATE services SET image_url = '/images/services/highlights.jpg'            WHERE name_ar = 'هايلايت';
UPDATE services SET image_url = '/images/services/balayage.jpg'              WHERE name_ar = 'بالياج';
UPDATE services SET image_url = '/images/services/ombr-.jpg'                 WHERE name_ar = 'أومبريه';

-- ✂️ قص الشعر والاستشوار (5 خدمات)
UPDATE services SET image_url = '/images/services/simple-haircut.jpg'        WHERE name_ar = 'قص شعر بسيط';
UPDATE services SET image_url = '/images/services/cut-style.jpg'             WHERE name_ar = 'قص وتشكيل';
UPDATE services SET image_url = '/images/services/short-blow-dry.jpg'        WHERE name_ar = 'استشوار قصير';
UPDATE services SET image_url = '/images/services/medium-blow-dry.jpg'       WHERE name_ar = 'استشوار متوسط';
UPDATE services SET image_url = '/images/services/long-blow-dry.jpg'         WHERE name_ar = 'استشوار طويل';

-- 👑 تسريحات الشعر (3 خدمات)
UPDATE services SET image_url = '/images/services/soft-hairstyle.jpg'        WHERE name_ar = 'تسريحة ناعمة';
UPDATE services SET image_url = '/images/services/event-hairstyle.jpg'       WHERE name_ar = 'تسريحة مناسبات';
UPDATE services SET image_url = '/images/services/bridal-hairstyle.jpg'      WHERE name_ar = 'تسريحة عرايس';

-- 💧 معالجات الشعر (4 خدمات)
UPDATE services SET image_url = '/images/services/hair-mask.jpg'             WHERE name_ar = 'حمام كريم';
UPDATE services SET image_url = '/images/services/protein-treatment.jpg'     WHERE name_ar = 'بروتين';
UPDATE services SET image_url = '/images/services/keratin-treatment.jpg'     WHERE name_ar = 'كيراتين';
UPDATE services SET image_url = '/images/services/hair-botox.jpg'            WHERE name_ar = 'بوتوكس الشعر';

-- 💄 المكياج (3 خدمات)
UPDATE services SET image_url = '/images/services/soft-makeup.jpg'           WHERE name_ar = 'مكياج ناعم';
UPDATE services SET image_url = '/images/services/event-makeup.jpg'          WHERE name_ar = 'مكياج مناسبات';
UPDATE services SET image_url = '/images/services/bridal-makeup.jpg'         WHERE name_ar = 'مكياج عرايس';

-- ═══════════════════════════════════════════════════════════
-- التحقّق · لازم ترجع 44
SELECT COUNT(*) AS "خدمات تم ربطها" FROM services WHERE image_url IS NOT NULL;

-- اعرضي الخدمات اللي ما تم ربطها (لازم تكون 0)
SELECT name_ar, name_en FROM services WHERE image_url IS NULL AND is_active = TRUE;
