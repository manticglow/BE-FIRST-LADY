-- ═══════════════════════════════════════════════════════════
-- 008 — إعدادات الضريبة والفوترة (ZATCA)
-- ═══════════════════════════════════════════════════════════

-- جدول إعدادات المنشأة التجارية (مطابق لمتطلبات ZATCA)
CREATE TABLE IF NOT EXISTS tax_settings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- بيانات المنشأة
  business_name_ar  TEXT NOT NULL DEFAULT 'Be First Lady',
  business_name_en  TEXT,
  commercial_reg    TEXT,              -- السجل التجاري
  vat_number        TEXT,              -- الرقم الضريبي (15 رقم)
  address           TEXT,
  city              TEXT DEFAULT 'المدينة المنوّرة',

  -- إعدادات الضريبة
  apply_vat         BOOLEAN DEFAULT FALSE,  -- هل نطبّق VAT؟
  vat_rate          NUMERIC(5,2) DEFAULT 15.00,  -- النسبة (15% في السعودية)
  prices_include_vat BOOLEAN DEFAULT TRUE,  -- الأسعار شاملة الضريبة؟

  -- إعدادات الفاتورة
  invoice_prefix    TEXT DEFAULT 'INV',   -- بادئة رقم الفاتورة
  invoice_counter   INTEGER DEFAULT 1,     -- عدّاد

  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- أضيفي سجل افتراضي (بدون VAT في البداية — تفعّلها لاحقاً)
INSERT INTO tax_settings (business_name_ar, apply_vat, vat_rate, prices_include_vat)
SELECT 'Be First Lady · صالون السيدة الأولى', FALSE, 15.00, TRUE
WHERE NOT EXISTS (SELECT 1 FROM tax_settings);

-- RLS: الكل يقرأ، الأدمن يعدّل
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read tax settings" ON tax_settings;
DROP POLICY IF EXISTS "Admin manage tax settings" ON tax_settings;

CREATE POLICY "Public read tax settings" ON tax_settings
  FOR SELECT TO anon, authenticated USING (TRUE);

CREATE POLICY "Admin manage tax settings" ON tax_settings
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- أضف حقول للفاتورة
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS invoice_number TEXT,
  ADD COLUMN IF NOT EXISTS invoice_issued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS vat_rate_applied NUMERIC(5,2);
