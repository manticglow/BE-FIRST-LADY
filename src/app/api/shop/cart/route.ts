/**
 * GET/POST/DELETE /api/shop/cart
 * ═══════════════════════════════════════════════════════════
 * عربة التسوّق
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

async function getOrCreateCart(userId: string) {
  const admin = createAdminClient();
  let { data: cart } = await admin.from('carts').select('*').eq('customer_id', userId).maybeSingle();
  if (!cart) {
    const { data: newCart } = await admin.from('carts').insert({ customer_id: userId }).select().single();
    cart = newCart;
  }
  return cart;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: true, items: [], total: 0 });

  const cart = await getOrCreateCart(user.id);
  const admin = createAdminClient();
  const { data: items } = await admin
    .from('cart_items')
    .select('*, product:products(id, name_ar, price, image_urls, stock_quantity)')
    .eq('cart_id', cart.id);

  const total = (items || []).reduce((s: number, i: any) => s + Number(i.price_at_time) * i.quantity, 0);
  return NextResponse.json({ ok: true, cartId: cart.id, items: items || [], total });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'سجّلي دخول' }, { status: 401 });

  const { productId, quantity = 1 } = await req.json();
  const cart = await getOrCreateCart(user.id);
  const admin = createAdminClient();

  const { data: product } = await admin.from('products').select('price, stock_quantity').eq('id', productId).single();
  if (!product) return NextResponse.json({ ok: false, error: 'منتج غير موجود' }, { status: 404 });
  if (product.stock_quantity < quantity) {
    return NextResponse.json({ ok: false, error: 'الكميّة المطلوبة غير متوفّرة' }, { status: 400 });
  }

  const { data: existing } = await admin
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cart.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    await admin.from('cart_items')
      .update({ quantity: existing.quantity + quantity, price_at_time: product.price })
      .eq('id', existing.id);
  } else {
    await admin.from('cart_items').insert({
      cart_id: cart.id,
      product_id: productId,
      quantity,
      price_at_time: product.price,
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  const itemId = new URL(req.url).searchParams.get('id');
  if (!itemId) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 });

  // 🔒 IDOR fix: تحقّقي أنّ العنصر داخل عربتها فقط
  const admin = createAdminClient();
  const cart = await getOrCreateCart(user.id);
  await admin.from('cart_items').delete().eq('id', itemId).eq('cart_id', cart.id);

  return NextResponse.json({ ok: true });
}
