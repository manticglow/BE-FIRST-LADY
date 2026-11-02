/**
 * POST /api/payments/webhook/tamara
 */
import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { authorizeTamaraOrder } from '@/lib/payments/tamara';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json();
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
    // تمارا تتطلب authorize
    const auth = await authorizeTamaraOrder(orderId);
    if (auth.ok) {
      newStatus = 'paid';
    } else {
      newStatus = 'authorized';
    }
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

  const updates: any = { status: newStatus, gateway_response: body };
  if (newStatus === 'paid') updates.paid_at = new Date().toISOString();

  await admin.from('payment_intents').update(updates).eq('id', (intent as any).id);
  return NextResponse.json({ ok: true });
}
