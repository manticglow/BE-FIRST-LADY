/**
 * GET /api/banners — البنرات النشطة الحاليّة (عامّة · للـMobileHomeApp)
 */
import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const revalidate = 60; // cache لمدّة دقيقة

export async function GET() {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data } = await admin
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`)
    .order('display_order')
    .limit(10);

  return NextResponse.json({ ok: true, items: data || [] });
}
