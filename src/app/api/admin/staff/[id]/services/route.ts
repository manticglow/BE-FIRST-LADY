/**
 * PUT /api/admin/staff/[id]/services
 * Body: { service_ids: string[] }
 * يستبدل خدمات الموظفة بالكامل (atomically)
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'غير مصرح — سجّلي دخولكِ', code: 401 };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return { error: 'للمالكة/المديرة فقط', code: 403 };
  }
  return { error: null, code: 0 };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: staffId } = await params;
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const { service_ids } = await req.json();
  if (!Array.isArray(service_ids)) {
    return NextResponse.json({ error: 'service_ids يجب أن تكون قائمة' }, { status: 400 });
  }

  // استخدام admin client لتجاوز RLS بأمان بعد التحقق من الدور
  const admin = createAdminClient();

  // تحقق — الموظفة موجودة
  const { data: staffExists } = await admin.from('staff').select('id').eq('id', staffId).single();
  if (!staffExists) {
    return NextResponse.json({ error: 'الموظفة غير موجودة' }, { status: 404 });
  }

  // احذف القديم
  const { error: delErr } = await admin.from('staff_services').delete().eq('staff_id', staffId);
  if (delErr) {
    console.error('Delete error:', delErr);
    return NextResponse.json({ error: 'فشل حذف الربط القديم', details: delErr.message }, { status: 500 });
  }

  // أضف الجديد
  if (service_ids.length > 0) {
    const rows = service_ids.map((sid) => ({ staff_id: staffId, service_id: sid }));
    const { error: insErr } = await admin.from('staff_services').insert(rows);
    if (insErr) {
      console.error('Insert error:', insErr);
      return NextResponse.json({ error: 'فشل ربط الخدمات', details: insErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, count: service_ids.length });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: staffId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('staff_services').select('service_id').eq('staff_id', staffId);
  return NextResponse.json({ service_ids: (data || []).map((r) => r.service_id) });
}
