/**
 * WebAuthn · Face ID / بصمة الجوال
 * ═══════════════════════════════════════════════════════════
 * - استخدام SimpleWebAuthn للتعامل مع الـ Passkeys
 * - يدعم: Face ID على iOS · Touch ID على Mac · Android Biometric · YubiKey
 */

import { createClient as createAdminClient } from '@supabase/supabase-js';

export const RP_NAME = 'السيّدة الأولى';

export function getRpId(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  try {
    return new URL(url).hostname;
  } catch {
    return 'localhost';
  }
}

export function getOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

export function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}

/** تنظيف الـchallenges المنتهية (يُستدعى تلقائياً) */
export async function cleanupExpiredChallenges() {
  const admin = getAdmin();
  await admin.from('webauthn_challenges').delete().lt('expires_at', new Date().toISOString());
}
