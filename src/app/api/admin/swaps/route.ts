/**
 * GET   /api/admin/swaps — كل طلبات تبديل الدوام
 * PATCH                 — مراجعة
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { notifyRequestReview } from '@/lib/push-helpers';

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
    .from('shift_swap_requests')
    .select(`
      *,
      requester:profiles!shift_swap_requests_requester_id_fkey(id, full_name, avatar_url),
      recipient:profiles!shift_swap_requests_recipient_id_fkey(id, full_name, avatar_url)
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

  // جلب التفاصيل قبل التحديث + أسماء الطرفين (للـblock reason)
  const { data: current } = await admin
    .from('shift_swap_requests')
    .select(`
      requester_id, recipient_id, requester_date, recipient_date,
      requester:profiles!shift_swap_requests_requester_id_fkey(full_name),
      recipient:profiles!shift_swap_requests_recipient_id_fkey(full_name)
    `)
    .eq('id', parsed.data.id)
    .single();

  const { error } = await admin
    .from('shift_swap_requests')
    .update({
      status: parsed.data.status,
      review_note: parsed.data.review_note || null,
      reviewed_by: check.user!.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .in('status', ['pending', 'colleague_ok']);

  if (error) {
    return NextResponse.json({ error: 'فشل التحديث' }, { status: 500 });
  }

  const row = current as {
    requester_id: string; recipient_id: string | null;
    requester_date: string; recipient_date: string | null;
    requester: { full_name: string | null } | null;
    recipient: { full_name: string | null } | null;
  } | null;

  // ✨ عند الموافقة · طبّق التبديل فعليّاً على جدول الموظّفات
  // كل طرف يُحجب عن يومه الأصلي · الطرف الآخر يغطّيه
  if (parsed.data.status === 'approved' && row) {
    const requesterName = row.requester?.full_name || 'الطالبة';
    const recipientName = row.recipient?.full_name || 'الزميلة';

    // جلب staff.id لكل طرف
    const [reqStaffRes, recStaffRes] = await Promise.all([
      admin.from('staff').select('id').eq('profile_id', row.requester_id).maybeSingle(),
      row.recipient_id
        ? admin.from('staff').select('id').eq('profile_id', row.recipient_id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const blocks: any[] = [];

    // 1. الطالبة لا تداوم في يومها · تغطّيها الزميلة
    const reqStaffId = (reqStaffRes.data as { id: string } | null)?.id;
    if (reqStaffId && row.requester_date) {
      blocks.push({
        date: row.requester_date,
        reason: `تبديل · تغطّيها ${recipientName}`,
        all_day: true,
        staff_id: reqStaffId,
      });
    }

    // 2. الزميلة لا تداوم في يومها · تغطّيها الطالبة
    const recStaffId = (recStaffRes.data as { id: string } | null)?.id;
    if (recStaffId && row.recipient_date) {
      blocks.push({
        date: row.recipient_date,
        reason: `تبديل · تغطّيها ${requesterName}`,
        all_day: true,
        staff_id: recStaffId,
      });
    }

    if (blocks.length > 0) {
      await admin.from('blocked_dates').insert(blocks);
    }
  }

  // إشعار لكلا الطرفين
  if (row) {
    const summary = `تبديل ${row.requester_date}${row.recipient_date ? ` ↔ ${row.recipient_date}` : ''}`;
    notifyRequestReview(row.requester_id, 'swap', parsed.data.status, summary).catch(() => {});
    if (row.recipient_id) {
      notifyRequestReview(row.recipient_id, 'swap', parsed.data.status, summary).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true });
}
