/**
 * POST /api/auth/webauthn/login-options
 * ═══════════════════════════════════════════════════════════
 * توليد challenge للدخول · بدون معرفة المستخدمة (passwordless)
 */
import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { getRpId, getAdmin, cleanupExpiredChallenges } from '@/lib/webauthn';

export async function POST(req: NextRequest) {
  // 🛡 Rate limit · ضدّ challenge flooding
  const { checkRateLimit, getClientIp } = await import('@/lib/rate-limit');
  const ip = getClientIp(req);
  const rl = await checkRateLimit({
    key: ip || 'unknown',
    category: 'webauthn-login-opt',
    max: 10,
    windowSec: 60,
  });
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: 'محاولات كثيرة' }, { status: 429 });
  }

  await cleanupExpiredChallenges();
  const admin = getAdmin();

  const options = await generateAuthenticationOptions({
    rpID: getRpId(),
    userVerification: 'preferred',
    allowCredentials: [],   // discoverable credentials · ما نحتاج نحدّد
  });

  await admin.from('webauthn_challenges').insert({
    challenge: options.challenge,
    type: 'login',
  });

  return NextResponse.json({ ok: true, options });
}
