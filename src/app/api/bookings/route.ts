/**
 * POST /api/bookings — إنشاء حجز جديد (عادي أو هدية)
 * GET /api/bookings — جلب حجوزات المستخدم
 * ═══════════════════════════════════════════════════════════
 * تحققات دفاعية:
 *   - التاريخ ليس في الماضي
 *   - السعة متوفرة
 *   - الموظفة متواجدة وتقدم الخدمات
 *   - الكوبون صالح (atomic)
 *   - الهدية ليست للنفس
 *   - رقم الجوال سعودي صحيح
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const SAUDI_PHONE_REGEX = /^(?:\+?966|0)?5\d{8}$/;

const bookingSchema = z.object({
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  booking_time: z.string().regex(/^\d{2}:\d{2}$/),
  customer_name: z.string().min(2).max(100).trim(),
  customer_phone: z.string().min(9).max(20).refine(
    (v) => SAUDI_PHONE_REGEX.test(v.replace(/[^0-9+]/g, '')),
    { message: 'رقم الجوال يجب أن يكون سعودي صحيح (مثال: 05xxxxxxxx)' }
  ),
  customer_notes: z.string().max(500).nullable().optional(),
  package_id: z.string().uuid().nullable().optional(),
  service_ids: z.array(z.string().uuid()).default([]),
  staff_id: z.string().uuid().nullable().optional(),
  is_gift: z.boolean().optional(),
  gift_from_name: z.string().min(2).max(100).optional(),
  gift_from_phone: z.string().refine(
    (v) => !v || SAUDI_PHONE_REGEX.test(v.replace(/[^0-9+]/g, '')),
    { message: 'رقم جوال المرسلة غير صحيح' }
  ).optional(),
  gift_message: z.string().max(300).optional(),
  coupon_code: z.string().optional(),
  gift_card_code: z.string().optional(),
  loyalty_points_used: z.number().int().min(0).optional(),
});

const POINTS_PER_SAR = 10; // كل 10 نقاط = 1 ريال

function normalizePhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('966')) return digits;
  if (digits.startsWith('0')) return '966' + digits.slice(1);
  if (digits.startsWith('5')) return '966' + digits;
  return digits;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bookingSchema.safeParse(body);

    if (!parsed.success) {
      const firstErr = parsed.error.errors[0];
      return NextResponse.json({
        error: firstErr?.message || 'بيانات غير صحيحة',
        details: parsed.error.format(),
      }, { status: 400 });
    }
    const data = parsed.data;

    // تحققات منطقية ───────────
    if (!data.package_id && data.service_ids.length === 0) {
      return NextResponse.json({ error: 'اختاري خدمة أو بكج على الأقل' }, { status: 400 });
    }

    if (data.is_gift) {
      if (!data.gift_from_name || !data.gift_from_phone) {
        return NextResponse.json({ error: 'اسم وجوال المرسِلة مطلوبان للهدية' }, { status: 400 });
      }
      // منع الإهداء للنفس
      if (normalizePhone(data.gift_from_phone) === normalizePhone(data.customer_phone)) {
        return NextResponse.json({ error: 'لا يمكن إهداء النفس 😊 — استخدمي حجز عادي' }, { status: 400 });
      }
    }

    // التاريخ ليس في الماضي
    const bookingDateTime = new Date(`${data.booking_date}T${data.booking_time}:00`);
    const now = new Date();
    if (bookingDateTime.getTime() < now.getTime() - 60 * 1000) {
      return NextResponse.json({ error: 'لا يمكن الحجز في وقت ماضٍ' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const admin = createAdminClient();

    // احسب الإجمالي والمدة ───────────
    let subtotal = 0;
    let duration = 0;
    const itemsData: any[] = [];

    if (data.package_id) {
      const { data: pkg } = await admin.from('packages').select('*').eq('id', data.package_id).eq('is_active', true).single();
      if (!pkg) return NextResponse.json({ error: 'البكج غير متوفر' }, { status: 400 });

      const { data: pkgServices } = await admin
        .from('package_services')
        .select('service:services(*)')
        .eq('package_id', data.package_id);

      subtotal = Number(pkg.price);

      if (pkgServices && pkgServices.length > 0) {
        pkgServices.forEach((row: any, i) => {
          const s = row.service;
          if (!s) return;
          duration += s.duration_min;
          itemsData.push({
            service_id: s.id,
            service_name: i === 0 ? `${pkg.name_ar} — ${s.name_ar}` : s.name_ar,
            price: i === 0 ? pkg.price : 0,
            duration_min: s.duration_min,
            quantity: 1,
          });
        });
      } else {
        duration = 60;
        itemsData.push({
          service_id: null,
          service_name: pkg.name_ar,
          price: pkg.price,
          duration_min: 60,
          quantity: 1,
        });
      }
    } else {
      const { data: services } = await admin
        .from('services')
        .select('*')
        .in('id', data.service_ids)
        .eq('is_active', true);

      if (!services || services.length !== data.service_ids.length) {
        return NextResponse.json({ error: 'بعض الخدمات غير متوفرة أو معطّلة' }, { status: 400 });
      }
      services.forEach((s) => {
        subtotal += Number(s.price);
        duration += s.duration_min;
        itemsData.push({
          service_id: s.id,
          service_name: s.name_ar,
          price: s.price,
          duration_min: s.duration_min,
          quantity: 1,
        });
      });
    }

    // التحقق من الموظفة إذا تم اختيارها ───────────
    if (data.staff_id) {
      const { data: staff } = await admin
        .from('staff')
        .select('is_active, services:staff_services(service_id)')
        .eq('id', data.staff_id)
        .single();

      if (!staff || !staff.is_active) {
        return NextResponse.json({ error: 'الموظفة غير متواجدة' }, { status: 400 });
      }

      // تحقق أنها تقدم الخدمات المختارة
      if (data.service_ids.length > 0) {
        const staffServiceIds = (staff.services || []).map((s: any) => s.service_id);
        const missing = data.service_ids.filter((id) => !staffServiceIds.includes(id));
        if (missing.length > 0) {
          return NextResponse.json({ error: 'الموظفة لا تقدم بعض الخدمات المختارة' }, { status: 400 });
        }
      }
    }

    // الكوبون — استخدم الدالة الآمنة ───────────
    let couponDiscount = 0;
    let couponCode: string | null = null;
    if (data.coupon_code) {
      const { data: coupon } = await admin
        .from('coupons')
        .select('*')
        .ilike('code', data.coupon_code.trim())
        .eq('is_active', true)
        .maybeSingle();

      if (coupon) {
        const valid = (!coupon.expires_at || new Date(coupon.expires_at) > new Date())
          && (!coupon.max_uses || coupon.used_count < coupon.max_uses)
          && subtotal >= Number(coupon.min_total);

        if (valid) {
          // زيادة atomic
          const { data: result } = await admin.rpc('use_coupon', { p_code: coupon.code });
          if (result === true) {
            couponDiscount = coupon.discount_type === 'percentage'
              ? (subtotal * Number(coupon.discount_value) / 100)
              : Math.min(Number(coupon.discount_value), subtotal);
            couponCode = coupon.code;
          }
        }
      }
    }

    // بطاقة الهدية ───────────
    let giftCardAmount = 0;
    let giftCardCode: string | null = null;
    let giftCardId: string | null = null;
    if (data.gift_card_code) {
      const { data: card } = await admin
        .from('gift_cards')
        .select('*')
        .ilike('code', data.gift_card_code.trim())
        .eq('status', 'active')
        .maybeSingle();

      if (card) {
        const notExpired = !card.expires_at || new Date(card.expires_at) > new Date();
        const subtotalAfterCoupon = Math.max(0, subtotal - couponDiscount);
        if (notExpired && Number(card.balance) > 0) {
          giftCardAmount = Math.min(Number(card.balance), subtotalAfterCoupon);
          giftCardCode = card.code;
          giftCardId = card.id;
        }
      }
    }

    // نقاط الولاء ───────────
    let loyaltyDiscount = 0;
    let loyaltyPointsUsed = 0;
    if (data.loyalty_points_used && data.loyalty_points_used > 0 && userData?.user?.id) {
      const { data: userProfile } = await admin
        .from('profiles')
        .select('loyalty_points')
        .eq('id', userData.user.id)
        .single();

      const availablePoints = Number(userProfile?.loyalty_points || 0);
      const subtotalAfter = Math.max(0, subtotal - couponDiscount - giftCardAmount);
      const maxPointsUsable = Math.min(availablePoints, subtotalAfter * POINTS_PER_SAR, data.loyalty_points_used);

      if (maxPointsUsable >= POINTS_PER_SAR) {
        loyaltyPointsUsed = Math.floor(maxPointsUsable / POINTS_PER_SAR) * POINTS_PER_SAR;
        loyaltyDiscount = loyaltyPointsUsed / POINTS_PER_SAR;
      }
    }

    const total = Math.max(0, subtotal - couponDiscount - giftCardAmount - loyaltyDiscount);

    // أنشئ الحجز ───────────
    const { data: booking, error: bookErr } = await admin
      .from('bookings')
      .insert({
        customer_id: userData?.user?.id || null,
        customer_name: data.customer_name.trim(),
        customer_phone: data.customer_phone.replace(/\s/g, ''),
        customer_notes: data.customer_notes?.trim() || null,
        booking_date: data.booking_date,
        booking_time: data.booking_time,
        duration_min: duration,
        subtotal,
        total,
        discount: couponDiscount,
        coupon_code: couponCode,
        coupon_discount: couponDiscount,
        staff_id: data.staff_id || null,
        status: 'pending',
        payment_status: 'unpaid',
        source: 'website',
        is_gift: data.is_gift || false,
        gift_from_name: data.is_gift ? data.gift_from_name?.trim() : null,
        gift_from_phone: data.is_gift ? data.gift_from_phone?.replace(/\s/g, '') : null,
        gift_message: data.is_gift ? (data.gift_message?.trim() || null) : null,
      })
      .select()
      .single();

    if (bookErr) {
      console.error('Booking error:', bookErr);
      // رسائل خطأ ودية
      if (bookErr.message.includes('conflict')) {
        return NextResponse.json({ error: 'الوقت المختار محجوز الآن — اختاري وقتاً آخر' }, { status: 409 });
      }
      if (bookErr.message.includes('no_self_gift')) {
        return NextResponse.json({ error: 'لا يمكن إهداء النفس' }, { status: 400 });
      }
      return NextResponse.json({ error: 'فشل إنشاء الحجز — تأكدي من البيانات' }, { status: 500 });
    }

    const items = itemsData.map((i) => ({ ...i, booking_id: booking.id }));
    const { error: itemsErr } = await admin.from('booking_items').insert(items);
    if (itemsErr) console.error('Items error:', itemsErr);

    // اخصمي نقاط الولاء المستخدمة ───────────
    if (loyaltyPointsUsed > 0 && userData?.user?.id) {
      await admin.rpc('deduct_loyalty_points', {
        p_user_id: userData.user.id,
        p_points: loyaltyPointsUsed,
      }).throwOnError().then(() => {}, async () => {
        // fallback: تحديث مباشر لو الـRPC مو موجود
        const { data: cur } = await admin
          .from('profiles')
          .select('loyalty_points')
          .eq('id', userData.user.id)
          .single();
        const newBalance = Math.max(0, Number(cur?.loyalty_points || 0) - loyaltyPointsUsed);
        await admin.from('profiles')
          .update({ loyalty_points: newBalance })
          .eq('id', userData.user.id);
      });
    }

    // سجّل استخدام بطاقة الهدية ───────────
    if (giftCardId && giftCardAmount > 0) {
      await admin.from('gift_card_redemptions').insert({
        gift_card_id: giftCardId,
        booking_id: booking.id,
        amount: giftCardAmount,
      });
      // قلّل الرصيد
      await admin.rpc('decrement_gift_card_balance', {
        p_card_id: giftCardId,
        p_amount: giftCardAmount,
      }).then(() => null).catch(async () => {
        // بدون RPC — تحديث مباشر
        const { data: card } = await admin.from('gift_cards').select('balance').eq('id', giftCardId).single();
        if (card) {
          const newBalance = Math.max(0, Number(card.balance) - giftCardAmount);
          await admin.from('gift_cards').update({
            balance: newBalance,
            status: newBalance <= 0 ? 'redeemed' : 'active',
          }).eq('id', giftCardId);
        }
      });
    }

    return NextResponse.json({
      ok: true,
      booking_id: booking.id,
      booking_number: booking.booking_number,
      is_gift: booking.is_gift,
      total: booking.total,
      discount: couponDiscount,
      gift_card_amount: giftCardAmount,
    });
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json({ error: err.message || 'خطأ غير متوقع' }, { status: 500 });
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { data } = await supabase
    .from('bookings')
    .select('*, items:booking_items(*)')
    .eq('customer_id', user.id)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false });

  return NextResponse.json({ bookings: data || [] });
}
