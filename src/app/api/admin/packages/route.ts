/**
 * POST /api/admin/packages
 * PATCH /api/admin/packages
 * DELETE /api/admin/packages?id=
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

function slugify(ar: string): string {
  const base = ar.replace(/\s+/g, '-').replace(/[^\w؀-ۿ-]/g, '').slice(0, 50);
  return `${base || 'pkg'}-${Date.now().toString(36).slice(-5)}`;
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const body = await req.json();
  if (!body.name_ar || !body.price) {
    return NextResponse.json({ error: 'الاسم والسعر مطلوبان' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin.from('packages').insert({
    slug: body.slug || slugify(body.name_ar),
    name_ar: body.name_ar,
    name_en: body.name_en || null,
    description_ar: body.description_ar || null,
    price: body.price,
    original_price: body.original_price || null,
    valid_from: body.valid_from || null,
    valid_until: body.valid_until || null,
    is_active: body.is_active ?? true,
    display_order: body.display_order || 0,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ package: data });
}

export async function PATCH(req: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from('packages').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ package: data });
}

export async function DELETE(req: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from('packages').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
