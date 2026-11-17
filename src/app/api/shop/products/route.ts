/**
 * GET /api/shop/products
 * ═══════════════════════════════════════════════════════════
 * قائمة المنتجات المعروضة في المتجر
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const url = new URL(req.url);
  const category = url.searchParams.get('category');
  const featured = url.searchParams.get('featured') === 'true';

  let query = supabase
    .from('products')
    .select('*, category:product_categories(id, name_ar, slug, icon)')
    .eq('is_active', true)
    .gt('stock_quantity', 0)
    .order('display_order')
    .order('created_at', { ascending: false });

  if (category) query = query.eq('category_id', category);
  if (featured) query = query.eq('is_featured', true);

  const { data } = await query;

  const { data: categories } = await supabase
    .from('product_categories')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  return NextResponse.json({
    ok: true,
    products: data || [],
    categories: categories || [],
  });
}
