/**
 * POST /api/attendance/checkout
 * - يُغلق آخر سجل حضور مفتوح
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { isWithinRadius, formatDistance } from '@/lib/geo';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'سجّلي دخولكِ أولاً' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['staff', 'manager', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'الحضور متاح للموظفات فقط' }, { status: 403 });
  }

  const { latitude, longitude, accuracy } = await req.json();

  // جلب آخر سجل مفتوح
  const { data: open } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('user_id', user.id)
    .is('check_out_at', null)
    .order('check_in_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!open) {
    return NextResponse.json({ error: 'ما فيه سجل حضور مفتوح' }, { status: 400 });
  }

  // تحقّق من الموقع (اختياري — نسمح لكن ننبّه)
  let distanceInfo = null;
  if (typeof latitude === 'number' && typeof longitude === 'number') {
    const { data: location } = await supabase
      .from('salon_locations')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (location) {
      const { inside, distance } = isWithinRadius(
        latitude, longitude,
        Number(location.latitude), Number(location.longitude),
        location.radius_m
      );
      distanceInfo = { distance, inside };
    }
  }

  const { data, error } = await supabase
    .from('attendance_records')
    .update({
      check_out_at: new Date().toISOString(),
      check_out_lat: latitude || null,
      check_out_lng: longitude || null,
      check_out_accuracy_m: accuracy ? Math.round(accuracy) : null,
    })
    .eq('id', open.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // احسب الساعات
  const minutes = Math.round((new Date(data.check_out_at).getTime() - new Date(data.check_in_at).getTime()) / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return NextResponse.json({
    ok: true,
    record: data,
    duration: { hours, minutes: mins, total_minutes: minutes },
    message: `تم تسجيل انصرافكِ · عملتِ ${hours}س ${mins}د اليوم 💛`,
  });
}
