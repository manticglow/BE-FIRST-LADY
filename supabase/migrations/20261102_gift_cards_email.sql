-- ═══════════════════════════════════════════════════════════
-- 📧 Gift Cards · إضافة حقل الإيميل للمستلمة
-- ═══════════════════════════════════════════════════════════
-- يُسمح للمالكة بإرسال البطاقة عبر الإيميل كبديل للواتساب

ALTER TABLE gift_cards
  ADD COLUMN IF NOT EXISTS recipient_email TEXT;

-- Index للبحث السريع عن البطاقات المُرسَلة لإيميل محدّد
CREATE INDEX IF NOT EXISTS idx_gift_cards_recipient_email
  ON gift_cards (recipient_email)
  WHERE recipient_email IS NOT NULL;

COMMENT ON COLUMN gift_cards.recipient_email IS 'إيميل المستلمة · لإرسال البطاقة عبر الإيميل كبديل للواتساب';
