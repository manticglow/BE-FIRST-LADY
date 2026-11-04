-- ═══════════════════════════════════════════════════════════
-- SAFE · Site Themes
-- ═══════════════════════════════════════════════════════════
-- محصّن من "already exists" · يصلح للمرّة الأولى وللإعادة
-- auto_start_date و auto_end_date = TEXT بصيغة MM-DD
-- ═══════════════════════════════════════════════════════════

-- حذف نسخة سابقة لو فشلت
DROP TABLE IF EXISTS site_themes CASCADE;

CREATE TABLE site_themes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT UNIQUE NOT NULL,
  name_ar         TEXT NOT NULL,
  name_en         TEXT,
  description     TEXT,

  primary_color   TEXT NOT NULL,
  accent_color    TEXT NOT NULL,
  surface_color   TEXT,
  text_color      TEXT,

  badge_text      TEXT,
  badge_emoji     TEXT,

  decoration      TEXT,
  banner_overlay  TEXT,

  is_active       BOOLEAN DEFAULT FALSE,

  -- جدولة · بصيغة MM-DD نصّيّة · يتكرّر كل سنة
  auto_start_date TEXT,
  auto_end_date   TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_themes_active ON site_themes(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_themes_code ON site_themes(code);

ALTER TABLE site_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_themes"
  ON site_themes FOR SELECT USING (TRUE);

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
-- Trigger: ثيم واحد نشط فقط
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
INSERT INTO site_themes (code, name_ar, name_en, description, primary_color, accent_color, badge_text, badge_emoji, decoration, auto_start_date, auto_end_date, is_active) VALUES

('default', 'الذهبي الفاخر', 'Luxury Gold',
 'الثيم الأساسي · ذهبي + كريمي',
 '#7d613b', '#d4b062', NULL, NULL, 'lotus',
 NULL, NULL, TRUE),

('national_day', 'اليوم الوطني', 'Saudi National Day',
 'ثيم الأخضر السعودي · مع رموز وطنيّة · يتفعّل تلقائياً كل 20-25 سبتمبر',
 '#006C35', '#FFFFFF', 'اليوم الوطني', '🇸🇦', 'palms-swords',
 '09-20', '09-25', FALSE),

('ramadan', 'رمضان كريم', 'Ramadan Kareem',
 'ثيم رمضان · بنفسجي ملكي + فوانيس',
 '#3D2C5A', '#D4AF37', 'رمضان كريم', '🌙', 'lanterns',
 NULL, NULL, FALSE),

('eid_fitr', 'عيد الفطر', 'Eid Al-Fitr',
 'ثيم العيد · ذهبي + نجوم · 3 أيّام',
 '#B8860B', '#FFF8DC', 'عيد مبارك', '✨', 'stars-crescent',
 NULL, NULL, FALSE),

('eid_adha', 'عيد الأضحى', 'Eid Al-Adha',
 'ثيم عيد الأضحى · ذهبي + أخضر زيتي',
 '#5F7A3F', '#F4E4BC', 'عيد أضحى مبارك', '🕌', 'palms-stars',
 NULL, NULL, FALSE),

('valentine', 'يوم الحب', 'Valentine',
 'ثيم ورديّ وأحمر · 14 فبراير',
 '#D63384', '#FFE0E8', 'يوم الحب', '💕', 'hearts',
 '02-13', '02-15', FALSE);

NOTIFY pgrst, 'reload schema';

-- ═══════════════════════════════════════════════════════════
-- ✅ خلاص · شغّليها في Supabase SQL Editor وبتشتغل
-- ═══════════════════════════════════════════════════════════
