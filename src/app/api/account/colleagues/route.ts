/**
 * GET /api/account/colleagues
 * - قائمة الزميلات (باقي الموظّفات) · للتبديل أو الاستبيان
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  // staff/manager/owner فقط
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (!role || !['staff', 'manager', 'owner'].includes(role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  }

  const { data: colleagues } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url')
    .eq('role', 'staff')
    .neq('id', user.id)
    .order('full_name');

  return NextResponse.json({ ok: true, items: colleagues || [] });
}
