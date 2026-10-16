-- ═══════════════════════════════════════════════════════════
-- 005 — نظام الحضور والانصراف (HR Attendance)
-- ═══════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- 1) إعدادات موقع الصالون (geofence)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salon_locations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  address     TEXT,
  latitude    NUMERIC(10,7) NOT NULL,
  longitude   NUMERIC(10,7) NOT NULL,
  radius_m    INTEGER NOT NULL DEFAULT 100,   -- نصف قطر منطقة الحضور (متر)
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- أضيفي موقع افتراضي (المدينة المنوّرة — ستُعدَّل من الإعدادات)
INSERT INTO salon_locations (name, address, latitude, longitude, radius_m)
SELECT 'الصالون الرئيسي', 'المدينة المنوّرة', 24.4686, 39.6142, 150
WHERE NOT EXISTS (SELECT 1 FROM salon_locations);

-- ─────────────────────────────────────────────────────────
-- 2) سجلات الحضور والانصراف
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_records (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  check_in_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_out_at    TIMESTAMPTZ,
  check_in_lat    NUMERIC(10,7),
  check_in_lng    NUMERIC(10,7),
  check_out_lat   NUMERIC(10,7),
  check_out_lng   NUMERIC(10,7),
  check_in_accuracy_m   INTEGER,
  check_out_accuracy_m  INTEGER,
  location_id     UUID REFERENCES salon_locations(id) ON DELETE SET NULL,
  notes           TEXT,
  is_late         BOOLEAN DEFAULT FALSE,  -- حضرت متأخرة؟ (قيّمها Trigger مستقبلاً)
  total_minutes   INTEGER,                 -- يحسب تلقائياً عند الانصراف
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_records(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(check_in_at DESC);

-- Trigger: حدث total_minutes تلقائياً عند الانصراف
CREATE OR REPLACE FUNCTION calc_attendance_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.check_out_at IS NOT NULL AND OLD.check_out_at IS NULL THEN
    NEW.total_minutes := EXTRACT(EPOCH FROM (NEW.check_out_at - NEW.check_in_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attendance_duration ON attendance_records;
CREATE TRIGGER trg_attendance_duration
BEFORE UPDATE ON attendance_records
FOR EACH ROW
EXECUTE FUNCTION calc_attendance_duration();

-- ─────────────────────────────────────────────────────────
-- 3) طلبات الإجازة (للمستقبل — جاهزة)
-- ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  leave_type      TEXT NOT NULL CHECK (leave_type IN ('annual', 'sick', 'emergency', 'unpaid', 'other')),
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  reason          TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  review_note     TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_leave_user ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);

-- ─────────────────────────────────────────────────────────
-- 4) RLS
-- ─────────────────────────────────────────────────────────
ALTER TABLE salon_locations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests      ENABLE ROW LEVEL SECURITY;

-- salon_locations: الكل يقرأ (للتحقق)، الأدمن يُعدِّل
CREATE POLICY "Public read salon location" ON salon_locations FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "Admin manage salon location" ON salon_locations FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- attendance: الموظفة تشوف سجلاتها فقط، الأدمن يشوف الكل
CREATE POLICY "User views own attendance" ON attendance_records FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User inserts own attendance" ON attendance_records FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User updates own attendance" ON attendance_records FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin views all attendance" ON attendance_records FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admin manages all attendance" ON attendance_records FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- leave_requests: الموظفة تنشئ طلباتها، الأدمن يراجع
CREATE POLICY "User views own leaves" ON leave_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User creates own leaves" ON leave_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User cancels own pending leaves" ON leave_requests FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');
CREATE POLICY "Admin views all leaves" ON leave_requests FOR SELECT TO authenticated USING (is_admin());
CREATE POLICY "Admin reviews leaves" ON leave_requests FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());
