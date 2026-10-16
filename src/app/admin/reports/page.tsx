/**
 * Admin — التقارير
 * ═══════════════════════════════════════════════════════════
 * - إيرادات شهرية
 * - أعلى الخدمات
 * - أعلى العميلات إنفاقاً
 */
import { createClient } from '@/lib/supabase/server';
import RevenueChart from '@/components/admin/RevenueChart';
import { formatPrice } from '@/lib/utils';
import { TrendingUp, Trophy, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const supabase = await createClient();

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  const yearStart = new Date();
  yearStart.setMonth(0, 1);
  const yearStartStr = yearStart.toISOString().split('T')[0];

  const [
    { data: monthBookings },
    { data: yearBookings },
    { data: allBookings },
  ] = await Promise.all([
    supabase.from('bookings').select('booking_date, total').gte('booking_date', monthStartStr).eq('payment_status', 'paid'),
    supabase.from('bookings').select('booking_date, total').gte('booking_date', yearStartStr).eq('payment_status', 'paid'),
    supabase.from('bookings').select('*, items:booking_items(service_name, price)').eq('payment_status', 'paid'),
  ]);

  const monthTotal = (monthBookings || []).reduce((s, b) => s + Number(b.total), 0);
  const yearTotal = (yearBookings || []).reduce((s, b) => s + Number(b.total), 0);

  // أعلى الخدمات
  const serviceStats: Record<string, { count: number; revenue: number }> = {};
  (allBookings || []).forEach((b: any) => {
    (b.items || []).forEach((it: any) => {
      if (!serviceStats[it.service_name]) {
        serviceStats[it.service_name] = { count: 0, revenue: 0 };
      }
      serviceStats[it.service_name].count++;
      serviceStats[it.service_name].revenue += Number(it.price);
    });
  });
  const topServices = Object.entries(serviceStats)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 10);

  // أعلى العميلات
  const customerStats: Record<string, { count: number; total: number }> = {};
  (allBookings || []).forEach((b: any) => {
    if (!customerStats[b.customer_name]) {
      customerStats[b.customer_name] = { count: 0, total: 0 };
    }
    customerStats[b.customer_name].count++;
    customerStats[b.customer_name].total += Number(b.total);
  });
  const topCustomers = Object.entries(customerStats)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 10);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">التقارير</h1>
        <p className="text-ink-soft text-sm mt-1">نظرة شاملة على أداء الصالون</p>
      </div>

      {/* البطاقات */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-l from-gold-deep to-ink text-cream-50 rounded-2xl p-5">
          <div className="text-xs text-gold-light mb-1">إيرادات الشهر الحالي</div>
          <div className="font-en-display text-3xl font-bold">{formatPrice(monthTotal)}</div>
          <div className="text-xs text-gold-light mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {monthBookings?.length || 0} حجز مدفوع
          </div>
        </div>

        <div className="bg-white border border-cream-200 rounded-2xl p-5">
          <div className="text-xs text-ink-soft mb-1">إيرادات السنة</div>
          <div className="font-en-display text-3xl font-bold text-gold-deep">{formatPrice(yearTotal)}</div>
          <div className="text-xs text-ink-soft mt-2">{yearBookings?.length || 0} حجز</div>
        </div>

        <div className="bg-white border border-cream-200 rounded-2xl p-5">
          <div className="text-xs text-ink-soft mb-1">متوسط قيمة الحجز</div>
          <div className="font-en-display text-3xl font-bold text-gold-deep">
            {formatPrice(yearBookings?.length ? yearTotal / yearBookings.length : 0)}
          </div>
          <div className="text-xs text-ink-soft mt-2">{allBookings?.length || 0} حجز إجمالي</div>
        </div>
      </div>

      {/* الرسم البياني */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200 mb-8">
        <h3 className="font-ar-display text-lg font-bold text-gold-deep mb-4">
          إيرادات الشهر
        </h3>
        <RevenueChart data={monthBookings || []} />
      </div>

      {/* الجداول */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-gold-deep" />
            <h3 className="font-ar-display text-lg font-bold text-gold-deep">
              أعلى الخدمات
            </h3>
          </div>
          {topServices.length === 0 ? (
            <div className="text-sm text-ink-soft text-center py-6">لا توجد بيانات بعد</div>
          ) : (
            <ol className="space-y-2">
              {topServices.map(([name, stats], i) => (
                <li key={name} className="flex items-center justify-between py-2 border-b border-cream-100 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-gold-light/20 text-gold-deep font-en-display font-bold text-xs flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-ink truncate">{name}</span>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-xs font-bold text-ink">{stats.count}x</div>
                    <div className="text-[10px] text-ink-soft font-en-display">{formatPrice(stats.revenue)}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gold-deep" />
            <h3 className="font-ar-display text-lg font-bold text-gold-deep">
              أعلى العميلات
            </h3>
          </div>
          {topCustomers.length === 0 ? (
            <div className="text-sm text-ink-soft text-center py-6">لا توجد بيانات بعد</div>
          ) : (
            <ol className="space-y-2">
              {topCustomers.map(([name, stats], i) => (
                <li key={name} className="flex items-center justify-between py-2 border-b border-cream-100 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-gold-light/20 text-gold-deep font-en-display font-bold text-xs flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-ink truncate">{name}</span>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-xs font-bold text-ink">{stats.count}x</div>
                    <div className="text-[10px] text-gold-deep font-en-display font-bold">{formatPrice(stats.total)}</div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
