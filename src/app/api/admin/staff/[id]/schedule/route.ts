/**
 * PUT /api/admin/staff/[id]/schedule
 * Body: { schedule: [{ day_of_week, start_time, end_time, is_off }] }
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'غير مصرح', code: 401 };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return { error: 'للمالكة/المديرة فقط', code: 403 };
  }
  return { error: null, code: 0 };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: staffId } = await params;
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const { schedule } = await req.json();
  if (!Array.isArray(schedule)) {
    return NextResponse.json({ error: 'schedule يجب أن تكون قائمة' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: staffExists } = await admin.from('staff').select('id').eq('id', staffId).single();
  if (!staffExists) {
    return NextResponse.json({ error: 'الموظفة غير موجودة' }, { status: 404 });
  }

  // احذف القديم
  const { error: delErr } = await admin.from('staff_schedule').delete().eq('staff_id', staffId);
  if (delErr) {
    console.error('Schedule delete error:', delErr);
    return NextResponse.json({ error: 'فشل حذف الجدول القديم', details: delErr.message }, { status: 500 });
  }

  // أضف الجديد — فقط الأيام الفعّالة (ليست إجازة ولها أوقات)
  const rows = schedule
    .filter((s: any) => (s.is_off === true) || (s.start_time && s.end_time && s.end_time > s.start_time))
    .map((s: any) => ({
      staff_id: staffId,
      day_of_week: s.day_of_week,
      start_time: s.is_off ? '00:00:00' : s.start_time,
      end_time:   s.is_off ? '00:00:01' : s.end_time,  // قيم رمزية للإجازة
      is_off: s.is_off || false,
    }));

  if (rows.length > 0) {
    const { error: insErr } = await admin.from('staff_schedule').insert(rows);
    if (insErr) {
      console.error('Schedule insert error:', insErr);
      return NextResponse.json({ error: 'فشل حفظ الجدول', details: insErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: staffId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('staff_schedule').select('*').eq('staff_id', staffId).order('day_of_week');
  return NextResponse.json({ schedule: data || [] });
}
