/**
 * POST /api/payments/create
 * ═══════════════════════════════════════════════════════════
 * إنشاء عمليّة دفع لحجز موجود
 *
 * Body:
 * {
 *   booking_id: string,
 *   gateway: 'moyasar' | 'tabby' | 'tamara',
 *   deposit_only?: boolean,          // لو تبين تدفعين عربون فقط
 *   loyalty_points_used?: number,    // كم نقطة تصرفينها
 *   gift_card_code?: string,         // لو عندك بطاقة هديّة
 * }
 *
 * Response: { ok: true, checkout_url, payment_intent_id }
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createMoyasarInvoice, isMoyasarConfigured } from '@/lib/payments/moyasar';
import { createTabbyCheckout, isTabbyConfigured, isTabbyEligibleAmount } from '@/lib/payments/tabby';
import { createTamaraCheckout, isTamaraConfigured, isTamaraEligibleAmount } from '@/lib/payments/tamara';
import { auditLog, extractRequestInfo } from '@/lib/audit-log';
import { checkRateLimit, getClientIp, rateLimitErrorResponse } from '@/lib/rate-limit';

const schema = z.object({
  booking_id: z.string().uuid(),
  gateway: z.enum(['moyasar', 'tabby', 'tamara']),
  deposit_only: z.boolean().default(false),
  loyalty_points_used: z.number().int().min(0).default(0),
  gift_card_code: z.string().max(50).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'يرجى تسجيل الدخول' }, { status: 401 });

  const { ip, ua } = extractRequestInfo(req);

  // Rate limit: 10 محاولات/دقيقة
  const rl = await checkRateLimit({
    key: user.id,
    category: 'payment-create',
    max: 10,
    windowSec: 60,
  });
  if (!rl.allowed) {
    return NextResponse.json(rateLimitErrorResponse(rl), { status: 429 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }
  const d = parsed.data;
  const admin = createAdminClient();

  // ─── جلب الحجز ───
  const { data: booking, error: bErr } = await admin
    .from('bookings')
    .select('id, customer_id, total, status, payment_status, booking_date, customer_name, customer_phone')
    .eq('id', d.booking_id)
    .single();

  if (bErr || !booking) {
    return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 });
  }
  if ((booking as any).customer_id !== user.id) {
    return NextResponse.json({ error: 'ليس حجزك' }, { status: 403 });
  }
  if ((booking as any).payment_status === 'paid') {
    return NextResponse.json({ error: 'هذا الحجز مدفوع بالكامل' }, { status: 400 });
  }

  const bookingTotal = Number((booking as any).total);
  if (bookingTotal <= 0) {
    return NextResponse.json({ error: 'قيمة الحجز غير صحيحة' }, { status: 400 });
  }

  // ─── جلب profile للنقاط ───
  const { data: profile } = await admin
    .from('profiles')
    .select('loyalty_points, full_name, phone')
    .eq('id', user.id)
    .single();
  const availablePoints = Number((profile as any)?.loyalty_points || 0);

  // ─── جلب settings ───
  const { data: settings } = await admin
    .from('company_settings')
    .select('payment_deposit_pct, payment_deposit_threshold, loyalty_point_value')
    .limit(1)
    .maybeSingle();
  const depositPct = Number((settings as any)?.payment_deposit_pct || 25);
  const depositThreshold = Number((settings as any)?.payment_deposit_threshold || 500);
  const pointValue = Number((settings as any)?.loyalty_point_value || 0.10);

  // ─── حساب الخصومات ───
  let discount = 0;
  let loyaltyUsed = 0;
  let loyaltyDiscount = 0;
  let giftCardAmount = 0;

  // 1) نقاط الولاء (كل 100 نقطة = 10 ر.س، أو حسب pointValue)
  if (d.loyalty_points_used > 0) {
    loyaltyUsed = Math.min(d.loyalty_points_used, availablePoints);
    loyaltyDiscount = Math.min(loyaltyUsed * pointValue, bookingTotal);
    discount += loyaltyDiscount;
  }

  // 2) بطاقة هديّة (نتحقّق إنها نشطة ولها رصيد)
  if (d.gift_card_code) {
    const { data: card } = await admin
      .from('gift_cards')
      .select('id, code, balance, is_active, expires_at')
      .eq('code', d.gift_card_code.toUpperCase())
      .maybeSingle();
    if (!card || !(card as any).is_active || Number((card as any).balance) <= 0) {
      return NextResponse.json({ error: 'بطاقة الهديّة غير صالحة' }, { status: 400 });
    }
    if ((card as any).expires_at && new Date((card as any).expires_at) < new Date()) {
      return NextResponse.json({ error: 'بطاقة الهديّة منتهيّة' }, { status: 400 });
    }
    giftCardAmount = Math.min(Number((card as any).balance), bookingTotal - discount);
    discount += giftCardAmount;
  }

  // ─── المبلغ النهائي المطلوب دفعه ───
  let payableAmount = Math.max(0, bookingTotal - discount);

  // ─── عربون جزئي (deposit) ───
  const useDeposit = d.deposit_only && bookingTotal >= depositThreshold;
  if (useDeposit) {
    payableAmount = Math.round(payableAmount * (depositPct / 100) * 100) / 100;
  }

  // ─── الخصومات غطّت كل المبلغ ───
  if (payableAmount <= 0) {
    // سجّلي intent بـ0 ومعالجته مباشرة كـpaid
    const { data: freeIntent } = await admin
      .from('payment_intents')
      .insert({
        booking_id: d.booking_id,
        customer_id: user.id,
        amount: 0,
        gateway: d.gateway,
        status: 'paid',
        loyalty_points_used: loyaltyUsed,
        loyalty_points_discount: loyaltyDiscount,
        gift_card_code: d.gift_card_code || null,
        gift_card_amount: giftCardAmount,
        paid_at: new Date().toISOString(),
      })
      .select()
      .single();

    // اصرفي النقاط والـgift card
    await applyDiscounts(admin, user.id, loyaltyUsed, d.gift_card_code, giftCardAmount, d.booking_id);
    await auditLog({
      userId: user.id,
      action: 'auth.login',  // placeholder · ضيفي action payment في المستقبل
      metadata: { booking_id: d.booking_id, free: true, discounts: discount },
      ipAddress: ip,
      userAgent: ua,
    });

    return NextResponse.json({
      ok: true,
      free: true,
      message: 'تمّت تغطيّة المبلغ كاملاً بالخصومات · الحجز مؤكّد',
      payment_intent_id: (freeIntent as any)?.id,
    });
  }

  // ─── جلب URL الموقع ───
  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://befirstlady.com';
  const callback = `${origin}/account/bookings/${d.booking_id}?payment=returning`;
  const successUrl = `${origin}/account/bookings/${d.booking_id}?payment=success`;
  const cancelUrl = `${origin}/account/bookings/${d.booking_id}?payment=cancelled`;
  const failureUrl = `${origin}/account/bookings/${d.booking_id}?payment=failed`;
  const notificationUrl = `${origin}/api/payments/webhook/${d.gateway}`;

  // ─── إنشاء payment_intent في DB أولاً ───
  const { data: intent, error: intentErr } = await admin
    .from('payment_intents')
    .insert({
      booking_id: d.booking_id,
      customer_id: user.id,
      amount: payableAmount,
      gateway: d.gateway,
      status: 'pending',
      loyalty_points_used: loyaltyUsed,
      loyalty_points_discount: loyaltyDiscount,
      gift_card_code: d.gift_card_code || null,
      gift_card_amount: giftCardAmount,
      deposit_only: useDeposit,
      deposit_percentage: useDeposit ? depositPct : 100,
    })
    .select()
    .single();

  if (intentErr || !intent) {
    return NextResponse.json({ error: 'فشل إنشاء العمليّة' }, { status: 500 });
  }

  // ─── الاتصال بالبوّابة المناسبة ───
  const description = useDeposit
    ? `عربون حجز Be First Lady · ${depositPct}%`
    : 'حجز Be First Lady';

  let gatewayResult;
  const customer = {
    name: (booking as any).customer_name || (profile as any)?.full_name || 'عميلة',
    phone: (booking as any).customer_phone || (profile as any)?.phone || '',
  };

  switch (d.gateway) {
    case 'moyasar':
      if (!isMoyasarConfigured()) {
        return gatewayUnconfigured('Moyasar', admin, (intent as any).id);
      }
      gatewayResult = await createMoyasarInvoice({
        amount_sar: payableAmount,
        description,
        callback_url: callback,
        success_url: successUrl,
        back_url: cancelUrl,
        metadata: {
          booking_id: d.booking_id,
          payment_intent_id: (intent as any).id,
        },
      });
      break;

    case 'tabby':
      if (!isTabbyConfigured()) return gatewayUnconfigured('Tabby', admin, (intent as any).id);
      if (!isTabbyEligibleAmount(payableAmount)) {
        await admin.from('payment_intents').update({ status: 'failed', failure_reason: 'amount_out_of_range' }).eq('id', (intent as any).id);
        return NextResponse.json({ error: 'المبلغ خارج حدود تابي (300-30,000 ر.س)' }, { status: 400 });
      }
      gatewayResult = await createTabbyCheckout({
        amount_sar: payableAmount,
        description,
        success_url: successUrl,
        cancel_url: cancelUrl,
        failure_url: failureUrl,
        customer,
        order_id: (intent as any).id,
      });
      break;

    case 'tamara':
      if (!isTamaraConfigured()) return gatewayUnconfigured('Tamara', admin, (intent as any).id);
      if (!isTamaraEligibleAmount(payableAmount)) {
        await admin.from('payment_intents').update({ status: 'failed', failure_reason: 'amount_out_of_range' }).eq('id', (intent as any).id);
        return NextResponse.json({ error: 'المبلغ خارج حدود تمارا (100-15,000 ر.س)' }, { status: 400 });
      }
      gatewayResult = await createTamaraCheckout({
        amount_sar: payableAmount,
        description,
        success_url: successUrl,
        cancel_url: cancelUrl,
        failure_url: failureUrl,
        notification_url: notificationUrl,
        customer,
        order_id: (intent as any).id,
      });
      break;
  }

  if (!gatewayResult?.ok) {
    await admin
      .from('payment_intents')
      .update({
        status: 'failed',
        failure_reason: gatewayResult?.error || 'gateway_error',
        gateway_response: gatewayResult?.gateway_response,
      })
      .eq('id', (intent as any).id);
    return NextResponse.json({ error: gatewayResult?.error || 'فشل إنشاء الدفع' }, { status: 400 });
  }

  // ─── نجح · حدّثي intent بالـcheckout_url ───
  await admin
    .from('payment_intents')
    .update({
      gateway_payment_id: gatewayResult.payment_intent_id,
      checkout_url: gatewayResult.checkout_url,
      gateway_response: gatewayResult.gateway_response,
    })
    .eq('id', (intent as any).id);

  await admin
    .from('bookings')
    .update({ active_payment_intent_id: (intent as any).id })
    .eq('id', d.booking_id);

  return NextResponse.json({
    ok: true,
    payment_intent_id: (intent as any).id,
    checkout_url: gatewayResult.checkout_url,
    amount: payableAmount,
    discount_total: discount,
    deposit_only: useDeposit,
  });
}

async function gatewayUnconfigured(name: string, admin: any, intentId: string) {
  await admin.from('payment_intents').update({
    status: 'failed',
    failure_reason: 'gateway_not_configured',
  }).eq('id', intentId);
  return NextResponse.json(
    { error: `بوّابة ${name} غير مُفعّلة · يرجى اختيار طريقة أخرى` },
    { status: 503 },
  );
}

async function applyDiscounts(
  admin: any,
  userId: string,
  loyaltyPoints: number,
  giftCode: string | null | undefined,
  giftAmount: number,
  bookingId: string,
) {
  // صرف نقاط الولاء
  if (loyaltyPoints > 0) {
    await admin.rpc('deduct_loyalty_points', {
      p_user_id: userId,
      p_points: loyaltyPoints,
      p_reason: `حجز ${bookingId.slice(0, 8)}`,
    }).throwOnError().catch(async () => {
      // fallback لو الـRPC مش موجود
      const { data: p } = await admin.from('profiles').select('loyalty_points').eq('id', userId).single();
      await admin.from('profiles').update({
        loyalty_points: Math.max(0, (p as any)?.loyalty_points - loyaltyPoints),
      }).eq('id', userId);
    });
  }
  // صرف بطاقة الهديّة
  if (giftCode && giftAmount > 0) {
    const { data: card } = await admin.from('gift_cards').select('id, balance').eq('code', giftCode.toUpperCase()).single();
    if (card) {
      const newBalance = Number((card as any).balance) - giftAmount;
      await admin.from('gift_cards').update({
        balance: Math.max(0, newBalance),
        is_active: newBalance > 0,
      }).eq('id', (card as any).id);
      await admin.from('gift_card_redemptions').insert({
        gift_card_id: (card as any).id,
        booking_id: bookingId,
        amount: giftAmount,
        balance_after: Math.max(0, newBalance),
      });
    }
  }
}
