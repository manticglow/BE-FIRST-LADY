/**
 * GET /api/admin/errors — سجلّ أخطاء APIs
 * PATCH                — تعليم خطأ كـresolved
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { withApi, ApiErrors } from '@/lib/api-wrapper';

export const GET = withApi(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw ApiErrors.unauthorized();

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (!role || !['owner', 'manager'].includes(role)) throw ApiErrors.forbidden();

  const admin = createAdminClient();
  const [{ data: errors }, { count: unresolvedCount }, { count: last24h }] = await Promise.all([
    admin.from('api_errors').select('*').order('created_at', { ascending: false }).limit(50),
    admin.from('api_errors').select('*', { count: 'exact', head: true }).eq('resolved', false),
    admin.from('api_errors').select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);

  // جمع الأخطاء حسب المسار
  type ErrRow = { path: string };
  const grouped: Record<string, number> = {};
  (errors as ErrRow[] || []).forEach((e) => {
    grouped[e.path] = (grouped[e.path] || 0) + 1;
  });
  const topPaths = Object.entries(grouped)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([path, count]) => ({ path, count }));

  return NextResponse.json({
    ok: true,
    errors: errors || [],
    stats: {
      unresolved: unresolvedCount || 0,
      last_24h: last24h || 0,
      top_paths: topPaths,
    },
  });
});

export const PATCH = withApi(async (req: NextRequest) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw ApiErrors.unauthorized();

  const body = await req.json();
  const { id, resolved } = body;
  if (!id) throw ApiErrors.badRequest('id مطلوب');

  const admin = createAdminClient();
  await admin.from('api_errors').update({ resolved: resolved ?? true }).eq('id', id);
  return NextResponse.json({ ok: true });
});
