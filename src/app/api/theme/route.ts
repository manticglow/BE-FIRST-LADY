/**
 * GET /api/theme — الثيم النشط (عامّة)
 * cached لمدّة 5 دقائق + invalidation عند التغيير
 */
import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api-wrapper';
import { cached, CACHE_TTL, CACHE_TAGS } from '@/lib/cache';

export const GET = withApi(async () => {
  const theme = await cached(
    'theme:active',
    CACHE_TTL.MEDIUM,
    [CACHE_TAGS.THEMES],
    async () => {
      const admin = createAdminClient();
      const { data } = await admin
        .from('site_themes')
        .select('code, name_ar, primary_color, accent_color, surface_color, text_color, badge_text, badge_emoji, decoration, banner_overlay')
        .eq('is_active', true)
        .maybeSingle();
      return data || null;
    },
  );

  return NextResponse.json({ ok: true, theme });
});
