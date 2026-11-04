/**
 * GET /api/theme — الثيم النشط (للعامّة)
 * cached لمدّة 5 دقائق
 */
import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const revalidate = 300; // 5 دقائق

export async function GET() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('site_themes')
    .select('code, name_ar, primary_color, accent_color, surface_color, text_color, badge_text, badge_emoji, decoration, banner_overlay')
    .eq('is_active', true)
    .maybeSingle();

  return NextResponse.json({ ok: true, theme: data || null });
}
