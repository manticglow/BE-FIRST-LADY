/**
 * GET  /api/leaves — طلبات إجازة الموظفة الحالية
 * POST /api/leaves — تقديم طلب جديد
 * DELETE /api/leaves?id= — إلغاء طلب معلّق
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const leaveSchema = z.object({
  leave_type: z.enum(['annual', 'sick', 'emergency', 'unpaid', 'other']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(500).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ leaves: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  // الطلب للموظفات فقط
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['staff', 'manager', 'owner'].includes(profile.role)) {
    return NextResponse.json({ error: 'طلبات الإجازة للموظفات فقط' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = leaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'بيانات غير صحيحة' }, { status: 400 });
  }

  if (parsed.data.end_date < parsed.data.start_date) {
    return NextResponse.json({ error: 'تاريخ النهاية يجب أن يكون بعد البداية' }, { status: 400 });
  }

  const { data, error } = await supabase.from('leave_requests').insert({
    user_id: user.id,
    leave_type: parsed.data.leave_type,
    start_date: parsed.data.start_date,
    end_date: parsed.data.end_date,
    reason: parsed.data.reason || null,
    status: 'pending',
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ leave: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

  // فقط المعلّق يمكن إلغاؤه
  const { data: leave } = await supabase.from('leave_requests').select('user_id, status').eq('id', id).single();
  if (!leave || leave.user_id !== user.id) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }
  if (leave.status !== 'pending') {
    return NextResponse.json({ error: 'لا يمكن إلغاء الطلبات المُراجَعة' }, { status: 400 });
  }

  await supabase.from('leave_requests').update({ status: 'cancelled' }).eq('id', id);
  return NextResponse.json({ ok: true });
}
