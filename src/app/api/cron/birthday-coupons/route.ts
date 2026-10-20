/**
 * GET /api/cron/birthday-coupons
 * ═══════════════════════════════════════════════════════════
 * كرون يومي · يبعث كوبون عيد ميلاد للعميلات اللي ميلادهن اليوم
 *
 * الإعداد في Vercel:
 *   vercel.json → crons → "/api/cron/birthday-coupons" · "0 9 * * *"
 *
 * الحماية:
 *   يتطلّب CRON_SECRET في request headers · "Authorization: Bearer <secret>"
 *   أو Vercel Cron يحمل التوقيع تلقائياً
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWhatsAppText } from '@/lib/integrations/whatsapp';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  // ─── حماية الـcron ───
  const authHeader = req.headers.get('authorization');
  const isVercelCron = req.headers.get('x-vercel-cron') === '1';
  const expectedToken = process.env.CRON_SECRET;

  if (!isVercelCron && expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const year = today.getFullYear();

    // ─── جلب العميلات اللي اليوم ميلادهن وما وصلهن كوبون هالسنة ───
    const { data: birthdayCustomers, error } = await admin
      .from('profiles')
      .select('id, full_name, phone, date_of_birth, birthday_coupon_sent_year')
      .not('date_of_birth', 'is', null)
      .eq('role', 'customer')
      .or(`birthday_coupon_sent_year.is.null,birthday_coupon_sent_year.lt.${year}`);

    if (error) {
      console.error('[Birthday Cron] Query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // فلترة اللي ميلادهن اليوم فعلاً (MM-DD)
    const todayBirthdays = (birthdayCustomers || []).filter((c: any) => {
      if (!c.date_of_birth) return false;
      const dob = new Date(c.date_of_birth);
      return dob.getMonth() + 1 === month && dob.getDate() === day;
    });

    if (todayBirthdays.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, message: 'ما فيه أعياد ميلاد اليوم' });
    }

    const results = [];

    for (const customer of todayBirthdays) {
      // ─── توليد كوبون عيد ميلاد (SQL function) ───
      const { data: couponResult } = await admin.rpc('generate_birthday_coupon', {
        p_customer_id: customer.id,
      });

      const code = couponResult as string;
      if (!code) {
        results.push({ customer: customer.full_name, success: false, reason: 'فشل توليد الكوبون' });
        continue;
      }

      // ─── إرسال رسالة واتساب ───
      const message = `🎉 كل عام وأنتِ بخير يا ${customer.full_name?.split(' ')[0] || 'جميلة'} 💛

🎂 بمناسبة عيد ميلادكِ · هديّتنا لكِ:
كوبون خصم 20% على خدمتكِ القادمة في Be First Lady 🌸

🎟️ الكود: ${code}
📅 ساري لمدة 30 يوم

نتشرّف باستقبالكِ · عام سعيد ومليء بالجمال ✨`;

      const sendResult = await sendWhatsAppText(customer.phone, message);
      results.push({
        customer: customer.full_name,
        success: sendResult.ok,
        code,
      });
    }

    return NextResponse.json({
      ok: true,
      date: today.toISOString().split('T')[0],
      total: todayBirthdays.length,
      results,
    });
  } catch (err: any) {
    console.error('[Birthday Cron] Exception:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
