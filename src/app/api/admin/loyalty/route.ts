/**
 * POST /api/admin/loyalty — تعديل يدوي لنقاط عميلة
 * Body: { customer_id, points (+ أو -), reason }
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'ليس لديك صلاحية' }, { status: 403 });
  }

  const { customer_id, points, reason } = await req.json();
  if (!customer_id || !points || !reason) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
  }

  // جلب الرصيد
  const { data: cust } = await supabase.from('profiles').select('loyalty_points').eq('id', customer_id).single();
  if (!cust) return NextResponse.json({ error: 'عميلة غير موجودة' }, { status: 404 });

  const newBalance = (cust.loyalty_points || 0) + points;
  if (newBalance < 0) return NextResponse.json({ error: 'الرصيد لا يكفي' }, { status: 400 });

  await supabase.from('profiles').update({ loyalty_points: newBalance }).eq('id', customer_id);
  await supabase.from('loyalty_transactions').insert({
    customer_id, points, reason, balance_after: newBalance,
  });

  return NextResponse.json({ ok: true, new_balance: newBalance });
}
