-- ═══════════════════════════════════════════════════════════
-- 003 — خدمة الهدية (Gift Bookings)
-- ═══════════════════════════════════════════════════════════
--
-- السيناريو:
--   عميلة ترغب تحجز لصديقتها/أمها/أختها كهدية —
--   تدفع هي، والمستقبِلة تستلم دعوة فاخرة واتساب فيها رمز QR
--   تدخل فيه الصالون وتحضر الموعد.
-- ═══════════════════════════════════════════════════════════

-- 1) إضافة أعمدة للحجز
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS is_gift          BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS gift_from_name   TEXT,      -- اسم المرسِلة
  ADD COLUMN IF NOT EXISTS gift_from_phone  TEXT,      -- جوال المرسِلة (للتواصل)
  ADD COLUMN IF NOT EXISTS gift_message     TEXT,      -- رسالة شخصية ("من قلبي، أم العيال 💛")
  ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ;  -- وقت إرسال الدعوة

-- 2) السماح للعامة بقراءة الحجز عبر booking_number للدعوات فقط
-- (المستقبِلة ما عندها حساب، فتدخل عبر رابط الدعوة)
CREATE POLICY "Public can view gift bookings by number"
ON bookings FOR SELECT TO anon, authenticated
USING (is_gift = TRUE);

-- 3) السماح بقراءة عناصر الحجز للدعوات
CREATE POLICY "Public can view gift booking items"
ON booking_items FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = booking_id AND b.is_gift = TRUE
  )
);
