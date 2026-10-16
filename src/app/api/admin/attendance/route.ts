/**
 * GET /api/admin/attendance?date=YYYY-MM-DD
 * - كل سجلات الحضور لليوم المحدد
 * - أو اليوم الحالي افتراضياً
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });
  }

  const date = req.nextUrl.searchParams.get('date') || new Date().toISOString().split('T')[0];
  const dayStart = new Date(`${date}T00:00:00`).toISOString();
  const dayEnd = new Date(`${date}T23:59:59`).toISOString();

  const { data } = await supabase
    .from('attendance_records')
    .select('*, user:profiles!attendance_records_user_id_fkey(id, full_name, role)')
    .gte('check_in_at', dayStart)
    .lte('check_in_at', dayEnd)
    .order('check_in_at', { ascending: false });

  return NextResponse.json({ records: data || [] });
}
