/**
 * GET /api/cron/birthday-messages
 * ═══════════════════════════════════════════════════════════
 * يُستدعى يومياً من Vercel Cron · الساعة 9 صباحاً بتوقيت السعودية
 * - يجمع كل العميلات اللي اليوم عيد ميلادهنّ
 * - يُنشئ كوبون هديّة لكل واحدة
 * - يرسل واتساب تهنئة + الكوبون
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { sendWhatsAppMessage, formatPhoneForWhatsApp } from '@/lib/integrations/whatsapp';
import { saudiToday } from '@/lib/utils';

export async function GET(req: NextRequest) {
  // تحقّق من الـauth (Vercel Cron Secret)
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
  const [, month, day] = today.split('-');
  const year = Number(today.split('-')[0]);

  // جلب العميلات اللي اليوم عيد ميلادهنّ
  const { data: celebrants } = await admin
    .from('profiles')
    .select('id, full_name, phone, birthday')
    .eq('role', 'customer')
    .not('birthday', 'is', null)
    .not('phone', 'is', null);

  const birthdayCustomers = (celebrants || []).filter((c) => {
    if (!c.birthday) return false;
    const bd = c.birthday.split('-');
    return bd[1] === month && bd[2] === day;
  });

  if (birthdayCustomers.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: 'لا يوجد أعياد ميلاد اليوم' });
  }

  const results: any[] = [];

  for (const customer of birthdayCustomers) {
    // تحقّق · هل أُرسل له في هذا العام؟
    const { data: existing } = await admin
      .from('birthday_messages')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('sent_year', year)
      .maybeSingle();

    if (existing) continue;

    // توليد كوبون ميلاد خاص (صالح 30 يوم · 25% خصم)
    const couponCode = `BDAY${customer.id.slice(0, 6).toUpperCase()}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await admin.from('coupons').insert({
      code: couponCode,
      discount_type: 'percent',
      discount_value: 25,
      max_uses: 1,
      expires_at: expiresAt.toISOString(),
      is_active: true,
      description: `هديّة ميلاد ${customer.full_name}`,
    }).select().single();

    // إرسال رسالة واتساب
    const message = `🎂 كل عام وأنتِ بألف خير يا ${customer.full_name?.split(' ')[0] || 'عزيزتي'}!

نتمنّى لكِ عاماً مليئاً بالسعادة والجمال 🌸

🎁 هديّة الميلاد: خصم 25% على أي خدمة
استخدمي الكوبون: ${couponCode}
صالح 30 يوماً

احجزي الآن: ${process.env.NEXT_PUBLIC_SITE_URL}/book?coupon=${couponCode}

💕 السيّدة الأولى`;

    const phone = formatPhoneForWhatsApp(customer.phone!);
    const sendResult = await sendWhatsAppMessage(phone, message);

    // حفظ الإرسال
    await admin.from('birthday_messages').insert({
      customer_id: customer.id,
      sent_year: year,
      message_id: sendResult.messageId,
      coupon_code: couponCode,
      gift_amount: 25,
    });

    results.push({
      customer: customer.full_name,
      sent: sendResult.ok,
      coupon: couponCode,
    });
  }

  return NextResponse.json({
    ok: true,
    sent: results.length,
    details: results,
  });
}
