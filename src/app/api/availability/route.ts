/**
 * GET /api/availability?date=2026-10-15&duration=60&staff_id=xxx
 * ═══════════════════════════════════════════════════════════
 * المواعيد المتاحة فعلاً:
 *   - خلال ساعات دوام الموظفة (إذا حُدِّدت)
 *   - أو ساعات عمل الصالون العامة
 *   - خصم الحجوزات القائمة (للموظفة أو للصالون)
 *   - استبعاد أيام الإغلاق
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const SLOT_INTERVAL = 30;
const CONCURRENT_CAPACITY_GENERAL = 3;  // بدون موظفة محددة

export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get('date');
  const duration = Number(req.nextUrl.searchParams.get('duration') || 60);
  const staffId = req.nextUrl.searchParams.get('staff_id') || null;

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'التاريخ غير صحيح' }, { status: 400 });
  }

  const supabase = await createClient();
  const dayOfWeek = new Date(date + 'T00:00:00').getDay();

  // أيام الإغلاق (عام + للموظفة إن حُدِّدت)
  const { data: blocked } = await supabase
    .from('blocked_dates')
    .select('*')
    .eq('date', date);

  const generalBlocked = (blocked || []).filter((b) => !b.staff_id);
  const staffBlocked = staffId ? (blocked || []).filter((b) => b.staff_id === staffId) : [];
  if (generalBlocked.some((b) => b.all_day) || staffBlocked.some((b) => b.all_day)) {
    const reason = generalBlocked[0]?.reason || staffBlocked[0]?.reason || 'مغلق';
    return NextResponse.json({ date, slots: [], closed: true, reason });
  }

  // النطاق الزمني
  let earliest: number, latest: number;

  if (staffId) {
    // استخدم جدول الموظفة لهذا اليوم
    const { data: schedule } = await supabase
      .from('staff_schedule')
      .select('*')
      .eq('staff_id', staffId)
      .eq('day_of_week', dayOfWeek)
      .single();

    if (!schedule || schedule.is_off) {
      return NextResponse.json({ date, slots: [], closed: true, reason: 'الاختصاصية غير متواجدة في هذا اليوم' });
    }
    earliest = timeToMinutes(schedule.start_time);
    latest = timeToMinutes(schedule.end_time);
    if (latest === 0) latest = 24 * 60;
  } else {
    // استخدم ساعات الصالون العامة
    const { data: hours } = await supabase.from('hours').select('*');
    const openTimes = (hours || []).map((h) => timeToMinutes(h.open_time));
    const closeTimes = (hours || []).map((h) => {
      const close = timeToMinutes(h.close_time);
      return close === 0 ? 24 * 60 : close;
    });
    if (openTimes.length === 0) {
      earliest = 10 * 60;
      latest = 22 * 60;
    } else {
      earliest = Math.min(...openTimes);
      latest = Math.max(...closeTimes);
    }
  }

  // الحجوزات القائمة
  let bookingsQuery = supabase
    .from('bookings')
    .select('booking_time, duration_min, staff_id')
    .eq('booking_date', date)
    .not('status', 'in', '(cancelled,no_show)');

  if (staffId) {
    bookingsQuery = bookingsQuery.eq('staff_id', staffId);
  }

  const { data: bookings } = await bookingsQuery;

  const capacity = staffId ? 1 : CONCURRENT_CAPACITY_GENERAL;

  // ولّد الفترات
  const slots: { time: string; available: boolean; slotsLeft: number }[] = [];
  for (let min = earliest; min + duration <= latest; min += SLOT_INTERVAL) {
    const timeStr = minutesToTime(min);

    const overlapping = (bookings || []).filter((b) => {
      const bStart = timeToMinutes(b.booking_time);
      const bEnd = bStart + b.duration_min;
      return bStart < min + duration && bEnd > min;
    }).length;

    const slotsLeft = capacity - overlapping;
    slots.push({
      time: timeStr,
      available: slotsLeft > 0,
      slotsLeft: Math.max(0, slotsLeft),
    });
  }

  // استبعد الماضي
  const today = new Date().toISOString().split('T')[0];
  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const filtered = date === today
    ? slots.filter((s) => timeToMinutes(s.time) > nowMinutes + 60)
    : slots;

  return NextResponse.json({
    date,
    slots: filtered,
    totalCapacity: capacity,
    staffId,
  });
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
