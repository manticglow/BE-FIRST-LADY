/**
 * Tamara Gateway · تقسيط 3 دفعات
 * ═══════════════════════════════════════════════════════════
 * Docs: https://docs.tamara.co
 * - Minimum: 100 SAR · Maximum: 15,000 SAR
 */
import { PaymentCreateResult } from './types';

const TAMARA_API = process.env.TAMARA_ENV === 'production'
  ? 'https://api.tamara.co'
  : 'https://api-sandbox.tamara.co';
const TAMARA_TOKEN = process.env.TAMARA_API_TOKEN || '';

export function isTamaraConfigured(): boolean {
  return TAMARA_TOKEN.length > 0;
}

export function isTamaraEligibleAmount(amount_sar: number): boolean {
  return amount_sar >= 100 && amount_sar <= 15000;
}

export async function createTamaraCheckout(opts: {
  amount_sar: number;
  description: string;
  success_url: string;
  cancel_url: string;
  failure_url: string;
  notification_url: string;
  customer: { name: string; phone: string; email?: string };
  order_id: string;
  items?: Array<{ title: string; quantity: number; unit_price: number }>;
}): Promise<PaymentCreateResult> {
  if (!isTamaraConfigured()) {
    return { ok: false, error: 'تمارا غير مُفعّلة' };
  }
  if (!isTamaraEligibleAmount(opts.amount_sar)) {
    return {
      ok: false,
      error: 'تمارا متاحة للمبالغ بين 100 و15,000 ر.س',
    };
  }

  try {
    const [firstName, ...rest] = opts.customer.name.split(' ');
    const lastName = rest.join(' ') || firstName;

    const body = {
      order_reference_id: opts.order_id,
      total_amount: { amount: opts.amount_sar.toFixed(2), currency: 'SAR' },
      description: opts.description,
      country_code: 'SA',
      payment_type: 'PAY_BY_INSTALMENTS',
      instalments: 3,
      locale: 'ar_SA',
      items: opts.items?.map((i) => ({
        reference_id: `item-${Math.random().toString(36).slice(2, 8)}`,
        name: i.title,
        type: 'Beauty',
        quantity: i.quantity,
        unit_price: { amount: i.unit_price.toFixed(2), currency: 'SAR' },
        total_amount: {
          amount: (i.unit_price * i.quantity).toFixed(2),
          currency: 'SAR',
        },
      })) || [{
        reference_id: `item-${opts.order_id}`,
        name: opts.description,
        type: 'Beauty',
        quantity: 1,
        unit_price: { amount: opts.amount_sar.toFixed(2), currency: 'SAR' },
        total_amount: { amount: opts.amount_sar.toFixed(2), currency: 'SAR' },
      }],
      consumer: {
        first_name: firstName,
        last_name: lastName,
        phone_number: opts.customer.phone,
        email: opts.customer.email || `${opts.customer.phone}@befirstlady.phone`,
      },
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        line1: 'Pickup at salon',
        city: 'Madinah',
        country_code: 'SA',
        phone_number: opts.customer.phone,
      },
      merchant_url: {
        success: opts.success_url,
        failure: opts.failure_url,
        cancel: opts.cancel_url,
        notification: opts.notification_url,
      },
    };

    const res = await fetch(`${TAMARA_API}/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAMARA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data?.message || 'فشل تمارا', gateway_response: data };
    }

    return {
      ok: true,
      payment_intent_id: data.order_id,
      checkout_url: data.checkout_url,
      gateway_response: data,
    };
  } catch (e: any) {
    return { ok: false, error: e.message || 'خطأ في تمارا' };
  }
}

export async function fetchTamaraOrder(orderId: string) {
  if (!isTamaraConfigured()) return null;
  const res = await fetch(`${TAMARA_API}/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${TAMARA_TOKEN}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function authorizeTamaraOrder(orderId: string) {
  if (!isTamaraConfigured()) return { ok: false };
  const res = await fetch(`${TAMARA_API}/orders/${orderId}/authorise`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${TAMARA_TOKEN}` },
  });
  return { ok: res.ok, data: await res.json() };
}
