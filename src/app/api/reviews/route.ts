/**
 * POST /api/reviews
 * Body: { booking_number, rating, comment?, image_urls? }
 * يُنشئ تقييم عام بانتظار الموافقة
 *
 * 🔒 SECURITY: لا بد:
 *   - المستخدم مسجّل دخول
 *   - الحجز يخصّه (customer_id == user.id)
 *   - الحجز مكتمل
 *   - لم يُقيّم من قبل
 *   - Rate limit على التقييمات
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, rateLimitErrorResponse } from '@/lib/rate-limit';

const schema = z.object({
  booking_number: z.string().min(3).max(50),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  image_urls: z.array(z.string().url()).max(4).optional(),
});

export async function POST(req: NextRequest) {
  // 🔒 المستخدم لازم مسجّل دخول
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'يجب تسجيل الدخول لكتابة تقييم' },
      { status: 401 }
    );
  }

  // 🔒 Rate limit: 10 تقييمات/ساعة
  const rl = await checkRateLimit({
    key: user.id,
    category: 'review-create',
    max: 10,
    windowSec: 3600,
  });
  if (!rl.allowed) {
    return NextResponse.json(rateLimitErrorResponse(rl), { status: 429 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'بيانات غير صحيحة' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('*, items:booking_items(service_name)')
    .eq('booking_number', parsed.data.booking_number)
    .single();

  if (!booking) {
    return NextResponse.json({ error: 'الحجز غير موجود' }, { status: 404 });
  }

  // 🔒 تحقّق من أنّ الحجز يخصّ هذا المستخدم
  if (booking.customer_id !== user.id) {
    return NextResponse.json(
      { error: 'لا يمكنكِ تقييم حجز ليس لكِ' },
      { status: 403 }
    );
  }

  // لا بد يكون الحجز مكتمل
  if (booking.status !== 'completed') {
    return NextResponse.json(
      { error: 'التقييم متاح بعد اكتمال الحجز' },
      { status: 400 }
    );
  }

  // تحقق من عدم وجود تقييم سابق
  const { data: existing } = await admin
    .from('reviews')
    .select('id')
    .eq('booking_id', booking.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'سبق تقييم هذا الحجز 💛' }, { status: 400 });
  }

  const serviceNames = booking.items?.map((i: any) => i.service_name) || [];

  const { data, error } = await admin.from('reviews').insert({
    booking_id: booking.id,
    customer_id: user.id, // ← ربط صريح بالمستخدم
    customer_name: booking.customer_name,
    rating: parsed.data.rating,
    comment: parsed.data.comment || null,
    source: 'internal',
    is_approved: false,
    service_names: serviceNames,
    image_urls: parsed.data.image_urls || [],
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, review_id: data.id });
}
