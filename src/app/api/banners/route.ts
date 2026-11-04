/**
 * GET /api/banners — البنرات النشطة (عامّة · للـMobileHomeApp)
 * مع cache لمدّة 5 دقائق + invalidation tag
 */
import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api-wrapper';
import { cached, CACHE_TTL, CACHE_TAGS } from '@/lib/cache';

export const GET = withApi(async () => {
  const items = await cached(
    'banners:active',
    CACHE_TTL.MEDIUM,
    [CACHE_TAGS.BANNERS],
    async () => {
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
      return data || [];
    },
  );

  return NextResponse.json({ ok: true, items });
});
