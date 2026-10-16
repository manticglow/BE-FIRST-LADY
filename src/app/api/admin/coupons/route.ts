/**
 * POST   /api/admin/coupons    — إنشاء كوبون
 * PATCH  /api/admin/coupons    — تحديث
 * DELETE /api/admin/coupons?id — حذف
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
  const { data, error: err } = await supabase!.from('coupons').insert({
    code: body.code.toUpperCase().trim(),
    description: body.description || null,
    discount_type: body.discount_type,
    discount_value: body.discount_value,
    min_total: body.min_total || 0,
    max_uses: body.max_uses || null,
    expires_at: body.expires_at || null,
    is_active: body.is_active ?? true,
    per_customer_limit: body.per_customer_limit || 1,
  }).select().single();
  if (err) return NextResponse.json({ error: err.message }, { status: 400 });
  return NextResponse.json({ coupon: data });
}

export async function PATCH(req: NextRequest) {
  const { error, supabase } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });
  const { id, ...updates } = await req.json();
  if (updates.code) updates.code = updates.code.toUpperCase().trim();
  const { data, error: err } = await supabase!.from('coupons').update(updates).eq('id', id).select().single();
  if (err) return NextResponse.json({ error: err.message }, { status: 400 });
  return NextResponse.json({ coupon: data });
}

export async function DELETE(req: NextRequest) {
  const { error, supabase } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });
  const id = req.nextUrl.searchParams.get('id');
  const { error: err } = await supabase!.from('coupons').delete().eq('id', id!);
  if (err) return NextResponse.json({ error: err.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
