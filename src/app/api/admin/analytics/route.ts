/**
 * GET /api/admin/analytics
 * ═══════════════════════════════════════════════════════════
 * لوحة Analytics شاملة · يرجع كل الأرقام الذكيّة للمالكة
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { saudiToday, shiftIsoDate } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!p || !['owner', 'manager'].includes(p.role)) {
    return NextResponse.json({ error: 'للمالكة/المديرة فقط' }, { status: 403 });
  }

  const period = new URL(req.url).searchParams.get('period') || '30d';
  const admin = createAdminClient();

  const today = saudiToday();
  const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
  const startDate = shiftIsoDate(today, -days);
  const prevStartDate = shiftIsoDate(today, -days * 2);

  const [
    topCustomers,
    serviceRevenue,
    staffPerformance,
    monthlyRevenue,
    peakHours,
    lostCustomers,
    currentPeriodBookings,
    previousPeriodBookings,
  ] = await Promise.all([
    admin.from('v_top_customers').select('*').order('total_spent', { ascending: false }).limit(10),
    admin.from('v_service_revenue').select('*').order('total_revenue', { ascending: false }).limit(10),
    admin.from('v_staff_performance').select('*').order('total_revenue', { ascending: false }).limit(15),
    admin.from('v_monthly_revenue').select('*').order('month', { ascending: false }).limit(12),
    admin.from('v_peak_hours').select('*'),
    admin.from('v_lost_customers').select('*').order('lifetime_value', { ascending: false }).limit(20),
    admin.from('bookings').select('total, status, customer_id').gte('booking_date', startDate).lte('booking_date', today),
    admin.from('bookings').select('total, status, customer_id').gte('booking_date', prevStartDate).lt('booking_date', startDate),
  ]);

  // حساب KPIs
  const completedCurrent = (currentPeriodBookings.data || []).filter((b: any) => b.status === 'completed');
  const completedPrev = (previousPeriodBookings.data || []).filter((b: any) => b.status === 'completed');

  const revenueCur = completedCurrent.reduce((s: number, b: any) => s + Number(b.total || 0), 0);
  const revenuePrev = completedPrev.reduce((s: number, b: any) => s + Number(b.total || 0), 0);
  const revenueGrowth = revenuePrev > 0 ? ((revenueCur - revenuePrev) / revenuePrev) * 100 : 0;

  const uniqueCur = new Set(completedCurrent.map((b: any) => b.customer_id)).size;
  const uniquePrev = new Set(completedPrev.map((b: any) => b.customer_id)).size;

  const avgTicketCur = completedCurrent.length > 0 ? revenueCur / completedCurrent.length : 0;
  const avgTicketPrev = completedPrev.length > 0 ? revenuePrev / completedPrev.length : 0;

  return NextResponse.json({
    ok: true,
    period: { days, startDate, today },
    kpis: {
      revenue: { current: revenueCur, previous: revenuePrev, growth: revenueGrowth },
      bookings: { current: completedCurrent.length, previous: completedPrev.length },
      customers: { current: uniqueCur, previous: uniquePrev },
      avgTicket: { current: avgTicketCur, previous: avgTicketPrev },
    },
    topCustomers: topCustomers.data || [],
    serviceRevenue: serviceRevenue.data || [],
    staffPerformance: staffPerformance.data || [],
    monthlyRevenue: monthlyRevenue.data || [],
    peakHours: peakHours.data || [],
    lostCustomers: lostCustomers.data || [],
  });
}
