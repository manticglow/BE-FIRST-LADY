-- ═══════════════════════════════════════════════════════════
-- 006 — تحصين النظام والمنطق
-- ═══════════════════════════════════════════════════════════
-- - منع تعارض الحجوزات مع نفس الموظفة (DB-level)
-- - validation للسعة
-- - validation لجدولة الموظفة
-- - منع إساءة استخدام الكوبونات (atomic increment)
-- - منع الهدية لنفس الشخص
-- - إصلاحات صغيرة
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- 1) منع حجزين لنفس الموظفة في نفس الوقت
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_booking_conflict()
RETURNS TRIGGER AS $$
DECLARE
  conflicts INTEGER;
BEGIN
  -- فقط إذا الحجز غير ملغي ومرتبط بموظفة محددة
  IF NEW.status IN ('cancelled', 'no_show') OR NEW.staff_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO conflicts
  FROM bookings
  WHERE staff_id = NEW.staff_id
    AND booking_date = NEW.booking_date
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND status NOT IN ('cancelled', 'no_show')
    AND (
      -- تداخل زمني
      (NEW.booking_time, (NEW.booking_time + (NEW.duration_min || ' minutes')::INTERVAL)::TIME)
      OVERLAPS
      (booking_time, (booking_time + (duration_min || ' minutes')::INTERVAL)::TIME)
    );

  IF conflicts > 0 THEN
    RAISE EXCEPTION 'الموظفة لديها حجز آخر في هذا الوقت';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_conflict ON bookings;
CREATE TRIGGER trg_booking_conflict
BEFORE INSERT OR UPDATE OF booking_time, booking_date, staff_id, duration_min
ON bookings
FOR EACH ROW
EXECUTE FUNCTION check_booking_conflict();

-- ─────────────────────────────────────────────────────────
-- 2) التحقق من جدولة الموظفة (end > start)
-- ─────────────────────────────────────────────────────────
ALTER TABLE staff_schedule
  DROP CONSTRAINT IF EXISTS valid_schedule_times;
ALTER TABLE staff_schedule
  ADD CONSTRAINT valid_schedule_times
  CHECK (is_off = TRUE OR end_time > start_time);

-- ─────────────────────────────────────────────────────────
-- 3) زيادة used_count للكوبون atomically (منع race condition)
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION use_coupon(p_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  updated_rows INTEGER;
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE UPPER(code) = UPPER(p_code)
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR used_count < max_uses);

  GET DIAGNOSTICS updated_rows = ROW_COUNT;
  RETURN updated_rows > 0;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────
-- 4) منع إهداء النفس (gift_from_phone != customer_phone)
-- ─────────────────────────────────────────────────────────
ALTER TABLE bookings
  DROP CONSTRAINT IF EXISTS no_self_gift;
ALTER TABLE bookings
  ADD CONSTRAINT no_self_gift
  CHECK (
    is_gift = FALSE
    OR gift_from_phone IS NULL
    OR customer_phone IS NULL
    OR REGEXP_REPLACE(gift_from_phone, '[^0-9]', '', 'g') != REGEXP_REPLACE(customer_phone, '[^0-9]', '', 'g')
  );

-- ─────────────────────────────────────────────────────────
-- 5) التحقق من رقم الجوال السعودي
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION valid_saudi_phone(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  IF phone IS NULL THEN RETURN TRUE; END IF;
  -- احذف كل الأحرف غير الرقمية
  RETURN REGEXP_REPLACE(phone, '[^0-9]', '', 'g') ~ '^(966|0)?5[0-9]{8}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ─────────────────────────────────────────────────────────
-- 6) منع تسجيل حضور ثاني إذا فيه مفتوح (DB-level)
-- ─────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_open_attendance
ON attendance_records (user_id)
WHERE check_out_at IS NULL;

-- ─────────────────────────────────────────────────────────
-- 7) منع تقييمين لنفس الحجز
-- ─────────────────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_booking_review
ON reviews (booking_id)
WHERE booking_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────
-- 8) تأكد: السعر لا يكون سالب
-- ─────────────────────────────────────────────────────────
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_price_check;
ALTER TABLE services ADD CONSTRAINT services_price_check CHECK (price >= 0);

ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_price_check;
ALTER TABLE packages ADD CONSTRAINT packages_price_check CHECK (price >= 0);

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_total_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_total_check CHECK (total >= 0);

-- ─────────────────────────────────────────────────────────
-- 9) تأكد: مدة الخدمة موجبة
-- ─────────────────────────────────────────────────────────
ALTER TABLE services DROP CONSTRAINT IF EXISTS services_duration_check;
ALTER TABLE services ADD CONSTRAINT services_duration_check CHECK (duration_min > 0 AND duration_min <= 480);

-- ─────────────────────────────────────────────────────────
-- 10) تأكد: تاريخ الحجز في المستقبل أو اليوم
-- (لا نضيف CHECK لأن الحجوزات القديمة تمر هنا — نترك التحقق في API)
-- ─────────────────────────────────────────────────────────
