/**
 * POST /api/admin/customers/notes
 * - owner/manager/staff can update staff_notes for any customer
 * Body: { customer_id, notes }
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['owner', 'manager', 'staff'].includes((profile as any).role)) {
    return NextResponse.json({ error: 'ليس لديكِ صلاحية' }, { status: 403 });
  }

  const { customer_id, notes } = await req.json();
  if (!customer_id) return NextResponse.json({ error: 'customer_id مطلوب' }, { status: 400 });
  if (typeof notes !== 'string') return NextResponse.json({ error: 'notes لازم نص' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ staff_notes: notes.trim() || null })
    .eq('id', customer_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
