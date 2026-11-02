/**
 * Payment Types · أنواع الدفع المشتركة
 * ═══════════════════════════════════════════════════════════
 */
export type PaymentGateway = 'moyasar' | 'tabby' | 'tamara' | 'manual_cash';

export type PaymentMethod =
  | 'mada'
  | 'creditcard'
  | 'applepay'
  | 'stcpay'
  | 'tabby'
  | 'tamara'
  | 'cash'
  | 'gift_card'
  | 'loyalty_points';

export type PaymentStatus =
  | 'pending'       // أُنشئت العمليّة بس العميلة ما دفعت بعد
  | 'authorized'    // دُفعت لكن ما تحوّلت للحساب (hold)
  | 'paid'          // دفع ناجح
  | 'failed'        // فشل
  | 'refunded'      // استرداد كامل
  | 'partially_refunded'
  | 'cancelled';

export interface PaymentIntent {
  id: string;
  booking_id: string;
  amount: number;              // بالريال
  amount_halalas: number;      // بالهللة (للـAPIs)
  currency: 'SAR';
  gateway: PaymentGateway;
  method?: PaymentMethod;
  status: PaymentStatus;
  gateway_payment_id?: string; // id من الـprovider
  gateway_response?: any;
  loyalty_points_used?: number;
  loyalty_points_discount?: number;
  gift_card_code?: string;
  gift_card_amount?: number;
  deposit_only: boolean;       // عربون جزئي
  deposit_percentage?: number; // 25% · 50% · 100%
  created_at: string;
  paid_at?: string;
  refunded_at?: string;
}

export interface PaymentCreateOptions {
  booking_id: string;
  amount: number;              // بالريال (الـfull amount بعد خصومات العميلة)
  gateway: PaymentGateway;
  deposit_percentage?: number; // لو ودّك عربون
  loyalty_points_used?: number;
  gift_card_code?: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  description?: string;
  callback_url: string;        // رجوع بعد الدفع
}

export interface PaymentCreateResult {
  ok: boolean;
  payment_intent_id?: string;
  checkout_url?: string;       // للـredirect
  error?: string;
  gateway_response?: any;
}

export interface PaymentWebhookEvent {
  gateway: PaymentGateway;
  event_type: string;
  payment_id: string;          // our id
  gateway_payment_id: string;
  status: PaymentStatus;
  amount: number;
  raw: any;
}

/**
 * تحويل الريال للهللة (×100) للـMoyasar
 */
export function toHalalas(sar: number): number {
  return Math.round(sar * 100);
}

export function fromHalalas(halalas: number): number {
  return halalas / 100;
}
