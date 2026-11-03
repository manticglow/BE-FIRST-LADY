-- ═══════════════════════════════════════════════════════════
-- Templates · Banners · Backups
-- تاريخ: 2026-11-04
-- ═══════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════
-- 1. message_templates — قوالب رسائل واتساب والإيميل
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS message_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            TEXT UNIQUE NOT NULL,  -- booking_confirmation, reminder_24h, ...
  name_ar         TEXT NOT NULL,
  description     TEXT,
  channel         TEXT NOT NULL DEFAULT 'whatsapp'
                  CHECK (channel IN ('whatsapp', 'email', 'sms')),
  body_ar         TEXT NOT NULL,         -- النصّ العربي · يدعم {{متغيّرات}}
  body_en         TEXT,                  -- النصّ الإنجليزي (اختياري)
  variables       TEXT[],                -- قائمة المتغيّرات المدعومة
  is_active       BOOLEAN DEFAULT TRUE,
  category        TEXT,                  -- booking · reminder · gift · marketing
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_code ON message_templates(code);
CREATE INDEX IF NOT EXISTS idx_templates_channel ON message_templates(channel);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_templates" ON message_templates;
CREATE POLICY "public_read_active_templates"
  ON message_templates FOR SELECT
  USING (is_active = TRUE);

DROP POLICY IF EXISTS "managers_manage_templates" ON message_templates;
CREATE POLICY "managers_manage_templates"
  ON message_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

-- ─── القوالب الافتراضيّة ───────────────────────────────────
INSERT INTO message_templates (code, name_ar, description, channel, body_ar, variables, category) VALUES
(
  'booking_confirmation',
  'تأكيد الحجز',
  'يُرسَل تلقائياً للعميلة فور إتمام الحجز',
  'whatsapp',
  E'🌸 أهلاً بكِ يا {{customer_name}}\n\nتمّ تأكيد حجزكِ في Be First Lady:\n\n📅 التاريخ: {{booking_date}}\n⏰ الوقت: {{booking_time}}\n💆‍♀️ الخدمات: {{services}}\n💰 الإجمالي: {{total}} ر.س\n\nرقم الحجز: {{booking_number}}\n\nنتشرّف بخدمتكِ · نراكِ قريباً 💛',
  ARRAY['customer_name', 'booking_date', 'booking_time', 'services', 'total', 'booking_number'],
  'booking'
),
(
  'booking_reminder_24h',
  'تذكير قبل 24 ساعة',
  'تذكير آلي قبل الحجز بيوم',
  'whatsapp',
  E'🌼 صباحك جميل {{customer_name}}\n\nهذا تذكير بموعدكِ غداً في Be First Lady:\n\n📅 {{booking_date}}\n⏰ {{booking_time}}\n💆‍♀️ {{services}}\n\nنتطلّع لاستقبالكِ · لو احتجتِ تعديل · راسلينا 💛',
  ARRAY['customer_name', 'booking_date', 'booking_time', 'services'],
  'reminder'
),
(
  'booking_reminder_1h',
  'تذكير قبل ساعة',
  'تذكير آلي قبل الحجز بساعة',
  'whatsapp',
  E'✨ {{customer_name}}\n\nموعدكِ بعد ساعة في Be First Lady.\n\n⏰ {{booking_time}}\n📍 {{address}}\n\nحبيباتنا بانتظاركِ 💛',
  ARRAY['customer_name', 'booking_time', 'address'],
  'reminder'
),
(
  'gift_card_delivery',
  'تسليم بطاقة هديّة',
  'يُرسَل للمستلمة عند إصدار بطاقة هديّة باسمها',
  'whatsapp',
  E'🎁 {{recipient_name}}\n\nعندكِ هديّة فاخرة من {{sender_name}} 💛\n\n💳 كود البطاقة: {{gift_code}}\n💰 القيمة: {{amount}} ر.س\n📆 صالحة حتى: {{expires_at}}\n\nرسالتها لكِ:\n"{{message}}"\n\nاستخدمي الكود في موقع Be First Lady للحجز.',
  ARRAY['recipient_name', 'sender_name', 'gift_code', 'amount', 'expires_at', 'message'],
  'gift'
),
(
  'booking_cancelled',
  'إلغاء الحجز',
  'إشعار العميلة عند إلغاء حجزها',
  'whatsapp',
  E'🌙 {{customer_name}}\n\nتمّ إلغاء حجزكِ رقم {{booking_number}}:\n📅 {{booking_date}} · {{booking_time}}\n\nلو كنتِ تبغين تعيدين الحجز في وقت ثاني · نحن بانتظاركِ 💛',
  ARRAY['customer_name', 'booking_number', 'booking_date', 'booking_time'],
  'booking'
),
(
  'birthday_coupon',
  'عرض عيد الميلاد',
  'يُرسَل في عيد ميلاد العميلة',
  'whatsapp',
  E'🎂 كل عام وأنتِ أجمل {{customer_name}} 💛\n\nهديّة Be First Lady لعيد ميلادكِ:\n\n🎁 كوبون خصم {{discount}}%\nالكود: {{coupon_code}}\nصالح لمدّة {{valid_days}} أيّام\n\nدلّلي نفسكِ · أنتِ تستحقّين ✨',
  ARRAY['customer_name', 'discount', 'coupon_code', 'valid_days'],
  'marketing'
)
ON CONFLICT (code) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 2. banners — بنرات الصفحة الرئيسيّة (قابلة للتدوير)
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS banners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  subtitle        TEXT,
  cta_text        TEXT DEFAULT 'احجزي الآن',
  cta_href        TEXT DEFAULT '/booking',

  -- نوع البنر: theme (قوالب جاهزة) · image (صورة مخصّصة) · html (HTML custom)
  banner_type     TEXT NOT NULL DEFAULT 'theme'
                  CHECK (banner_type IN ('theme', 'image', 'html')),

  -- للـtheme: رقم الثيم (1-5)
  theme_id        INTEGER CHECK (theme_id BETWEEN 1 AND 5),

  -- للـimage: رابط الصورة (1920x1080 مُوصى به)
  image_url       TEXT,
  image_alt       TEXT,

  -- للـhtml: كود HTML خام (iframe أو div)
  html_content    TEXT,

  -- التدوير
  display_order   INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  starts_at       TIMESTAMPTZ,    -- بداية العرض · NULL = فوراً
  ends_at         TIMESTAMPTZ,    -- نهاية العرض · NULL = للأبد

  -- إحصائيّات
  clicks_count    INTEGER DEFAULT 0,
  impressions     INTEGER DEFAULT 0,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_banners_order ON banners(display_order);

ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_banners" ON banners;
CREATE POLICY "public_read_active_banners"
  ON banners FOR SELECT
  USING (
    is_active = TRUE
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (ends_at IS NULL OR ends_at >= NOW())
  );

DROP POLICY IF EXISTS "managers_manage_banners" ON banners;
CREATE POLICY "managers_manage_banners"
  ON banners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('owner', 'manager')
    )
  );

-- ─── بنرات افتراضيّة (5 ثيمات) ────────────────────────────
INSERT INTO banners (title, subtitle, cta_text, cta_href, banner_type, theme_id, display_order, is_active) VALUES
('خلّي التوتر يذوب', 'مساج استرخاء فاخر بأيدي خبيرات', 'احجزي الآن', '/services#massage', 'theme', 1, 1, TRUE),
('باقة العناية المثاليّة', 'مساج + مانيكير + باديكير · عرض مميّز', 'شاهدي البكجات', '/packages', 'theme', 2, 2, TRUE),
('عناية الملكات', 'طقوس جمال فاخرة تحتفي بأنوثتكِ', 'ابدئي رحلتكِ', '/booking', 'theme', 3, 3, TRUE),
('أظافر فاخرة', 'تصاميم عصريّة · ألوان راقية', 'احجزي موعدكِ', '/services#nails', 'theme', 4, 4, TRUE),
('إطلالة العرايس', 'ميك اب · شعر · حناء · كل ما تحتاجينه', 'جربي خدماتنا', '/services', 'theme', 5, 5, TRUE)
ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- 3. backup_configs — إعدادات النسخ الاحتياطيّة
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS backup_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider        TEXT NOT NULL CHECK (provider IN ('google_drive', 'onedrive', 'dropbox', 's3', 'manual')),
  is_active       BOOLEAN DEFAULT FALSE,

  -- الجدول الزمني
  schedule        TEXT DEFAULT 'daily' CHECK (schedule IN ('daily', 'weekly', 'monthly', 'manual')),
  time_of_day     TIME DEFAULT '03:00',   -- وقت التنفيذ (UTC)

  -- بيانات الاتّصال (مشفّرة في الـapp layer)
  credentials     JSONB,     -- refresh_token · client_id · folder_id · bucket · etc
  folder_path     TEXT DEFAULT 'BeFirstLady/Backups',

  -- ماذا نشمل
  include_db      BOOLEAN DEFAULT TRUE,
  include_uploads BOOLEAN DEFAULT TRUE,
  retention_days  INTEGER DEFAULT 30,

  last_run_at     TIMESTAMPTZ,
  last_status     TEXT,
  last_error      TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE backup_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners_only_backup_config" ON backup_configs;
CREATE POLICY "owners_only_backup_config"
  ON backup_configs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'owner'
    )
  );

-- ═══════════════════════════════════════════════════════════
-- 4. backup_runs — سجلّ النسخ الاحتياطيّة
-- ═══════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS backup_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id       UUID REFERENCES backup_configs(id) ON DELETE SET NULL,
  provider        TEXT NOT NULL,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  status          TEXT NOT NULL DEFAULT 'running'
                  CHECK (status IN ('running', 'success', 'failed', 'cancelled')),
  size_bytes      BIGINT,
  file_url        TEXT,     -- رابط الملف الخارجي (لو أمكن)
  error_message   TEXT,
  stats           JSONB,    -- عدد السجلات · المدة · ...
  triggered_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  trigger_type    TEXT DEFAULT 'auto' CHECK (trigger_type IN ('auto', 'manual'))
);

CREATE INDEX IF NOT EXISTS idx_backup_runs_status ON backup_runs(status);
CREATE INDEX IF NOT EXISTS idx_backup_runs_started ON backup_runs(started_at DESC);

ALTER TABLE backup_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners_read_backup_runs" ON backup_runs;
CREATE POLICY "owners_read_backup_runs"
  ON backup_runs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'owner'
    )
  );

NOTIFY pgrst, 'reload schema';
