/**
 * GET   /api/admin/permissions — كل طلبات الإذن
 * PATCH                       — مراجعة (موافقة/رفض)
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { notifyRequestReview } from '@/lib/push-helpers';

const PERMISSION_TYPE_AR: Record<string, string> = {
  early_leave: 'انصراف مبكّر', late_arrival: 'تأخّر الوصول', short_break: 'استراحة قصيرة',
};

const reviewSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['approved', 'rejected']),
  review_note: z.string().max(500).nullable().optional(),
});

async function requireManager() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'غير مصرح', code: 401, user: null };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (!role || !['owner', 'manager'].includes(role)) {
    return { error: 'للمالكة والمديرة فقط', code: 403, user: null };
  }
  return { error: null, code: 0, user };
}

export async function GET() {
  const check = await requireManager();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const admin = createAdminClient();
  const { data } = await admin
    .from('permission_requests')
    .select(`
      *,
      user:profiles!permission_requests_user_id_fkey(id, full_name, avatar_url, role)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  return NextResponse.json({ ok: true, items: data || [] });
}

export async function PATCH(req: NextRequest) {
  const check = await requireManager();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const admin = createAdminClient();

  // جلب التفاصيل للإشعار قبل التحديث
  const { data: current } = await admin
    .from('permission_requests')
    .select('user_id, request_type, request_date, requested_time')
    .eq('id', parsed.data.id)
    .single();

  const { error } = await admin
    .from('permission_requests')
    .update({
      status: parsed.data.status,
      review_note: parsed.data.review_note || null,
      reviewed_by: check.user!.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .eq('status', 'pending');

  if (error) {
    return NextResponse.json({ error: 'فشل التحديث' }, { status: 500 });
  }

  // إشعار لحظي للموظّفة
  const row = current as { user_id: string; request_type: string; request_date: string; requested_time: string } | null;
  if (row) {
    notifyRequestReview(
      row.user_id,
      'permission',
      parsed.data.status,
      `${PERMISSION_TYPE_AR[row.request_type]} · ${row.request_date} ${row.requested_time.slice(0, 5)}`,
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
