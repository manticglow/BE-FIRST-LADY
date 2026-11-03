/**
 * GET /api/payments/verify/[intentId]
 * ═══════════════════════════════════════════════════════════
 * بعد ما العميلة ترجع من بوّابة الدفع · الـclient يستدعي هذا
 * لفحص حالة الدفع لحظيّاً (ما ننتظر الـwebhook)
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { fetchMoyasarPayment } from '@/lib/payments/moyasar';
import { fetchTabbyPayment } from '@/lib/payments/tabby';
import { fetchTamaraOrder } from '@/lib/payments/tamara';

type PaymentIntentRow = {
  id: string;
  customer_id: string;
  status: string;
  gateway: 'moyasar' | 'tabby' | 'tamara';
  gateway_payment_id: string | null;
  amount: number;
  deposit_only: boolean | null;
  paid_at: string | null;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ intentId: string }> },
) {
  const { intentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const admin = createAdminClient();
  const { data: intentRaw } = await admin
    .from('payment_intents')
    .select('*')
    .eq('id', intentId)
    .single();
  const intent = intentRaw as PaymentIntentRow | null;

  if (!intent) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
  if (intent.customer_id !== user.id) {
    return NextResponse.json({ error: 'ليس لك' }, { status: 403 });
  }

  const currentStatus = intent.status;

  // لو الـstatus لسّا pending · اسألي البوّابة مباشرة
  if (currentStatus === 'pending' && intent.gateway_payment_id) {
    let gatewayStatus: string | null = null;

    if (intent.gateway === 'moyasar') {
      const p = await fetchMoyasarPayment(intent.gateway_payment_id);
      gatewayStatus = p?.status || null;
    } else if (intent.gateway === 'tabby') {
      const p = await fetchTabbyPayment(intent.gateway_payment_id);
      gatewayStatus = p?.status || null;
    } else if (intent.gateway === 'tamara') {
      const p = await fetchTamaraOrder(intent.gateway_payment_id);
      gatewayStatus = p?.status || null;
    }

    if (gatewayStatus === 'paid' || gatewayStatus === 'CAPTURED' || gatewayStatus === 'approved' || gatewayStatus === 'authorised') {
      await admin.from('payment_intents').update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      }).eq('id', intentId);
      return NextResponse.json({ status: 'paid', amount: intent.amount });
    }
    if (gatewayStatus === 'failed' || gatewayStatus === 'REJECTED') {
      await admin.from('payment_intents').update({ status: 'failed' }).eq('id', intentId);
      return NextResponse.json({ status: 'failed' });
    }
  }

  return NextResponse.json({
    status: currentStatus,
    amount: intent.amount,
    gateway: intent.gateway,
    deposit_only: intent.deposit_only,
    paid_at: intent.paid_at,
  });
}
