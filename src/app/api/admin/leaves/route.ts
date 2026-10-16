/**
 * GET  /api/admin/leaves — كل طلبات الإجازات
 * PATCH /api/admin/leaves — موافقة/رفض
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'غير مصرح', code: 401, userId: null };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return { error: 'للمالكة/المديرة فقط', code: 403, userId: null };
  }
  return { error: null, code: 0, userId: user.id };
}

export async function GET() {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const admin = createAdminClient();
  const { data } = await admin
    .from('leave_requests')
    .select('*, user:profiles!leave_requests_user_id_fkey(id, full_name, role)')
    .order('created_at', { ascending: false });

  return NextResponse.json({ leaves: data || [] });
}

export async function PATCH(req: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const { id, status, review_note } = await req.json();
  if (!id || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from('leave_requests').update({
    status,
    reviewed_by: check.userId,
    reviewed_at: new Date().toISOString(),
    review_note: review_note || null,
  }).eq('id', id).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // لو موافقة — نضيف الأيام إلى blocked_dates للموظفة
  if (status === 'approved' && data) {
    const { data: staff } = await admin.from('staff').select('id').eq('profile_id', data.user_id).maybeSingle();
    if (staff) {
      const blocks = [];
      let d = new Date(data.start_date);
      const end = new Date(data.end_date);
      while (d <= end) {
        blocks.push({
          date: d.toISOString().split('T')[0],
          reason: `إجازة — ${data.leave_type}`,
          all_day: true,
          staff_id: staff.id,
        });
        d.setDate(d.getDate() + 1);
      }
      if (blocks.length > 0) {
        await admin.from('blocked_dates').insert(blocks);
      }
    }
  }

  return NextResponse.json({ leave: data });
}
