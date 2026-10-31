/**
 * POST /api/admin/bookings/manual
 * ═══════════════════════════════════════════════════════════
 * حجز يدوي · لعميلة walk-in أو عبر الهاتف
 * - صلاحيّة: owner/manager/staff
 * - يُنشئ حجز بحالة confirmed مباشرة
 * - خيار: paid فوري + طريقة الدفع
 * - لا يتحقّق من pending/approval
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const SAUDI_PHONE_REGEX = /^(?:\+?966|0)?5\d{8}$/;

const schema = z.object({
  customer_name: z.string().min(2).max(100).trim(),
  customer_phone: z.string().refine(
    (v) => SAUDI_PHONE_REGEX.test(v.replace(/[^0-9+]/g, '')),
    { message: 'رقم الجوال غير صحيح' }
  ),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  booking_time: z.string().regex(/^\d{2}:\d{2}$/),
  service_ids: z.array(z.string().uuid()).min(1, 'اختاري خدمة على الأقل'),
  staff_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
  // Payment
  payment_status: z.enum(['unpaid', 'paid']).default('paid'),
  payment_method: z.enum(['cash', 'card', 'transfer', 'mada', 'applepay', 'stc']).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single();
  if (!profile || !['owner', 'manager', 'staff'].includes((profile as any).role)) {
    return NextResponse.json({ error: 'ليس لديكِ صلاحية' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات غير صحيحة' }, { status: 400 });
  }

  const d = parsed.data;
  const admin = createAdminClient();

  // جلب تفاصيل الخدمات (السعر + المدّة + الاسم)
  const { data: services, error: svcErr } = await admin
    .from('services')
    .select('id, name_ar, price, duration_min, is_active')
    .in('id', d.service_ids);

  if (svcErr || !services || services.length === 0) {
    return NextResponse.json({ error: 'الخدمات غير موجودة' }, { status: 400 });
  }
  const inactive = services.filter((s: any) => !s.is_active);
  if (inactive.length > 0) {
    return NextResponse.json({ error: 'بعض الخدمات معطّلة' }, { status: 400 });
  }

  const subtotal = services.reduce((s: number, sv: any) => s + Number(sv.price), 0);
  const totalDuration = services.reduce((s: number, sv: any) => s + Number(sv.duration_min), 0);

  // تحقّق من الموظفة
  if (d.staff_id) {
    const { data: staff } = await admin
      .from('staff')
      .select('id, is_active')
      .eq('id', d.staff_id)
      .single();
    if (!staff || !(staff as any).is_active) {
      return NextResponse.json({ error: 'الموظفة غير متوفّرة' }, { status: 400 });
    }
  }

  // تحقّق من البحث عن عميلة بنفس الرقم (نربطها لو موجودة)
  const cleanPhone = d.customer_phone.replace(/[^0-9+]/g, '');
  const { data: existingCustomer } = await admin
    .from('profiles')
    .select('id')
    .eq('phone', cleanPhone)
    .eq('role', 'customer')
    .maybeSingle();
  const customer_id = (existingCustomer as any)?.id || null;

  // إنشاء الحجز
  const { data: booking, error: bookErr } = await admin
    .from('bookings')
    .insert({
      customer_id,
      customer_name: d.customer_name,
      customer_phone: cleanPhone,
      booking_date: d.booking_date,
      booking_time: d.booking_time,
      duration_min: totalDuration,
      staff_id: d.staff_id || null,
      subtotal,
      discount: 0,
      tax: 0,
      total: subtotal,
      status: 'confirmed',  // مؤكّد مباشرة · مش pending
      payment_status: d.payment_status,
      customer_notes: d.notes
        ? `[حجز يدوي من الإدارة] ${d.notes}`
        : '[حجز يدوي من الإدارة]',
    })
    .select()
    .single();

  if (bookErr) {
    console.error('Manual booking error:', bookErr);
    return NextResponse.json({ error: 'فشل إنشاء الحجز · تأكّدي من التاريخ والوقت' }, { status: 400 });
  }

  // إنشاء booking_items
  const items = services.map((s: any) => ({
    booking_id: booking.id,
    service_id: s.id,
    service_name: s.name_ar,
    price: Number(s.price),
    duration_min: Number(s.duration_min),
    quantity: 1,
  }));
  await admin.from('booking_items').insert(items);

  // إنشاء payment record لو مدفوع
  if (d.payment_status === 'paid' && d.payment_method) {
    await admin.from('payments').insert({
      booking_id: booking.id,
      amount: subtotal,
      method: d.payment_method,
      status: 'completed',
      notes: `حجز يدوي · ${(profile as any).full_name || 'الإدارة'}`,
    });
  }

  return NextResponse.json({
    ok: true,
    booking_id: booking.id,
    booking_number: booking.booking_number,
    total: subtotal,
    duration_min: totalDuration,
    message: `تم إنشاء الحجز رقم ${booking.booking_number} ✅`,
  });
}
