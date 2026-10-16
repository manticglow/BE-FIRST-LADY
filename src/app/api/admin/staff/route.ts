/**
 * POST   /api/admin/staff — إنشاء موظفة
 * PATCH  /api/admin/staff — تحديث
 * DELETE /api/admin/staff?id — حذف
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

export async function POST(req: NextRequest) {
  const { error, supabase } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });
  const body = await req.json();
  const { data, error: err } = await supabase!.from('staff').insert({
    name: body.name,
    job_title: body.job_title,
    specialties: body.specialties || [],
    avatar_url: body.avatar_url || null,
    bio: body.bio || null,
    is_active: body.is_active ?? true,
    display_order: body.display_order || 0,
  }).select().single();
  if (err) return NextResponse.json({ error: err.message }, { status: 400 });
  return NextResponse.json({ staff: data });
}

export async function PATCH(req: NextRequest) {
  const { error, supabase } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });
  const { id, ...updates } = await req.json();
  const { data, error: err } = await supabase!.from('staff').update(updates).eq('id', id).select().single();
  if (err) return NextResponse.json({ error: err.message }, { status: 400 });
  return NextResponse.json({ staff: data });
}

export async function DELETE(req: NextRequest) {
  const { error, supabase } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });
  const id = req.nextUrl.searchParams.get('id');
  const { error: err } = await supabase!.from('staff').delete().eq('id', id!);
  if (err) return NextResponse.json({ error: err.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
