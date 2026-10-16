/**
 * Moyasar Payment Gateway Integration
 * ═══════════════════════════════════════════════════════════
 * ⚙️ SETUP:
 *   1. سجّلي في moyasar.com (يحتاج سجل تجاري + حساب بنكي)
 *   2. احصلي على: Publishable Key + Secret Key
 *   3. أضيفي في .env.local:
 *      NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY=pk_test_xxx
 *      MOYASAR_SECRET_KEY=sk_test_xxx
 *      MOYASAR_WEBHOOK_SECRET=whsec_xxx
 *
 * الطرق المدعومة: مدى، فيزا، ماستر، Apple Pay، STC Pay
 */

const API_URL = 'https://api.moyasar.com/v1';

interface CreatePaymentParams {
  amount: number;              // بالريال (سيتحوّل لـ هللات)
  description: string;
  bookingId: string;
  callbackUrl: string;
  source: {
    type: 'creditcard' | 'applepay' | 'stcpay';
    [k: string]: any;
  };
}

interface PaymentResult {
  ok: boolean;
  id?: string;
  status?: string;
  transactionUrl?: string;
  error?: string;
}

export async function createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
  const secretKey = process.env.MOYASAR_SECRET_KEY;
  if (!secretKey) return { ok: false, error: 'Moyasar غير مُفعّلة' };

  try {
    const res = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
      },
      body: JSON.stringify({
        amount: Math.round(params.amount * 100), // هللة
        currency: 'SAR',
        description: params.description,
        callback_url: params.callbackUrl,
        source: params.source,
        metadata: { booking_id: params.bookingId },
      }),
    });

    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.message || 'فشل الدفع' };

    return {
      ok: true,
      id: data.id,
      status: data.status,
      transactionUrl: data.source?.transaction_url,
    };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function fetchPayment(id: string): Promise<any> {
  const secretKey = process.env.MOYASAR_SECRET_KEY;
  if (!secretKey) return null;

  const res = await fetch(`${API_URL}/payments/${id}`, {
    headers: { 'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}` },
  });
  return res.ok ? await res.json() : null;
}

export async function refundPayment(id: string, amount?: number): Promise<PaymentResult> {
  const secretKey = process.env.MOYASAR_SECRET_KEY;
  if (!secretKey) return { ok: false, error: 'Moyasar غير مُفعّلة' };

  const res = await fetch(`${API_URL}/payments/${id}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${Buffer.from(secretKey + ':').toString('base64')}`,
    },
    body: JSON.stringify(amount ? { amount: Math.round(amount * 100) } : {}),
  });

  const data = await res.json();
  return res.ok ? { ok: true, id: data.id, status: data.status } : { ok: false, error: data.message };
}
