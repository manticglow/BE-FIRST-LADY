/**
 * POST /api/auth/webauthn/register-options
 * ═══════════════════════════════════════════════════════════
 * توليد challenge للتسجيل (Face ID / بصمة) · للمستخدمة المسجّلة دخول حاليّاً
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { RP_NAME, getRpId, getAdmin, cleanupExpiredChallenges } from '@/lib/webauthn';

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  await cleanupExpiredChallenges();
  const admin = getAdmin();

  // جلب الـcredentials الموجودة · عشان ما تسجّل نفس الجهاز مرّتين
  const { data: existing } = await admin
    .from('webauthn_credentials')
    .select('credential_id, transports')
    .eq('user_id', user.id);

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: getRpId(),
    userName: user.email || user.id,
    userDisplayName: user.user_metadata?.full_name || 'عميلة',
    userID: new TextEncoder().encode(user.id),
    attestationType: 'none',
    excludeCredentials: (existing || []).map((c) => ({
      id: c.credential_id,
      transports: c.transports as any,
    })),
    authenticatorSelection: {
      userVerification: 'preferred',
      residentKey: 'preferred',
    },
  });

  // حفظ الـchallenge مؤقّتاً
  await admin.from('webauthn_challenges').insert({
    user_id: user.id,
    challenge: options.challenge,
    type: 'register',
  });

  return NextResponse.json({ ok: true, options });
}
