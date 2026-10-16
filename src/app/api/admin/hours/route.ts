/**
 * PUT /api/admin/hours
 * Body: [{ section, open_time, close_time, note }]
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

export async function PUT(req: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const { hours } = await req.json();
  if (!Array.isArray(hours)) return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });

  const admin = createAdminClient();
  for (const h of hours) {
    if (!h.section || !h.open_time || !h.close_time) continue;

    const { data: existing } = await admin.from('hours').select('id').eq('section', h.section).is('day_of_week', null).maybeSingle();

    if (existing) {
      await admin.from('hours').update({
        open_time: h.open_time,
        close_time: h.close_time,
        note: h.note || null,
      }).eq('id', existing.id);
    } else {
      await admin.from('hours').insert({
        section: h.section,
        open_time: h.open_time,
        close_time: h.close_time,
        note: h.note || null,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
