-- ═══════════════════════════════════════════════════════════
-- Site Themes · ثيمات موسميّة
-- تاريخ: 2026-11-04
-- ═══════════════════════════════════════════════════════════
-- ثيمات مختلفة للموقع · يتم تفعيل واحد في المرّة
-- مثال: اليوم الوطني · رمضان · عيد الفطر · عيد الأضحى · شتاء
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS site_themes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT UNIQUE NOT NULL,       -- national_day, ramadan, ...
  name_ar         TEXT NOT NULL,
  name_en         TEXT,
  description     TEXT,

  -- الهويّة البصريّة
  primary_color   TEXT NOT NULL,              -- #006C35
  accent_color    TEXT NOT NULL,              -- #FFFFFF
  surface_color   TEXT,                       -- خلفيّة البطاقات
  text_color      TEXT,

  -- شارة أعلى الموقع
  badge_text      TEXT,                       -- "اليوم الوطني الـ96"
  badge_emoji     TEXT,                       -- 🇸🇦

  -- زخارف
  decoration      TEXT,                       -- palms, lanterns, snowflakes, confetti, hearts
  banner_overlay  TEXT,                       -- URL لصورة overlay شفافة فوق البنرات

  -- حالة التفعيل
  is_active       BOOLEAN DEFAULT FALSE,

  -- جدولة تلقائيّة (اختياريّة)
  auto_start_date DATE,                       -- يبدأ تلقائياً في هذا التاريخ من كل سنة
  auto_end_date   DATE,                       -- ينتهي تلقائياً

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_themes_active ON site_themes(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_themes_code ON site_themes(code);

ALTER TABLE site_themes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_themes" ON site_themes;
CREATE POLICY "public_read_active_themes"
  ON site_themes FOR SELECT
  USING (TRUE);  -- كل الزوّار يقرؤون عشان يُطبَّق الثيم

DROP POLICY IF EXISTS "managers_manage_themes" ON site_themes;
CREATE POLICY "managers_manage_themes"
  ON site_themes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

-- ═══════════════════════════════════════════════════════════
-- Trigger: يضمن ثيم واحد نشط فقط
-- ═══════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION ensure_single_active_theme() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = TRUE THEN
    UPDATE site_themes
       SET is_active = FALSE,
           updated_at = NOW()
     WHERE id != NEW.id AND is_active = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_active_theme ON site_themes;
CREATE TRIGGER trg_single_active_theme
  BEFORE INSERT OR UPDATE ON site_themes
  FOR EACH ROW
  WHEN (NEW.is_active = TRUE)
  EXECUTE FUNCTION ensure_single_active_theme();

-- ═══════════════════════════════════════════════════════════
-- Seed · 6 ثيمات افتراضيّة
-- ═══════════════════════════════════════════════════════════
INSERT INTO site_themes (code, name_ar, name_en, description, primary_color, accent_color, badge_text, badge_emoji, decoration, auto_start_date, auto_end_date) VALUES

-- 1. الافتراضي (ذهبي فاخر)
('default', 'الذهبي الفاخر', 'Luxury Gold', 'الثيم الأساسي · ذهبي + كريمي',
 '#7d613b', '#d4b062', NULL, NULL, 'lotus',
 NULL, NULL),

-- 2. اليوم الوطني السعودي (أخضر · 20-25 سبتمبر)
('national_day', 'اليوم الوطني', 'Saudi National Day',
 'ثيم الأخضر السعودي · مع رموز وطنيّة · يتفعّل تلقائياً كل 20-25 سبتمبر',
 '#006C35', '#FFFFFF', 'اليوم الوطني', '🇸🇦', 'palms-swords',
 '09-20', '09-25'),

-- 3. رمضان (بنفسجي داكن · فوانيس)
('ramadan', 'رمضان كريم', 'Ramadan Kareem',
 'ثيم رمضان · بنفسجي ملكي + فوانيس',
 '#3D2C5A', '#D4AF37', 'رمضان كريم', '🌙', 'lanterns',
 NULL, NULL),

-- 4. عيد الفطر (ذهبي فرح · نجوم)
('eid_fitr', 'عيد الفطر', 'Eid Al-Fitr',
 'ثيم العيد · ذهبي + نجوم · 3 أيّام',
 '#B8860B', '#FFF8DC', 'عيد مبارك', '✨', 'stars-crescent',
 NULL, NULL),

-- 5. عيد الأضحى
('eid_adha', 'عيد الأضحى', 'Eid Al-Adha',
 'ثيم عيد الأضحى · ذهبي + أخضر زيتي',
 '#5F7A3F', '#F4E4BC', 'عيد أضحى مبارك', '🕌', 'palms-stars',
 NULL, NULL),

-- 6. فالنتاين (ورديّ وأحمر · 14 فبراير)
('valentine', 'يوم الحب', 'Valentine',
 'ثيم ورديّ وأحمر · للعميلات اللي يحبّن الاحتفال · 14 فبراير',
 '#D63384', '#FFE0E8', 'يوم الحب', '💕', 'hearts',
 '02-13', '02-15')

ON CONFLICT (code) DO NOTHING;

NOTIFY pgrst, 'reload schema';
