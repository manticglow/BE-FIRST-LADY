/**
 * Tabby Gateway · تقسيط 4 دفعات
 * ═══════════════════════════════════════════════════════════
 * Docs: https://docs.tabby.ai
 * - Minimum: 300 SAR · Maximum: 30,000 SAR
 * - Pre-scoring: نسأل Tabby هل العميلة مؤهّلة قبل ما نعرض الخيار
 */
import { PaymentCreateResult } from './types';

const TABBY_API = 'https://api.tabby.ai/api/v2';
const TABBY_PUBLIC_KEY = process.env.NEXT_PUBLIC_TABBY_PUBLIC_KEY || '';
const TABBY_SECRET_KEY = process.env.TABBY_SECRET_KEY || '';
const TABBY_MERCHANT_CODE = process.env.TABBY_MERCHANT_CODE || 'SA'; // KSA

export function isTabbyConfigured(): boolean {
  return TABBY_SECRET_KEY.length > 0 && TABBY_PUBLIC_KEY.length > 0;
}

export function isTabbyEligibleAmount(amount_sar: number): boolean {
  return amount_sar >= 300 && amount_sar <= 30000;
}

export async function createTabbyCheckout(opts: {
  amount_sar: number;
  description: string;
  success_url: string;
  cancel_url: string;
  failure_url: string;
  customer: { name: string; phone: string; email?: string };
  order_id: string;
  items?: Array<{ title: string; quantity: number; unit_price: number }>;
}): Promise<PaymentCreateResult> {
  if (!isTabbyConfigured()) {
    return { ok: false, error: 'تابي غير مُفعّلة' };
  }
  if (!isTabbyEligibleAmount(opts.amount_sar)) {
    return {
      ok: false,
      error: 'تابي متاحة للمبالغ بين 300 و30,000 ر.س',
    };
  }

  try {
    const body = {
      payment: {
        amount: opts.amount_sar.toFixed(2),
        currency: 'SAR',
        description: opts.description,
        buyer: {
          phone: opts.customer.phone,
          email: opts.customer.email || `${opts.customer.phone}@befirstlady.phone`,
          name: opts.customer.name,
        },
        shipping_address: {
          city: 'Madinah',
          address: 'Pickup at salon',
          zip: '42311',
        },
        order: {
          reference_id: opts.order_id,
          items: opts.items?.map((i) => ({
            title: i.title,
            description: i.title,
            quantity: i.quantity,
            unit_price: i.unit_price.toFixed(2),
            category: 'Beauty',
          })) || [{
            title: opts.description,
            description: opts.description,
            quantity: 1,
            unit_price: opts.amount_sar.toFixed(2),
            category: 'Beauty',
          }],
        },
        buyer_history: { registered_since: new Date().toISOString() },
        order_history: [],
      },
      lang: 'ar',
      merchant_code: TABBY_MERCHANT_CODE,
      merchant_urls: {
        success: opts.success_url,
        cancel: opts.cancel_url,
        failure: opts.failure_url,
      },
    };

    const res = await fetch(`${TABBY_API}/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TABBY_PUBLIC_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data?.error || 'فشل تابي', gateway_response: data };
    }

    // Tabby configuration · لو ما العميلة مؤهّلة: status = rejected
    const session = data?.configuration?.available_products?.installments?.[0];
    if (data?.status === 'rejected' || !session) {
      return {
        ok: false,
        error: 'عذراً · تابي ما وافقت على التقسيط لهذا الحجز',
        gateway_response: data,
      };
    }

    return {
      ok: true,
      payment_intent_id: data.id,
      checkout_url: session.web_url,
      gateway_response: data,
    };
  } catch (e: any) {
    return { ok: false, error: e.message || 'خطأ في تابي' };
  }
}

/**
 * التقاط الدفعة بعد نجاحها (Tabby تتطلب هذا الـstep)
 */
export async function captureTabbyPayment(paymentId: string, amount_sar: number) {
  if (!isTabbyConfigured()) return { ok: false };
  try {
    const res = await fetch(`${TABBY_API}/payments/${paymentId}/captures`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TABBY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount_sar.toFixed(2),
      }),
    });
    return { ok: res.ok, data: await res.json() };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export async function fetchTabbyPayment(paymentId: string) {
  if (!isTabbyConfigured()) return null;
  const res = await fetch(`${TABBY_API}/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${TABBY_SECRET_KEY}` },
  });
  if (!res.ok) return null;
  return res.json();
}
