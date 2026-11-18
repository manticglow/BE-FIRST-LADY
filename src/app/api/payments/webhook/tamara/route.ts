/**
 * POST /api/payments/webhook/tamara
 * ═══════════════════════════════════════════════════════════
 * 🔒 SECURITY · 2026-11-18
 *   - يتطلّب توقيع HMAC (Tamara-Signature) أو shared secret
 *   - fail-closed في الإنتاج لو السرّ غير معيّن
 *   - idempotency guard + تحديث booking
 */
import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorizeTamaraOrder } from '@/lib/payments/tamara';
import { verifyHmacSignature, verifySharedSecret } from '@/lib/webhook-security';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const IS_PROD = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
const TAMARA_WEBHOOK_SECRET = process.env.TAMARA_WEBHOOK_SECRET || '';
const log = logger.scope('tamara-webhook');

export async function POST(req: NextRequest) {
  if (IS_PROD && !TAMARA_WEBHOOK_SECRET) {
    log.error('TAMARA_WEBHOOK_SECRET غير مُعيّن · webhook يُرفض');
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 });
  }

  const rawBody = await req.text();

  if (TAMARA_WEBHOOK_SECRET) {
    const hmacHeader = req.headers.get('tamara-signature') || req.headers.get('x-tamara-signature');
    const sharedHeader = req.headers.get('tamara-webhook-secret');
    const hmacOk = hmacHeader
      ? verifyHmacSignature(rawBody, hmacHeader, TAMARA_WEBHOOK_SECRET)
      : false;
    const sharedOk = sharedHeader
      ? verifySharedSecret(sharedHeader, TAMARA_WEBHOOK_SECRET)
      : false;
    if (!hmacOk && !sharedOk) {
      log.warn('invalid tamara signature');
      return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
    }
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const admin = createAdminClient();

  const orderId = body?.order_id || body?.data?.order_id;
  if (!orderId) return NextResponse.json({ error: 'no order id' }, { status: 400 });

  const { data: intent } = await admin
    .from('payment_intents')
    .select('*')
    .eq('gateway', 'tamara')
    .eq('gateway_payment_id', orderId)
    .maybeSingle();

  if (!intent) return NextResponse.json({ ok: true, note: 'no intent' });

  const tamaraStatus = body?.order_status || body?.event_type;
  let newStatus: string | null = null;

  if (tamaraStatus === 'approved' || tamaraStatus === 'order_approved') {
    const auth = await authorizeTamaraOrder(orderId);
    newStatus = auth.ok ? 'paid' : 'authorized';
  } else if (tamaraStatus === 'authorised' || tamaraStatus === 'order_authorised') {
    newStatus = 'paid';
  } else if (
    tamaraStatus === 'declined' ||
    tamaraStatus === 'expired' ||
    tamaraStatus === 'cancelled'
  ) {
    newStatus = 'failed';
  }

  if (!newStatus) return NextResponse.json({ ok: true });

  if (newStatus === 'paid' && (intent as any).status === 'paid') {
    return NextResponse.json({ ok: true, note: 'already_paid' });
  }

  const updates: any = { status: newStatus, gateway_response: body };
  if (newStatus === 'paid') updates.paid_at = new Date().toISOString();

  await admin.from('payment_intents').update(updates).eq('id', (intent as any).id);

  if ((intent as any).booking_id && newStatus === 'paid') {
    await admin.from('bookings')
      .update({ payment_status: 'paid', status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', (intent as any).booking_id);
  }

  return NextResponse.json({ ok: true });
}
