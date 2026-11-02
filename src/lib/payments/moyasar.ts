/**
 * Moyasar Gateway · مدى + Visa + Mastercard + Apple Pay + STC Pay
 * ═══════════════════════════════════════════════════════════
 * Docs: https://docs.moyasar.com
 * - Hosted Payment Form (نسمح للعميلة تدفع من صفحة Moyasar)
 * - Webhook event: payment_paid / payment_failed
 */
import { toHalalas, PaymentCreateOptions, PaymentCreateResult } from './types';

const MOYASAR_BASE = 'https://api.moyasar.com/v1';
const MOYASAR_SECRET = process.env.MOYASAR_SECRET_KEY || '';
const MOYASAR_PUBLISHABLE = process.env.NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY || '';

export function isMoyasarConfigured(): boolean {
  return MOYASAR_SECRET.length > 0;
}

/**
 * إنشاء عمليّة دفع (invoice-style · العميلة تدخل بياناتها في form مستضافة)
 * نستخدم الـInvoices API بدل Payments لأنها تعطينا URL مباشر للـcheckout
 */
export async function createMoyasarInvoice(opts: {
  amount_sar: number;
  description: string;
  callback_url: string;
  success_url?: string;
  back_url?: string;
  metadata?: Record<string, string>;
}): Promise<PaymentCreateResult> {
  if (!isMoyasarConfigured()) {
    return { ok: false, error: 'بوّابة Moyasar غير مُفعّلة' };
  }

  try {
    const auth = 'Basic ' + Buffer.from(`${MOYASAR_SECRET}:`).toString('base64');
    const res = await fetch(`${MOYASAR_BASE}/invoices`, {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: toHalalas(opts.amount_sar),
        currency: 'SAR',
        description: opts.description,
        callback_url: opts.callback_url,
        success_url: opts.success_url || opts.callback_url,
        back_url: opts.back_url,
        metadata: opts.metadata || {},
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        ok: false,
        error: data?.message || 'فشل الاتصال مع Moyasar',
        gateway_response: data,
      };
    }

    return {
      ok: true,
      payment_intent_id: data.id,
      checkout_url: data.url,  // Moyasar hosted checkout
      gateway_response: data,
    };
  } catch (e: any) {
    return { ok: false, error: e.message || 'خطأ في Moyasar' };
  }
}

/**
 * جلب حالة دفعة من Moyasar (للتأكّد قبل تحديث الـbooking)
 */
export async function fetchMoyasarPayment(paymentId: string) {
  if (!isMoyasarConfigured()) return null;
  const auth = 'Basic ' + Buffer.from(`${MOYASAR_SECRET}:`).toString('base64');
  const res = await fetch(`${MOYASAR_BASE}/payments/${paymentId}`, {
    headers: { 'Authorization': auth },
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * استرداد دفعة (كامل أو جزئي)
 */
export async function refundMoyasarPayment(paymentId: string, amount_sar?: number) {
  if (!isMoyasarConfigured()) {
    return { ok: false, error: 'بوّابة Moyasar غير مُفعّلة' };
  }
  const auth = 'Basic ' + Buffer.from(`${MOYASAR_SECRET}:`).toString('base64');
  const body: any = {};
  if (amount_sar) body.amount = toHalalas(amount_sar);

  const res = await fetch(`${MOYASAR_BASE}/payments/${paymentId}/refund`, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

/**
 * التحقّق من webhook signature (Moyasar يبعثها في header)
 */
export function verifyMoyasarWebhook(
  signature: string | null,
  secret: string,
): boolean {
  // Moyasar webhook signature verification
  // التنفيذ البسيط · في الإنتاج استخدمي HMAC-SHA256 verification
  // المرحلة الأوّليّة · نتحقّق من وجود الـsecret المتوقّع
  return signature === secret;
}
