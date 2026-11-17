/**
 * GET/POST /api/waitlist
 * ═══════════════════════════════════════════════════════════
 * إدارة قائمة الانتظار
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { auditLog, extractRequestInfo } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  const { ip, ua } = extractRequestInfo(req);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'سجّلي دخول أولاً' }, { status: 401 });

  const body = await req.json();
  const admin = createAdminClient();

  const { data, error } = await admin.from('waitlist_entries').insert({
    customer_id: user.id,
    service_id: body.service_id,
    staff_id: body.staff_id,
    preferred_date: body.preferred_date,
    preferred_time: body.preferred_time,
    flexibility: body.flexibility || 'exact',
    notes: body.notes,
  }).select().single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  await auditLog({
    userId: user.id,
    action: 'waitlist.join',
    success: true,
    metadata: { service_id: body.service_id, date: body.preferred_date },
    ipAddress: ip,
    userAgent: ua,
  });

  return NextResponse.json({ ok: true, entry: data });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile && ['owner', 'manager'].includes(profile.role);

  const admin = createAdminClient();
  let query = admin
    .from('waitlist_entries')
    .select(`
      *,
      service:services(id, name_ar),
      staff:staff(id, name),
      customer:profiles!customer_id(id, full_name, phone)
    `)
    .order('created_at', { ascending: false });

  if (!isAdmin) {
    query = query.eq('customer_id', user.id);
  }

  const { data } = await query;
  return NextResponse.json({ ok: true, entries: data || [] });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 });

  const admin = createAdminClient();
  await admin
    .from('waitlist_entries')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('customer_id', user.id);

  return NextResponse.json({ ok: true });
}
