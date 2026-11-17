/**
 * POST /api/auth/webauthn/login-verify
 * ═══════════════════════════════════════════════════════════
 * التحقّق من Authentication Response · إنشاء session
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getRpId, getOrigin, getAdmin } from '@/lib/webauthn';
import { auditLog, extractRequestInfo } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  const { ip, ua } = extractRequestInfo(req);
  const body = await req.json();
  const { response } = body;

  const admin = getAdmin();

  // ابحث عن الـcredential بالـID
  const { data: credential } = await admin
    .from('webauthn_credentials')
    .select('*')
    .eq('credential_id', response.id)
    .single();

  if (!credential) {
    return NextResponse.json({ ok: false, error: 'جهاز غير معروف' }, { status: 400 });
  }

  // آخر challenge نشط للـlogin
  const { data: challengeRow } = await admin
    .from('webauthn_challenges')
    .select('*')
    .eq('type', 'login')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!challengeRow) {
    return NextResponse.json({ ok: false, error: 'جلسة منتهية · حاولي مجدداً' }, { status: 400 });
  }

  try {
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: getOrigin(),
      expectedRPID: getRpId(),
      credential: {
        id: credential.credential_id,
        publicKey: Buffer.from(credential.public_key, 'base64url'),
        counter: credential.counter,
      } as any,
    });

    if (!verification.verified) {
      return NextResponse.json({ ok: false, error: 'فشل التحقّق' }, { status: 400 });
    }

    // تحديث العدّاد + وقت الاستخدام
    await admin
      .from('webauthn_credentials')
      .update({
        counter: (verification.authenticationInfo as any).newCounter,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', credential.id);

    await admin.from('webauthn_challenges').delete().eq('id', challengeRow.id);

    // إنشاء Session · magic link flow
    const { data: userData } = await admin.auth.admin.getUserById(credential.user_id);
    if (!userData?.user?.email) {
      return NextResponse.json({ ok: false, error: 'حساب غير موجود' }, { status: 404 });
    }

    const { data: linkData } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.user.email,
    });

    const hashedToken = linkData?.properties?.hashed_token;
    if (!hashedToken) {
      return NextResponse.json({ ok: false, error: 'فشل توليد الجلسة' }, { status: 500 });
    }

    const ssr = await createServerClient();
    await ssr.auth.verifyOtp({ type: 'magiclink', token_hash: hashedToken });

    await auditLog({
      userId: credential.user_id,
      action: 'auth.login',
      success: true,
      metadata: { method: 'webauthn', deviceName: credential.device_name },
      ipAddress: ip,
      userAgent: ua,
    });

    return NextResponse.json({ ok: true, message: '🌸 أهلاً بكِ' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'فشل الدخول' }, { status: 400 });
  }
}
