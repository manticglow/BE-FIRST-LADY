/**
 * POST   /api/inventory      — إنشاء منتج
 * PATCH  /api/inventory      — تحديث
 * DELETE /api/inventory?id=  — حذف
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'غير مصرح', code: 401, userId: null };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return { error: 'للمالكة/المديرة فقط', code: 403, userId: null };
  }
  return { error: null, code: 0, userId: user.id };
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const body = await req.json();
  const admin = createAdminClient();
  const { data, error } = await admin.from('inventory_items').insert({
    name_ar: body.name_ar,
    name_en: body.name_en || null,
    sku: body.sku || null,
    category: body.category || null,
    unit: body.unit || 'قطعة',
    cost_price: body.cost_price || 0,
    sell_price: body.sell_price || 0,
    stock_qty: body.stock_qty || 0,
    low_stock_alert: body.low_stock_alert || 5,
    is_active: body.is_active ?? true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // سجل الحركة الأولية
  if (Number(body.stock_qty) > 0) {
    await admin.from('inventory_movements').insert({
      item_id: data.id,
      movement_type: 'purchase',
      qty: body.stock_qty,
      balance_after: body.stock_qty,
      reason: 'إضافة أولية',
      user_id: check.userId,
    });
  }

  return NextResponse.json({ item: data });
}

export async function PATCH(req: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const { id, adjustStock, ...updates } = await req.json();
  const admin = createAdminClient();

  // تعديل مخزون منفصل (دخول/خروج/تعديل يدوي)
  if (adjustStock) {
    const { data: current } = await admin.from('inventory_items').select('stock_qty').eq('id', id).single();
    const newQty = Number(current?.stock_qty || 0) + Number(adjustStock.qty);
    if (newQty < 0) return NextResponse.json({ error: 'الكمية ما تكفي' }, { status: 400 });

    await admin.from('inventory_items').update({ stock_qty: newQty }).eq('id', id);
    await admin.from('inventory_movements').insert({
      item_id: id,
      movement_type: adjustStock.type || 'adjustment',
      qty: adjustStock.qty,
      balance_after: newQty,
      reason: adjustStock.reason || null,
      user_id: check.userId,
    });
    return NextResponse.json({ ok: true, new_qty: newQty });
  }

  const { data, error } = await admin.from('inventory_items').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data });
}

export async function DELETE(req: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });
  const id = req.nextUrl.searchParams.get('id');
  const admin = createAdminClient();
  const { error } = await admin.from('inventory_items').delete().eq('id', id!);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
