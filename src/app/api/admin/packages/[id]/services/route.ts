/**
 * PUT /api/admin/packages/[id]/services
 * Body: { service_ids: string[] }
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'غير مصرح', code: 401 };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return { error: 'للمالكة/المديرة فقط', code: 403 };
  }
  return { error: null, code: 0 };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('package_services').select('service_id').eq('package_id', id);
  return NextResponse.json({ service_ids: (data || []).map((r) => r.service_id) });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const { service_ids } = await req.json();
  if (!Array.isArray(service_ids)) {
    return NextResponse.json({ error: 'service_ids يجب أن تكون قائمة' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error: delErr } = await admin.from('package_services').delete().eq('package_id', id);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  if (service_ids.length > 0) {
    const rows = service_ids.map((sid) => ({ package_id: id, service_id: sid }));
    const { error } = await admin.from('package_services').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: service_ids.length });
}
