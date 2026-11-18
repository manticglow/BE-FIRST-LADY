/**
 * POST /api/payments/webhook/tabby
 * ═══════════════════════════════════════════════════════════
 * 🔒 SECURITY · 2026-11-18
 *   - يتطلّب شراكة توقيع HMAC (header: X-Tabby-Signature) أو
 *     secret مشترك (header: tabby-webhook-secret)
 *   - في production إذا السرّ غير معيّن · webhook يُرفض كاملاً
 *   - timing-safe comparison + idempotency guard
 */
import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { captureTabbyPayment } from '@/lib/payments/tabby';
import { verifyHmacSignature, verifySharedSecret } from '@/lib/webhook-security';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

const IS_PROD = process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
const TABBY_WEBHOOK_SECRET = process.env.TABBY_WEBHOOK_SECRET || '';
const log = logger.scope('tabby-webhook');

export async function POST(req: NextRequest) {
  // 🛑 fail-closed في الإنتاج لو السرّ ناقص
  if (IS_PROD && !TABBY_WEBHOOK_SECRET) {
    log.error('TABBY_WEBHOOK_SECRET غير مُعيّن في production · webhook يُرفض');
    return NextResponse.json({ error: 'webhook not configured' }, { status: 500 });
  }

  // ✅ اقرأي الـraw body أوّل عشان نقدر نتحقق من HMAC
  const rawBody = await req.text();

  if (TABBY_WEBHOOK_SECRET) {
    const hmacHeader = req.headers.get('x-tabby-signature');
    const sharedHeader = req.headers.get('tabby-webhook-secret');
    const hmacOk = hmacHeader
      ? verifyHmacSignature(rawBody, hmacHeader, TABBY_WEBHOOK_SECRET)
      : false;
    const sharedOk = sharedHeader
      ? verifySharedSecret(sharedHeader, TABBY_WEBHOOK_SECRET)
      : false;
    if (!hmacOk && !sharedOk) {
      log.warn('invalid webhook signature', { hasHmac: !!hmacHeader, hasShared: !!sharedHeader });
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

  const tabbyPaymentId = body?.payment?.id || body?.id;
  if (!tabbyPaymentId) {
    return NextResponse.json({ error: 'no payment id' }, { status: 400 });
  }

  const { data: intent } = await admin
    .from('payment_intents')
    .select('*')
    .eq('gateway', 'tabby')
    .eq('gateway_payment_id', tabbyPaymentId)
    .maybeSingle();

  if (!intent) return NextResponse.json({ ok: true, note: 'no intent' });

  const tabbyStatus = body?.payment?.status || body?.status;
  let newStatus: string | null = null;

  if (tabbyStatus === 'AUTHORIZED') {
    newStatus = 'authorized';
    const cap = await captureTabbyPayment(tabbyPaymentId, Number((intent as any).amount));
    if (cap.ok) {
      newStatus = 'paid';
    }
  } else if (tabbyStatus === 'CLOSED' || tabbyStatus === 'CAPTURED') {
    newStatus = 'paid';
  } else if (tabbyStatus === 'REJECTED' || tabbyStatus === 'EXPIRED') {
    newStatus = 'failed';
  } else if (tabbyStatus === 'REFUNDED') {
    newStatus = 'refunded';
  }

  if (!newStatus) return NextResponse.json({ ok: true, note: 'no state change' });

  // 🛡 Idempotency: ما نعالج paid مرّتين
  if (newStatus === 'paid' && (intent as any).status === 'paid') {
    return NextResponse.json({ ok: true, note: 'already_paid' });
  }

  const updates: any = { status: newStatus, gateway_response: body };
  if (newStatus === 'paid') updates.paid_at = new Date().toISOString();
  if (newStatus === 'refunded') updates.refunded_at = new Date().toISOString();

  await admin.from('payment_intents').update(updates).eq('id', (intent as any).id);

  // ✅ تحديث الحجز
  if ((intent as any).booking_id && newStatus === 'paid') {
    await admin.from('bookings')
      .update({ payment_status: 'paid', status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', (intent as any).booking_id);
  }

  return NextResponse.json({ ok: true, status: newStatus });
}
