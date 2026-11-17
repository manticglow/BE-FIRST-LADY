/**
 * POST /api/auth/webauthn/register-verify
 * ═══════════════════════════════════════════════════════════
 * التحقّق من الـRegistration Response · حفظ الـCredential
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { getRpId, getOrigin, getAdmin } from '@/lib/webauthn';
import { auditLog, extractRequestInfo } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  const { ip, ua } = extractRequestInfo(req);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  const body = await req.json();
  const { response, deviceName } = body;

  const admin = getAdmin();

  // جلب أحدث challenge
  const { data: challengeRow } = await admin
    .from('webauthn_challenges')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'register')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!challengeRow) {
    return NextResponse.json({ ok: false, error: 'جلسة التسجيل منتهية' }, { status: 400 });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: getOrigin(),
      expectedRPID: getRpId(),
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ ok: false, error: 'فشل التحقّق' }, { status: 400 });
    }

    const { credential } = verification.registrationInfo as any;

    // حفظ الـcredential
    await admin.from('webauthn_credentials').insert({
      user_id: user.id,
      credential_id: credential.id,
      public_key: Buffer.from(credential.publicKey).toString('base64url'),
      counter: credential.counter,
      device_name: deviceName || 'جهاز جديد',
      device_type: verification.registrationInfo.credentialDeviceType,
      transports: response.response?.transports || null,
      backup_eligible: verification.registrationInfo.credentialBackedUp || false,
    });

    // حذف الـchallenge المستخدم
    await admin.from('webauthn_challenges').delete().eq('id', challengeRow.id);

    await auditLog({
      userId: user.id,
      action: 'auth.webauthn.register',
      success: true,
      metadata: { deviceName },
      ipAddress: ip,
      userAgent: ua,
    });

    return NextResponse.json({ ok: true, message: 'تمّ تفعيل Face ID 🎉' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'فشل التسجيل' }, { status: 400 });
  }
}
