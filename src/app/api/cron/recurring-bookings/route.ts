/**
 * GET /api/cron/recurring-bookings
 * ═══════════════════════════════════════════════════════════
 * يُستدعى يومياً · ينشئ حجوزات لكل recurring_booking حان موعدها
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { saudiToday, shiftIsoDate } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  const today = saudiToday();

  // كل الحجوزات المتكرّرة اللي حان موعدها اليوم
  const { data: recurring } = await admin
    .from('recurring_bookings')
    .select(`
      *,
      service:services(id, name_ar, price, duration_min),
      customer:profiles!customer_id(id, full_name, phone)
    `)
    .eq('active', true)
    .lte('next_occurrence', today);

  let created = 0;
  const results: any[] = [];

  for (const rb of recurring || []) {
    // تخطّي إذا تجاوز end_date
    if (rb.end_date && rb.end_date < today) {
      await admin.from('recurring_bookings').update({ active: false }).eq('id', rb.id);
      continue;
    }

    // إنشاء الحجز
    const bookingNumber = `TFL-R-${today.replace(/-/g, '')}-${String(rb.id.slice(0, 4))}`;
    const { data: booking, error } = await admin
      .from('bookings')
      .insert({
        customer_id: rb.customer_id,
        customer_name: rb.customer?.full_name || '',
        customer_phone: rb.customer?.phone || '',
        booking_date: rb.next_occurrence,
        booking_time: rb.preferred_time,
        duration_min: rb.service?.duration_min || 60,
        subtotal: rb.service?.price || 0,
        total: rb.service?.price || 0,
        status: rb.auto_confirm ? 'confirmed' : 'pending',
        payment_status: 'unpaid',
        source: 'recurring',
        staff_id: rb.staff_id,
        booking_number: bookingNumber,
      })
      .select()
      .single();

    if (error) {
      results.push({ id: rb.id, error: error.message });
      continue;
    }

    // إضافة booking_item
    await admin.from('booking_items').insert({
      booking_id: booking.id,
      service_id: rb.service_id,
      service_name: rb.service?.name_ar || 'خدمة',
      price: rb.service?.price || 0,
      quantity: 1,
    });

    // حساب الموعد التالي
    let nextDays = 7;
    if (rb.frequency === 'biweekly') nextDays = 14;
    else if (rb.frequency === 'monthly') nextDays = 30;

    const newNext = shiftIsoDate(rb.next_occurrence, nextDays);

    await admin
      .from('recurring_bookings')
      .update({ next_occurrence: newNext })
      .eq('id', rb.id);

    created++;
    results.push({ id: rb.id, booking: bookingNumber });
  }

  return NextResponse.json({
    ok: true,
    processed: recurring?.length || 0,
    created,
    results,
  });
}
