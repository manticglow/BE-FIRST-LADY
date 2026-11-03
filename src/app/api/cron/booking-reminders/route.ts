/**
 * GET /api/cron/booking-reminders
 * ═══════════════════════════════════════════════════════════
 * كرون كل 30 دقيقة · يبعث تذكير قبل الحجز:
 *   - 24 ساعة قبل الموعد (تذكير اليوم السابق)
 *   - ساعة قبل الموعد (تذكير آخر)
 *
 * Vercel cron schedule: every 30 minutes
 *
 * الحماية: CRON_SECRET في Authorization OR x-vercel-cron
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppText, formatPhoneForWhatsApp } from '@/lib/integrations/whatsapp';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  const expected = process.env.CRON_SECRET;
  if (!isVercelCron && expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const stats = { sent_24h: 0, sent_1h: 0, failed: 0, skipped: 0 };

  // ═══ 1) تذكير 24 ساعة ═══
  // نبحث عن حجوزات موعدها بين 23:30 و 24:30 من الآن (نافذة 1 ساعة حتى ما نخسر أحد)
  const t24Start = new Date(now.getTime() + 23.5 * 3600 * 1000);
  const t24End = new Date(now.getTime() + 24.5 * 3600 * 1000);
  stats.sent_24h = await sendBatch(t24Start, t24End, '24h');

  // ═══ 2) تذكير ساعة ═══
  const t1Start = new Date(now.getTime() + 45 * 60 * 1000);     // 45 دقيقة
  const t1End = new Date(now.getTime() + 75 * 60 * 1000);       // 75 دقيقة
  stats.sent_1h = await sendBatch(t1Start, t1End, '1h');

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    ...stats,
  });
}

async function sendBatch(
  from: Date, to: Date, type: '24h' | '1h',
): Promise<number> {
  const fromStr = toSqlTs(from);
  const toStr = toSqlTs(to);

  // نجلب الحجوزات في النافذة الزمنيّة · مؤكّدة أو pending · ما أُرسل لها هذا التذكير
  const reminderCol = type === '24h' ? 'reminder_24h_sent_at' : 'reminder_1h_sent_at';

  const { data: bookings, error } = await admin.rpc('get_bookings_in_window', {
    p_from: fromStr,
    p_to: toStr,
    p_reminder_col: reminderCol,
  });

  // fallback لو الـRPC مش موجود
  type ReminderBooking = {
    id: string;
    booking_date: string;
    booking_time: string;
    customer_name: string | null;
    customer_phone: string | null;
    duration_min: number | null;
    booking_number: string | null;
    items?: { service_name: string }[];
  };
  let items = bookings as ReminderBooking[] | null;
  if (error || !items) {
    const { data: fallback } = await admin
      .from('bookings')
      .select('id, booking_date, booking_time, customer_name, customer_phone, duration_min, booking_number, items:booking_items(service_name)')
      .in('status', ['pending', 'confirmed'])
      .gte('booking_date', from.toISOString().split('T')[0])
      .lte('booking_date', to.toISOString().split('T')[0]);
    items = (fallback as ReminderBooking[] | null) || [];
    // فلترة يدويّة بالوقت
    items = items.filter((b) => {
      const dt = new Date(`${b.booking_date}T${b.booking_time}`);
      return dt >= from && dt <= to;
    });
  }

  // جلب أي booking لم يُرسل له هذا التذكير بعد (من جدول booking_reminders)
  const bookingIds = items.map((b) => b.id);
  const { data: alreadySent } = await admin
    .from('booking_reminders')
    .select('booking_id')
    .in('booking_id', bookingIds.length ? bookingIds : ['00000000-0000-0000-0000-000000000000'])
    .eq('reminder_type', type);
  const sentSet = new Set(
    ((alreadySent as { booking_id: string }[] | null) || []).map((r) => r.booking_id),
  );

  let sent = 0;
  for (const b of items) {
    if (sentSet.has(b.id)) continue;

    const phone = formatPhoneForWhatsApp(b.customer_phone || '');
    if (!phone || phone.length < 11) continue;

    const serviceName = b.items?.[0]?.service_name || 'خدمتكِ';
    const timeStr = b.booking_time.slice(0, 5);
    const dateStr = new Date(b.booking_date).toLocaleDateString('ar-SA', {
      weekday: 'long', day: 'numeric', month: 'long',
    });

    const msg = type === '24h'
      ? `🌸 *تذكير · Be First Lady*

مرحباً ${b.customer_name || 'عميلتنا'} 💛

نذكّركِ بموعد حجزكِ غداً:
📅 ${dateStr}
🕐 الساعة ${timeStr}
✨ ${serviceName}

نراكِ قريباً · ننتظركِ 🌸

لتعديل أو إلغاء الحجز:
https://befirstlady.com/account/bookings`
      : `✨ *موعدكِ قريب · Be First Lady*

مرحباً ${b.customer_name || 'عميلتنا'} 💛

نذكّركِ · موعدكِ خلال ساعة:
🕐 ${timeStr}
📍 ${serviceName}

ننتظركِ 🌹
العنوان: المدينة المنوّرة`;

    const res = await sendWhatsAppText(phone, msg);
    if (res.ok) {
      sent++;
      await admin.from('booking_reminders').insert({
        booking_id: b.id,
        reminder_type: type,
        sent_at: new Date().toISOString(),
        message_id: res.messageId || null,
      });
    }
  }

  return sent;
}

function toSqlTs(d: Date): string {
  return d.toISOString();
}
