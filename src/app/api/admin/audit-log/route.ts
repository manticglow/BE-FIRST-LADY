/**
 * GET /api/admin/audit-log
 * ═══════════════════════════════════════════════════════════
 * عرض سجلّ العمليّات الحسّاسة · للمالكة فقط
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!p || p.role !== 'owner') {
    return NextResponse.json({ error: 'للمالكة فقط' }, { status: 403 });
  }

  const url = new URL(req.url);
  const limit = Math.min(500, Number(url.searchParams.get('limit') || 100));
  const action = url.searchParams.get('action');
  const success = url.searchParams.get('success');

  const admin = createAdminClient();
  let query = admin.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);

  if (action) query = query.like('action', `${action}%`);
  if (success !== null && success !== undefined) {
    query = query.eq('success', success === 'true');
  }

  const { data } = await query;
  return NextResponse.json({ ok: true, logs: data || [] });
}
