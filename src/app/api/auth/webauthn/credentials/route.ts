/**
 * GET/DELETE /api/auth/webauthn/credentials
 * ═══════════════════════════════════════════════════════════
 * إدارة أجهزة Face ID المُسجّلة
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdmin } from '@/lib/webauthn';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  const admin = getAdmin();
  const { data } = await admin
    .from('webauthn_credentials')
    .select('id, device_name, created_at, last_used_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ ok: true, credentials: data || [] });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false, error: 'missing id' }, { status: 400 });

  const admin = getAdmin();
  await admin.from('webauthn_credentials').delete().eq('id', id).eq('user_id', user.id);

  return NextResponse.json({ ok: true });
}
