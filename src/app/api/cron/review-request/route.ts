/**
 * GET /api/cron/review-request
 * ═══════════════════════════════════════════════════════════
 * كرون يومي · يبعث طلب تقييم بعد الزيارة بـ4 ساعات
 *
 * Vercel cron: 0 * * * * (كل ساعة)
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
  // نبحث عن حجوزات مكتملة قبل 4 ساعات (±30 دقيقة) · ما طلبنا منها تقييم
  const fromStr = new Date(now.getTime() - 4.5 * 3600 * 1000).toISOString();
  const toStr = new Date(now.getTime() - 3.5 * 3600 * 1000).toISOString();

  const { data: bookings } = await admin
    .from('bookings')
    .select('id, booking_date, booking_time, customer_name, customer_phone, booking_number, items:booking_items(service_name)')
    .eq('status', 'completed')
    .is('review_request_sent_at', null)
    .gte('updated_at', fromStr)
    .lte('updated_at', toStr);

  let sent = 0;
  const list = (bookings as any[]) || [];

  for (const b of list) {
    const phone = formatPhoneForWhatsApp(b.customer_phone || '');
    if (!phone || phone.length < 11) continue;

    const serviceName = b.items?.[0]?.service_name || 'الخدمة';
    const reviewUrl = `https://befirstlady.com/review/${b.booking_number || b.id}`;

    const msg = `🌸 *شكراً لزيارتكِ · Be First Lady*

مرحباً ${b.customer_name || 'عميلتنا'} 💛

نتمنّى إنكِ استمتعتِ بتجربة ${serviceName} ✨

شاركينا رأيكِ · تقييمكِ يساعدنا نتطوّر ويلهم عميلات أخريات:
${reviewUrl}

في انتظار زيارتكِ القادمة 🌹`;

    const res = await sendWhatsAppText(phone, msg);
    if (res.ok) {
      sent++;
      await admin
        .from('bookings')
        .update({ review_request_sent_at: new Date().toISOString() })
        .eq('id', b.id);
    }
  }

  return NextResponse.json({
    ok: true,
    found: list.length,
    sent,
    timestamp: now.toISOString(),
  });
}
