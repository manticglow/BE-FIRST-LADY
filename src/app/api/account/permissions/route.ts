/**
 * GET /api/account/permissions — طلبات الإذن الخاصّة بالمستخدم
 * POST                        — إنشاء طلب إذن جديد
 * DELETE                      — إلغاء طلب (لها فقط · فقط لو pending)
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { notifyManagersNewRequest } from '@/lib/push-helpers';

const log = logger.scope('api/permissions');

const createSchema = z.object({
  request_type: z.enum(['early_leave', 'late_arrival', 'short_break']),
  request_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  requested_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  duration_min: z.number().int().min(5).max(240).nullable().optional(),
  reason: z.string().min(3).max(500),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data: rows } = await supabase
    .from('permission_requests')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ ok: true, items: rows || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  // staff/manager/owner فقط
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (!role || !['staff', 'manager', 'owner'].includes(role)) {
    return NextResponse.json({ error: 'الطلب متاح للموظّفات فقط' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'بيانات غير صحيحة' },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('permission_requests')
    .insert({
      user_id: user.id,
      ...parsed.data,
    })
    .select()
    .single();

  if (error) {
    log.error('create failed', error);
    return NextResponse.json({ error: 'فشل إنشاء الطلب' }, { status: 500 });
  }

  // إشعار للمدراء
  const { data: profileRow } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
  const staffName = (profileRow as { full_name: string | null } | null)?.full_name || 'موظّفة';
  notifyManagersNewRequest('permission', staffName).catch(() => {});

  return NextResponse.json({ ok: true, item: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from('permission_requests')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'pending');

  if (error) {
    return NextResponse.json({ error: 'لا يمكن إلغاء الطلب' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
