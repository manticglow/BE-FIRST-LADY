/**
 * GET/POST/DELETE blocked dates
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

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.from('blocked_dates').select('*').order('date', { ascending: false });
  return NextResponse.json({ dates: data || [] });
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const { date, reason, all_day, start_time, end_time, staff_id } = await req.json();
  if (!date) return NextResponse.json({ error: 'التاريخ مطلوب' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from('blocked_dates').insert({
    date,
    reason: reason || null,
    all_day: all_day ?? true,
    start_time: start_time || null,
    end_time: end_time || null,
    staff_id: staff_id || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ blocked: data });
}

export async function DELETE(req: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from('blocked_dates').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
