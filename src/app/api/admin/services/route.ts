/**
 * POST   /api/admin/services       — إنشاء خدمة
 * PATCH  /api/admin/services       — تحديث خدمة
 * DELETE /api/admin/services?id=.. — حذف
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
  const { data, error: err } = await supabase!.from('services').insert({
    category_id: body.category_id,
    name_ar: body.name_ar,
    name_en: body.name_en || body.name_ar,
    description_ar: body.description_ar || null,
    price: body.price,
    price_from: body.price_from || false,
    duration_min: body.duration_min,
    is_active: body.is_active ?? true,
    display_order: body.display_order || 0,
  }).select().single();
  if (err) return NextResponse.json({ error: err.message }, { status: 400 });
  return NextResponse.json({ service: data });
}

export async function PATCH(req: NextRequest) {
  const { error, supabase } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

  const { data, error: err } = await supabase!.from('services').update(updates).eq('id', id).select().single();
  if (err) return NextResponse.json({ error: err.message }, { status: 400 });
  return NextResponse.json({ service: data });
}

export async function DELETE(req: NextRequest) {
  const { error, supabase } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

  const { error: err } = await supabase!.from('services').delete().eq('id', id);
  if (err) return NextResponse.json({ error: err.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
