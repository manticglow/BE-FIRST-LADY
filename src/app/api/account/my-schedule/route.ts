/**
 * GET /api/account/my-schedule
 * - جدول العمل الأسبوعي للموظّفة
 * - الإجازات والطلبات القادمة
 * - الحجوزات القادمة لها خلال الأسبوع القادم
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

type ScheduleRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_off: boolean;
};
type LeaveRow = {
  start_date: string;
  end_date: string;
  leave_type: string;
  status: string;
};
type BookingLite = {
  id: string;
  booking_date: string;
  booking_time: string;
  duration_min: number;
  customer_name: string;
  status: string;
};

const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  // staff record
  const { data: staffRaw } = await supabase
    .from('staff')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle();
  const staffId = (staffRaw as { id: string } | null)?.id;

  // الجدول الأسبوعي (ساعات العمل)
  let weekSchedule: ScheduleRow[] = [];
  let upcomingBookings: BookingLite[] = [];
  if (staffId) {
    const { data: schedRaw } = await supabase
      .from('staff_schedule')
      .select('day_of_week, start_time, end_time, is_off')
      .eq('staff_id', staffId)
      .order('day_of_week');
    weekSchedule = (schedRaw as ScheduleRow[] | null) || [];

    // الحجوزات القادمة لها (7 أيّام)
    const today = new Date().toISOString().split('T')[0];
    const weekAhead = new Date();
    weekAhead.setDate(weekAhead.getDate() + 7);
    const weekAheadStr = weekAhead.toISOString().split('T')[0];

    const { data: bookingsRaw } = await supabase
      .from('bookings')
      .select('id, booking_date, booking_time, duration_min, customer_name, status')
      .eq('staff_id', staffId)
      .gte('booking_date', today)
      .lte('booking_date', weekAheadStr)
      .not('status', 'in', '(cancelled,no_show)')
      .order('booking_date')
      .order('booking_time');
    upcomingBookings = (bookingsRaw as BookingLite[] | null) || [];
  }

  // الإجازات القادمة المعتمدة
  const today = new Date().toISOString().split('T')[0];
  const { data: leavesRaw } = await supabase
    .from('leave_requests')
    .select('start_date, end_date, leave_type, status')
    .eq('user_id', user.id)
    .gte('end_date', today)
    .in('status', ['approved', 'pending']);
  const upcomingLeaves = (leavesRaw as LeaveRow[] | null) || [];

  // بناء الأيّام (7 أيّام قادمة)
  const days: {
    date: string;
    day_name: string;
    day_of_week: number;
    is_off: boolean;
    start_time: string | null;
    end_time: string | null;
    bookings_count: number;
    leave_status: string | null;
  }[] = [];

  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dow = d.getDay(); // 0 = Sunday
    const sched = weekSchedule.find((s) => s.day_of_week === dow);
    const bookingsCount = upcomingBookings.filter((b) => b.booking_date === dateStr).length;
    const leave = upcomingLeaves.find((l) => dateStr >= l.start_date && dateStr <= l.end_date);

    days.push({
      date: dateStr,
      day_name: DAY_NAMES[dow],
      day_of_week: dow,
      is_off: sched?.is_off ?? false,
      start_time: sched?.start_time || null,
      end_time: sched?.end_time || null,
      bookings_count: bookingsCount,
      leave_status: leave?.status || null,
    });
  }

  return NextResponse.json({
    ok: true,
    days,
    upcoming_leaves: upcomingLeaves,
    week_bookings_count: upcomingBookings.length,
  });
}
