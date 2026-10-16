/**
 * PATCH /api/admin/reviews — موافقة/تمييز/رد
 * DELETE /api/admin/reviews?id — حذف
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'غير مصرح', supabase: null };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return { error: 'ليس لديك صلاحية', supabase: null };
  }
  return { error: null, supabase };
}

export async function PATCH(req: NextRequest) {
  const { error, supabase } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });
  const { id, ...updates } = await req.json();

  if (updates.admin_reply) {
    updates.admin_reply_at = new Date().toISOString();
  }

  const { data, error: err } = await supabase!.from('reviews').update(updates).eq('id', id).select().single();
  if (err) return NextResponse.json({ error: err.message }, { status: 400 });
  return NextResponse.json({ review: data });
}

export async function DELETE(req: NextRequest) {
  const { error, supabase } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });
  const id = req.nextUrl.searchParams.get('id');
  const { error: err } = await supabase!.from('reviews').delete().eq('id', id!);
  if (err) return NextResponse.json({ error: err.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
