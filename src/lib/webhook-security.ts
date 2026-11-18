/**
 * Webhook Security Helpers
 * ═══════════════════════════════════════════════════════════
 * HMAC verification + timing-safe comparison
 * Timing-safe compare prevents side-channel leaks of the secret
 */
import crypto from 'node:crypto';

/** Timing-safe string comparison (constant-time) */
export function timingSafeEqualString(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** Verify HMAC-SHA256 signature from a webhook body */
export function verifyHmacSignature(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  secret: string,
): boolean {
  if (!signatureHeader || !secret) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  // Support "sha256=<hex>" and bare "<hex>" formats
  const received = signatureHeader.replace(/^sha256=/i, '').trim().toLowerCase();
  return timingSafeEqualString(expected, received.toLowerCase());
}

/** Verify a shared-secret header (constant-time) */
export function verifySharedSecret(
  receivedHeader: string | null | undefined,
  expectedSecret: string,
): boolean {
  if (!receivedHeader || !expectedSecret) return false;
  return timingSafeEqualString(receivedHeader, expectedSecret);
}
