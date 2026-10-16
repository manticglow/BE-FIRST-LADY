/**
 * PATCH /api/account/profile
 * - تعديل بيانات حساب العميلة
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { full_name, phone, email } = await req.json();
  const updates: any = {};
  if (full_name !== undefined) updates.full_name = String(full_name).trim();
  if (phone !== undefined) updates.phone = String(phone).replace(/\s/g, '');
  if (email !== undefined) updates.email = String(email).trim();

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // تحديث البريد في auth أيضاً
  if (email && email !== user.email) {
    await supabase.auth.updateUser({ email });
  }

  return NextResponse.json({ ok: true });
}
