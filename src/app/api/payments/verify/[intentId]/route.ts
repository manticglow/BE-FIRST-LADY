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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ intentId: string }> },
) {
  const { intentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const admin = createAdminClient();
  const { data: intent } = await admin
    .from('payment_intents')
    .select('*')
    .eq('id', intentId)
    .single();

  if (!intent) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });
  if ((intent as any).customer_id !== user.id) {
    return NextResponse.json({ error: 'ليس لك' }, { status: 403 });
  }

  const currentStatus = (intent as any).status;

  // لو الـstatus لسّا pending · اسألي البوّابة مباشرة
  if (currentStatus === 'pending' && (intent as any).gateway_payment_id) {
    const gateway = (intent as any).gateway;
    let gatewayStatus: string | null = null;

    if (gateway === 'moyasar') {
      const p = await fetchMoyasarPayment((intent as any).gateway_payment_id);
      gatewayStatus = p?.status || null;
    } else if (gateway === 'tabby') {
      const p = await fetchTabbyPayment((intent as any).gateway_payment_id);
      gatewayStatus = p?.status || null;
    } else if (gateway === 'tamara') {
      const p = await fetchTamaraOrder((intent as any).gateway_payment_id);
      gatewayStatus = p?.status || null;
    }

    if (gatewayStatus === 'paid' || gatewayStatus === 'CAPTURED' || gatewayStatus === 'approved' || gatewayStatus === 'authorised') {
      await admin.from('payment_intents').update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      }).eq('id', intentId);
      return NextResponse.json({ status: 'paid', amount: (intent as any).amount });
    }
    if (gatewayStatus === 'failed' || gatewayStatus === 'REJECTED') {
      await admin.from('payment_intents').update({ status: 'failed' }).eq('id', intentId);
      return NextResponse.json({ status: 'failed' });
    }
  }

  return NextResponse.json({
    status: currentStatus,
    amount: (intent as any).amount,
    gateway: (intent as any).gateway,
    deposit_only: (intent as any).deposit_only,
    paid_at: (intent as any).paid_at,
  });
}
