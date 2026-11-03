/**
 * StaffMobileData — Server wrapper
 * يجلب كل البيانات ثم يسلّمها لـStaffMobileApp (client).
 */
import { createClient } from '@/lib/supabase/server';
import StaffMobileApp from './StaffMobileApp';
import type { StaffBooking, AttendanceState } from './types';

interface Props {
  userId: string;
  firstName: string;
}

type BookingRow = {
  id: string;
  booking_number: string | null;
  booking_date: string;
  booking_time: string;
  duration_min: number;
  customer_name: string;
  customer_phone: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  payment_status: string;
  total: number;
  items?: { service_name: string; price: number; duration_min: number }[];
};

type ProfileRow = { full_name: string | null; avatar_url: string | null };
type StaffRow = { id: string };
type AttendanceRow = { check_in_at: string; check_out_at: string | null; total_minutes: number | null };
type LocationRow = { name: string | null };

export default async function StaffMobileData({ userId, firstName }: Props) {
  const supabase = await createClient();

  // التواريخ
  const todayStr = new Date().toISOString().split('T')[0];
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  // staff id
  const { data: staffRaw } = await supabase
    .from('staff')
    .select('id')
    .eq('profile_id', userId)
    .maybeSingle();
  const staffId = (staffRaw as StaffRow | null)?.id || null;

  // profile
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', userId)
    .single();
  const profile = profileRaw as ProfileRow | null;

  // الحضور المفتوح
  const { data: openAttendanceRaw } = await supabase
    .from('attendance_records')
    .select('check_in_at, check_out_at, total_minutes')
    .eq('user_id', userId)
    .is('check_out_at', null)
    .order('check_in_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const openAttendance = openAttendanceRaw as AttendanceRow | null;

  // الحضور الأسبوعي (للإحصائيات)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { data: weekAttendanceRaw } = await supabase
    .from('attendance_records')
    .select('total_minutes')
    .eq('user_id', userId)
    .gte('check_in_at', sevenDaysAgo.toISOString())
    .not('total_minutes', 'is', null);
  const weekAttendance = (weekAttendanceRaw as AttendanceRow[] | null) || [];
  const weekMinutes = weekAttendance.reduce((s, r) => s + (r.total_minutes || 0), 0);

  // حجوزات (اليوم + الشهر للتاب الثاني)
  let todayBookings: StaffBooking[] = [];
  let allBookings: StaffBooking[] = [];

  if (staffId) {
    const [{ data: todayRaw }, { data: monthRaw }] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, booking_number, booking_date, booking_time, duration_min, customer_name, customer_phone, status, payment_status, total, items:booking_items(service_name, price, duration_min)')
        .eq('staff_id', staffId)
        .eq('booking_date', todayStr)
        .order('booking_time'),
      supabase
        .from('bookings')
        .select('id, booking_number, booking_date, booking_time, duration_min, customer_name, customer_phone, status, payment_status, total, items:booking_items(service_name, price, duration_min)')
        .eq('staff_id', staffId)
        .gte('booking_date', monthStartStr)
        .order('booking_date', { ascending: false }),
    ]);

    todayBookings = (todayRaw as BookingRow[] | null) || [];
    allBookings = (monthRaw as BookingRow[] | null) || [];
  }

  // الموقع
  const { data: locationRaw } = await supabase
    .from('salon_locations')
    .select('name')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  const location = locationRaw as LocationRow | null;

  // الحضور state
  const checkInAt = openAttendance?.check_in_at || null;
  const workedMinutes = checkInAt
    ? Math.floor((Date.now() - new Date(checkInAt).getTime()) / 60000)
    : 0;

  const attendance: AttendanceState = {
    isCheckedIn: !!openAttendance,
    checkInAt,
    workedMinutes,
    weekHours: Math.floor(weekMinutes / 60),
    weekDays: weekAttendance.length,
  };

  return (
    <StaffMobileApp
      user={{
        userId,
        staffId,
        firstName,
        fullName: profile?.full_name || firstName,
        avatarUrl: profile?.avatar_url || null,
      }}
      attendance={attendance}
      locationName={location?.name || null}
      todayBookings={todayBookings}
      allBookings={allBookings}
    />
  );
}
