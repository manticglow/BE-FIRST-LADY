/**
 * POST /api/payments/webhook/moyasar
 * Moyasar webhook · يُستدعى تلقائياً من Moyasar عند تغيّر حالة دفعة
 *
 * Events: payment_paid · payment_failed · payment_refunded · invoice_paid
 */
import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { auditLog, extractRequestInfo } from '@/lib/audit-log';
import { logger } from '@/lib/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

const log = logger.scope('moyasar-webhook');

export const runtime = 'nodejs';

const WEBHOOK_SECRET = process.env.MOYASAR_WEBHOOK_SECRET || '';

type IntentRow = {
  id: string;
  customer_id: string | null;
  amount: number;
  booking_id: string;
  loyalty_points_used: number | null;
  gift_card_code: string | null;
  gift_card_amount: number | null;
};

type UpdatePayload = {
  status: string;
  gateway_response: unknown;
  method: string | null;
  paid_at?: string;
  gateway_payment_id?: string;
  refunded_at?: string;
  failure_reason?: string;
};

export async function POST(req: NextRequest) {
  const { ip, ua } = extractRequestInfo(req);

  // التحقّق من الـsecret (في header أو body)
  const headerSecret = req.headers.get('x-moyasar-secret') || req.headers.get('secret-token');
  if (WEBHOOK_SECRET && headerSecret !== WEBHOOK_SECRET) {
    log.warn('invalid secret');
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const eventType = body.type;        // payment_paid, payment_failed, invoice_paid
  const data = body.data;
  if (!data) {
    return NextResponse.json({ error: 'no data' }, { status: 400 });
  }

  const admin = createAdminClient();

  // نحاول نلاقي payment_intent بأحد الـidentifiers
  const metadata = data.metadata || {};
  const intentId = metadata.payment_intent_id;
  const gatewayPaymentId = data.id;

  let intent: IntentRow | null = null;
  if (intentId) {
    const { data: byId } = await admin
      .from('payment_intents')
      .select('*')
      .eq('id', intentId)
      .maybeSingle();
    intent = byId as IntentRow | null;
  }
  if (!intent && gatewayPaymentId) {
    const { data: byGateway } = await admin
      .from('payment_intents')
      .select('*')
      .eq('gateway', 'moyasar')
      .eq('gateway_payment_id', gatewayPaymentId)
      .maybeSingle();
    intent = byGateway as IntentRow | null;
  }

  if (!intent) {
    log.warn('no matching intent', { event: eventType });
    return NextResponse.json({ ok: true, note: 'no intent' });
  }

  // تحديد الحالة الجديدة
  let newStatus: string | null = null;
  if (eventType === 'payment_paid' || eventType === 'invoice_paid' || data.status === 'paid') {
    newStatus = 'paid';
  } else if (eventType === 'payment_failed' || data.status === 'failed') {
    newStatus = 'failed';
  } else if (eventType === 'payment_refunded' || data.status === 'refunded') {
    newStatus = 'refunded';
  } else if (eventType === 'payment_authorized' || data.status === 'authorized') {
    newStatus = 'authorized';
  }

  if (!newStatus) {
    return NextResponse.json({ ok: true, note: 'no state change' });
  }

  // تحديث
  const updates: UpdatePayload = {
    status: newStatus,
    gateway_response: data,
    method: data.source?.type || null,
  };
  if (newStatus === 'paid') {
    updates.paid_at = new Date().toISOString();
    updates.gateway_payment_id = data.id;
  }
  if (newStatus === 'refunded') {
    updates.refunded_at = new Date().toISOString();
  }
  if (newStatus === 'failed') {
    updates.failure_reason = data.source?.message || data.status || 'unknown';
  }

  const { error: updErr } = await admin
    .from('payment_intents')
    .update(updates)
    .eq('id', intent.id);

  if (updErr) {
    log.error('update failed', updErr);
    return NextResponse.json({ error: 'update failed' }, { status: 500 });
  }

  // لو ناجحة · صرف النقاط + البطاقة
  if (newStatus === 'paid') {
    await applySuccessDiscounts(admin, intent);
  }

  await auditLog({
    userId: intent.customer_id,
    action: 'auth.login',  // placeholder action
    resourceType: 'payment',
    resourceId: intent.id,
    metadata: {
      event: eventType,
      new_status: newStatus,
      amount: intent.amount,
      gateway: 'moyasar',
    },
    ipAddress: ip,
    userAgent: ua,
    success: newStatus === 'paid',
  });

  return NextResponse.json({ ok: true, status: newStatus });
}

async function applySuccessDiscounts(admin: SupabaseClient, intent: IntentRow) {
  // صرف نقاط الولاء
  if ((intent.loyalty_points_used ?? 0) > 0 && intent.customer_id) {
    const { data: pRaw } = await admin
      .from('profiles')
      .select('loyalty_points')
      .eq('id', intent.customer_id)
      .single();
    const p = pRaw as { loyalty_points: number | null } | null;
    const current = Number(p?.loyalty_points || 0);
    await admin
      .from('profiles')
      .update({ loyalty_points: Math.max(0, current - (intent.loyalty_points_used ?? 0)) })
      .eq('id', intent.customer_id);
  }
  // صرف البطاقة
  if (intent.gift_card_code && (intent.gift_card_amount ?? 0) > 0) {
    const { data: cardRaw } = await admin
      .from('gift_cards')
      .select('id, balance')
      .eq('code', intent.gift_card_code.toUpperCase())
      .single();
    const card = cardRaw as { id: string; balance: number } | null;
    if (card) {
      const newBalance = Number(card.balance) - Number(intent.gift_card_amount);
      await admin
        .from('gift_cards')
        .update({ balance: Math.max(0, newBalance), is_active: newBalance > 0 })
        .eq('id', card.id);
      await admin.from('gift_card_redemptions').insert({
        gift_card_id: card.id,
        booking_id: intent.booking_id,
        amount: intent.gift_card_amount,
        balance_after: Math.max(0, newBalance),
      });
    }
  }
}
