/**
 * POST /api/attendance/checkin
 * Body: { latitude, longitude, accuracy }
 * - يتحقق من الموقع (geofence)
 * - يرفض إذا خارج النطاق
 * - يرفض إذا فيه حضور مفتوح لنفس اليوم
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { isWithinRadius, formatDistance } from '@/lib/geo';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'سجّلي دخولكِ أولاً' }, { status: 401 });

  // تحقّقي من الدور — فقط staff/manager/owner
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['staff', 'manager', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'الحضور متاح للموظفات فقط' }, { status: 403 });
  }

  const { latitude, longitude, accuracy } = await req.json();
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return NextResponse.json({ error: 'الموقع مطلوب' }, { status: 400 });
  }

  // جلب موقع الصالون
  const { data: location } = await supabase
    .from('salon_locations')
    .select('*')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!location) return NextResponse.json({ error: 'موقع الصالون غير محدّد' }, { status: 500 });

  // تحقّق من المسافة
  const { inside, distance } = isWithinRadius(
    latitude, longitude,
    Number(location.latitude), Number(location.longitude),
    location.radius_m
  );

  if (!inside) {
    return NextResponse.json({
      error: `أنتِ خارج نطاق الصالون (تبعد ${formatDistance(distance)} عن الموقع المسموح)`,
      distance,
      allowed_radius: location.radius_m,
    }, { status: 403 });
  }

  // تحقّق — ما فيه حضور مفتوح
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { data: open } = await supabase
    .from('attendance_records')
    .select('id')
    .eq('user_id', user.id)
    .is('check_out_at', null)
    .gte('check_in_at', todayStart.toISOString())
    .maybeSingle();

  if (open) {
    return NextResponse.json({ error: 'لديكِ حضور مفتوح بالفعل — اضغطي "انصراف" أولاً' }, { status: 400 });
  }

  // أنشئ السجل
  const { data, error } = await supabase.from('attendance_records').insert({
    user_id: user.id,
    check_in_at: new Date().toISOString(),
    check_in_lat: latitude,
    check_in_lng: longitude,
    check_in_accuracy_m: accuracy ? Math.round(accuracy) : null,
    location_id: location.id,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    record: data,
    distance,
    message: `تم تسجيل حضوركِ ✨ على بعد ${formatDistance(distance)} من المركز`,
  });
}
