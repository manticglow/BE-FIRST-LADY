/**
 * GET /api/attendance/status
 * - الحالة الحالية + سجلّ الأسبوع
 * - موقع الصالون للعرض على الموظفة
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  // تحقّق — الحضور للموظفات فقط
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['staff', 'manager', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'الحضور متاح للموظفات فقط' }, { status: 403 });
  }

  // الحضور المفتوح الحالي
  const { data: openRecord } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('user_id', user.id)
    .is('check_out_at', null)
    .order('check_in_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // سجلّ آخر 14 يوم
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const { data: history } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('user_id', user.id)
    .gte('check_in_at', twoWeeksAgo.toISOString())
    .order('check_in_at', { ascending: false })
    .limit(50);

  // موقع الصالون
  const { data: location } = await supabase
    .from('salon_locations')
    .select('name, address, latitude, longitude, radius_m')
    .eq('is_active', true)
    .limit(1)
    .single();

  // إحصائيات الأسبوع
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const weekRecords = (history || []).filter(
    (r) => new Date(r.check_in_at) >= weekStart && r.total_minutes
  );
  const weekMinutes = weekRecords.reduce((s, r) => s + (r.total_minutes || 0), 0);

  return NextResponse.json({
    open: openRecord,
    location,
    history: history || [],
    stats: {
      week_hours: Math.floor(weekMinutes / 60),
      week_minutes: weekMinutes % 60,
      week_days: weekRecords.length,
    },
  });
}
