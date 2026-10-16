/**
 * PATCH /api/account/bookings/[id] — تعديل موعد الحجز
 * DELETE /api/account/bookings/[id] — إلغاء الحجز
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/** الحد الأدنى للتعديل/الإلغاء — 24 ساعة قبل الموعد */
const MIN_HOURS_BEFORE = 24;

async function getBooking(bookingId: string, userId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from('bookings').select('*').eq('id', bookingId).single();
  if (!data) return { error: 'الحجز غير موجود', booking: null };
  if (data.customer_id !== userId) return { error: 'ليس حجزكِ', booking: null };
  return { error: null, booking: data };
}

function canModify(booking: any): { ok: boolean; reason?: string } {
  if (['cancelled', 'completed', 'no_show'].includes(booking.status)) {
    return { ok: false, reason: 'لا يمكن تعديل هذا الحجز' };
  }
  const bookingDT = new Date(`${booking.booking_date}T${booking.booking_time}`);
  const diffHours = (bookingDT.getTime() - Date.now()) / (1000 * 60 * 60);
  if (diffHours < MIN_HOURS_BEFORE) {
    return { ok: false, reason: `التعديل/الإلغاء يحتاج ${MIN_HOURS_BEFORE} ساعة قبل الموعد` };
  }
  return { ok: true };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { booking, error } = await getBooking(id, user.id);
  if (error) return NextResponse.json({ error }, { status: 404 });

  const check = canModify(booking!);
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 400 });

  const { booking_date, booking_time } = await req.json();
  if (!booking_date || !booking_time) {
    return NextResponse.json({ error: 'التاريخ والوقت مطلوبان' }, { status: 400 });
  }

  const newDT = new Date(`${booking_date}T${booking_time}`);
  if (newDT.getTime() < Date.now() + 60 * 60 * 1000) {
    return NextResponse.json({ error: 'الوقت الجديد يجب أن يكون في المستقبل' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error: updErr } = await admin.from('bookings').update({
    booking_date,
    booking_time,
    status: 'pending',  // يرجع لمعلّق لتأكده المالكة
  }).eq('id', id);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, message: 'تم تعديل الموعد — بانتظار تأكيد المالكة' });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { booking, error } = await getBooking(id, user.id);
  if (error) return NextResponse.json({ error }, { status: 404 });

  const check = canModify(booking!);
  if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 400 });

  const admin = createAdminClient();
  const { error: updErr } = await admin.from('bookings').update({
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancellation_reason: 'إلغاء من العميلة',
  }).eq('id', id);

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, message: 'تم إلغاء الحجز' });
}
