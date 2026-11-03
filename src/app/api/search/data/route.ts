/**
 * GET /api/search/data
 * جلب بيانات البحث · cached heavily للـperformance
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const revalidate = 300; // 5 دقائق

export async function GET() {
  const supabase = await createClient();

  const [{ data: services }, { data: packages }, { data: categories }] = await Promise.all([
    supabase.from('services').select('id, name_ar, name_en, description_ar, price, price_from, duration_min, category_id').eq('is_active', true),
    supabase.from('packages').select('id, name_ar, name_en, description_ar, price').eq('is_active', true),
    supabase.from('categories').select('id, slug, name_ar, name_en').eq('is_active', true),
  ]);

  return NextResponse.json({
    services: services || [],
    packages: packages || [],
    categories: categories || [],
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  });
}
