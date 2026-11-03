/**
 * GET /api/account/swaps — طلبات التبديل الخاصّة بالمستخدم (طالبة أو مستقبِلة)
 * POST                   — إنشاء طلب تبديل
 * PATCH                  — تحديث حالة من المستقبِلة (موافقة/رفض)
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { notifyManagersNewRequest, notifySwapRecipient, notifySwapResponse } from '@/lib/push-helpers';

const log = logger.scope('api/swaps');

const createSchema = z.object({
  requester_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  recipient_id: z.string().uuid(),
  recipient_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  reason: z.string().min(3).max(500),
});

const respondSchema = z.object({
  id: z.string().uuid(),
  response: z.enum(['accept', 'decline']),
  note: z.string().max(500).optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  // ارجعي الطلبات اللي أنا فيها (طالبة أو مستقبِلة)
  const { data: rows } = await supabase
    .from('shift_swap_requests')
    .select(`
      *,
      requester:profiles!shift_swap_requests_requester_id_fkey(id, full_name, avatar_url),
      recipient:profiles!shift_swap_requests_recipient_id_fkey(id, full_name, avatar_url)
    `)
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .limit(50);

  return NextResponse.json({ ok: true, items: rows || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (!role || !['staff', 'manager', 'owner'].includes(role)) {
    return NextResponse.json({ error: 'الطلب للموظّفات فقط' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  // لا يمكن إنشاء طلب مع النفس
  if (parsed.data.recipient_id === user.id) {
    return NextResponse.json({ error: 'لا يمكن تبديل الدوام مع نفسك' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('shift_swap_requests')
    .insert({
      requester_id: user.id,
      ...parsed.data,
      recipient_date: parsed.data.recipient_date || null,
    })
    .select()
    .single();

  if (error) {
    log.error('create failed', error);
    return NextResponse.json({ error: 'فشل إنشاء الطلب' }, { status: 500 });
  }

  // إشعار للزميلة المستقبِلة + للمدراء
  const { data: profileRow } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
  const requesterName = (profileRow as { full_name: string | null } | null)?.full_name || 'زميلة';
  notifySwapRecipient(parsed.data.recipient_id, requesterName, parsed.data.requester_date).catch(() => {});
  notifyManagersNewRequest('swap', requesterName).catch(() => {});

  return NextResponse.json({ ok: true, item: data });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await req.json();
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const admin = createAdminClient();

  // تحقّقي إنه المستقبِلة
  const { data: swap } = await admin
    .from('shift_swap_requests')
    .select('recipient_id, status')
    .eq('id', parsed.data.id)
    .single();

  const s = swap as { recipient_id: string; status: string } | null;
  if (!s || s.recipient_id !== user.id) {
    return NextResponse.json({ error: 'ليس طلبكِ' }, { status: 403 });
  }
  if (s.status !== 'pending') {
    return NextResponse.json({ error: 'تم الردّ على الطلب مسبقاً' }, { status: 400 });
  }

  const newStatus = parsed.data.response === 'accept' ? 'colleague_ok' : 'colleague_no';

  const { data: swapRow } = await admin
    .from('shift_swap_requests')
    .select('requester_id')
    .eq('id', parsed.data.id)
    .single();

  const { error } = await admin
    .from('shift_swap_requests')
    .update({
      status: newStatus,
      colleague_responded_at: new Date().toISOString(),
      colleague_note: parsed.data.note || null,
    })
    .eq('id', parsed.data.id);

  if (error) {
    return NextResponse.json({ error: 'فشل التحديث' }, { status: 500 });
  }

  // إشعار للطالبة بردّ الزميلة
  const requesterId = (swapRow as { requester_id: string } | null)?.requester_id;
  if (requesterId) {
    const { data: profileRow } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    const recipientName = (profileRow as { full_name: string | null } | null)?.full_name || 'الزميلة';
    notifySwapResponse(requesterId, recipientName, parsed.data.response === 'accept').catch(() => {});
  }

  return NextResponse.json({ ok: true, new_status: newStatus });
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
    .from('shift_swap_requests')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('requester_id', user.id)
    .in('status', ['pending', 'colleague_ok']);

  if (error) {
    return NextResponse.json({ error: 'لا يمكن إلغاء الطلب' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
