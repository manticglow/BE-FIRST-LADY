-- ═══════════════════════════════════════════════════════════
-- The First Lady · البيانات الرسميّة للمنشأة
-- ═══════════════════════════════════════════════════════════
-- يُحدّث جدول tax_settings بالمعلومات الرسميّة من السجل التجاري والعنوان الوطني
-- ═══════════════════════════════════════════════════════════

-- 1. التأكّد من وجود أعمدة إضافيّة للمعلومات التفصيليّة
ALTER TABLE tax_settings
  ADD COLUMN IF NOT EXISTS national_address_short TEXT,     -- العنوان المختصر (DMAC3146)
  ADD COLUMN IF NOT EXISTS building_number TEXT,            -- رقم المبنى
  ADD COLUMN IF NOT EXISTS street_name TEXT,                -- اسم الشارع
  ADD COLUMN IF NOT EXISTS district TEXT,                   -- الحي
  ADD COLUMN IF NOT EXISTS secondary_number TEXT,           -- الرقم الفرعي
  ADD COLUMN IF NOT EXISTS postal_code TEXT,                -- الرمز البريدي
  ADD COLUMN IF NOT EXISTS phone TEXT,                      -- الجوّال/هاتف الصالون
  ADD COLUMN IF NOT EXISTS email TEXT;                      -- الإيميل الرسمي

-- 2. تحديث السجل الحالي بالبيانات الرسميّة
UPDATE tax_settings
SET
  business_name_ar       = 'مشغل السيدة الأولى',
  business_name_en       = 'alSayyida alOula Salon',
  commercial_reg         = '7013767020',
  -- الرقم الضريبي · 15 رقم · يُحدّث بعد تسجيل VAT
  vat_number             = NULL,
  apply_vat              = FALSE,  -- مفعّل بعد الحصول على VAT

  -- العنوان الوطني الكامل
  address                = 'شارع يزيد بن الحكم الثقفي · حي الراية · المدينة المنوّرة',
  city                   = 'المدينة المنوّرة',
  national_address_short = 'DMAC3146',
  building_number        = '3146',
  street_name            = 'يزيد بن الحكم الثقفي',
  district               = 'حي الراية',
  secondary_number       = '8449',
  postal_code            = '42312',

  -- بيانات التواصل (تُحدّث لاحقاً)
  phone                  = NULL,
  email                  = NULL,

  invoice_prefix         = 'TFL',
  updated_at             = NOW()
WHERE is_active = TRUE;

-- 3. لو ما في سجل · أنشئي واحد
INSERT INTO tax_settings (
  business_name_ar, business_name_en, commercial_reg,
  address, city, national_address_short, building_number,
  street_name, district, secondary_number, postal_code,
  apply_vat, vat_rate, prices_include_vat,
  invoice_prefix, is_active
)
SELECT
  'مشغل السيدة الأولى',
  'alSayyida alOula Salon',
  '7013767020',
  'شارع يزيد بن الحكم الثقفي · حي الراية · المدينة المنوّرة',
  'المدينة المنوّرة',
  'DMAC3146',
  '3146',
  'يزيد بن الحكم الثقفي',
  'حي الراية',
  '8449',
  '42312',
  FALSE,
  15.00,
  TRUE,
  'TFL',
  TRUE
WHERE NOT EXISTS (SELECT 1 FROM tax_settings WHERE is_active = TRUE);

-- 4. تعليقات توضيحيّة
COMMENT ON COLUMN tax_settings.commercial_reg IS 'الرقم الوطني الموحد من السجل التجاري (10 أرقام)';
COMMENT ON COLUMN tax_settings.vat_number IS 'الرقم الضريبي · 15 رقم · يُحدّث بعد تسجيل VAT في ZATCA';
COMMENT ON COLUMN tax_settings.national_address_short IS 'العنوان الوطني المختصر (4 أحرف + 4 أرقام)';

-- 5. تحقّق نهائي
SELECT
  business_name_ar AS "الاسم",
  commercial_reg AS "السجل",
  vat_number AS "VAT",
  national_address_short AS "العنوان المختصر",
  city AS "المدينة"
FROM tax_settings
WHERE is_active = TRUE;
