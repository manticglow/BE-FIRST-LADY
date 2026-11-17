/**
 * GET/POST /api/admin/calls
 * ═══════════════════════════════════════════════════════════
 * سجلّ المكالمات (Call Center)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, error: 'غير مصرح', code: 401 };
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!p || !['owner', 'manager', 'staff'].includes(p.role)) {
    return { user: null, error: 'غير مصرح', code: 403 };
  }
  return { user, error: null, code: 0 };
}

export async function GET() {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const admin = createAdminClient();
  const { data } = await admin
    .from('phone_calls')
    .select('*, customer:profiles!customer_id(full_name, phone), operator:profiles!operator_id(full_name)')
    .order('created_at', { ascending: false })
    .limit(200);

  return NextResponse.json({ ok: true, calls: data || [] });
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const body = await req.json();
  const admin = createAdminClient();

  // ابحث عن العميلة بالرقم
  let customerId = body.customer_id;
  if (!customerId && body.customer_phone) {
    const { data: found } = await admin
      .from('profiles')
      .select('id')
      .eq('phone', body.customer_phone)
      .maybeSingle();
    customerId = found?.id;
  }

  const { data, error } = await admin
    .from('phone_calls')
    .insert({
      direction: body.direction || 'incoming',
      customer_id: customerId,
      customer_phone: body.customer_phone,
      customer_name: body.customer_name,
      operator_id: check.user!.id,
      duration_seconds: body.duration_seconds,
      outcome: body.outcome,
      notes: body.notes,
      booking_id: body.booking_id,
      callback_requested: body.callback_requested,
      callback_at: body.callback_at,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, call: data });
}
