/**
 * GET /api/loyalty/challenges
 * ═══════════════════════════════════════════════════════════
 * يعيد التحدّيات النشطة + تقدّم العميلة فيها
 */
import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  const admin = createAdminClient();

  // التحدّيات النشطة
  const { data: challenges } = await admin
    .from('loyalty_challenges')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  // تقدّم العميلة
  const { data: progress } = await admin
    .from('loyalty_challenge_progress')
    .select('*')
    .eq('customer_id', user.id);

  const progressMap = new Map<string, any>((progress || []).map((p: any) => [p.challenge_id, p]));

  // إحصائيّات العميلة الحيّة (لحساب التقدّم الحالي)
  const [bookingsRes, spentRes, servicesRes, referralsRes] = await Promise.all([
    admin.from('bookings').select('id', { count: 'exact', head: true })
      .eq('customer_id', user.id).eq('status', 'completed'),
    admin.from('bookings').select('total').eq('customer_id', user.id).eq('status', 'completed'),
    admin.from('booking_items').select('service_id').in('booking_id',
      (await admin.from('bookings').select('id').eq('customer_id', user.id).eq('status', 'completed')).data?.map((b) => b.id) || []),
    admin.from('referrals').select('id', { count: 'exact', head: true })
      .eq('referrer_id', user.id).in('status', ['completed_first_booking', 'rewarded']),
  ]);

  const totalVisits = bookingsRes.count || 0;
  const totalSpent = (spentRes.data || []).reduce((s: number, b: any) => s + Number(b.total || 0), 0);
  const uniqueServices = new Set((servicesRes.data || []).map((i: any) => i.service_id)).size;
  const totalReferrals = referralsRes.count || 0;

  // بناء الإجابة
  const enriched = (challenges || []).map((c) => {
    const p = progressMap.get(c.id);
    let currentValue = 0;

    switch (c.challenge_type) {
      case 'visit_count':
        currentValue = totalVisits;
        break;
      case 'spend_amount':
        currentValue = Math.floor(totalSpent);
        break;
      case 'service_specific':
        currentValue = uniqueServices;
        break;
      case 'invite_friends':
        currentValue = totalReferrals;
        break;
      case 'streak':
        currentValue = p?.current_value || 0; // محسوب يدويّاً في cron
        break;
    }

    return {
      ...c,
      currentValue: Math.min(currentValue, c.target_value),
      targetValue: c.target_value,
      percent: Math.min(100, Math.round((currentValue / c.target_value) * 100)),
      completed: currentValue >= c.target_value || p?.completed,
      claimed: p?.claimed || false,
      rewardCode: p?.reward_code,
    };
  });

  return NextResponse.json({ ok: true, challenges: enriched });
}
