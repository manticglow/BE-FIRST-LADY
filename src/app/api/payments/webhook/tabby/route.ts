/**
 * POST /api/payments/webhook/tabby
 * Tabby webhook · يُستدعى عند تغيّر حالة طلب
 */
import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { captureTabbyPayment } from '@/lib/payments/tabby';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const admin = createAdminClient();

  // Tabby payment id
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
    // Tabby تتطلب capture بعد authorize
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

  const updates: any = { status: newStatus, gateway_response: body };
  if (newStatus === 'paid') updates.paid_at = new Date().toISOString();
  if (newStatus === 'refunded') updates.refunded_at = new Date().toISOString();

  await admin.from('payment_intents').update(updates).eq('id', (intent as any).id);

  return NextResponse.json({ ok: true, status: newStatus });
}
