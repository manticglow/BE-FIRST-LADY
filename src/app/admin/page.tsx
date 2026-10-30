/**
 * Admin Dashboard v3.2 — لوحة المالكة الجذريّة
 * ═══════════════════════════════════════════════════════════
 * التصميم الجديد:
 *   1. Hero · إيرادات اليوم بشكل سينمائي
 *   2. Pending alert ذكي
 *   3. 4 stats مع ترند
 *   4. Capacity + Live Staff جنب بعض
 *   5. Timeline + Smart Insights
 *   6. Chart + Top Services
 */
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import StaffDashboard from '@/components/admin/StaffDashboard';
import RevenueChart from '@/components/admin/RevenueChart';
import SmartInsights from '@/components/admin/SmartInsights';
import LiveStaffStatus from '@/components/admin/LiveStaffStatus';
import CapacityMeter from '@/components/admin/CapacityMeter';
import { formatPrice } from '@/lib/utils';
import {
  CalendarCheck, DollarSign, Users, TrendingUp, TrendingDown,
  AlertCircle, Bell, Scissors, UserPlus, BarChart3,
  Clock, ChevronLeft, Sparkles, Crown, Shield, ArrowUpRight,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

function timeGreeting(): { ar: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { ar: 'صباح الخير', emoji: '☀️' };
  if (h < 17) return { ar: 'مساء الخير', emoji: '🌤️' };
  if (h < 20) return { ar: 'مساء النور', emoji: '🌅' };
  return { ar: 'مساء الورد', emoji: '🌙' };
}

export default async function AdminDashboard() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];
  const lastMonthStart = new Date();
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  lastMonthStart.setDate(1);
  const lastMonthStartStr = lastMonthStart.toISOString().split('T')[0];
  const weekStart = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = user
    ? await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
    : { data: null };
  const myFirstName = (me as any)?.full_name?.split(' ')[0] || 'عزيزتي';

  // الموظفة تحصل على لوحتها الخاصّة
  if ((me as any)?.role === 'staff' && user) {
    return <StaffDashboard userId={user.id} firstName={myFirstName} />;
  }

  const [
    { count: todayBookingsCount },
    { data: todayRevenueData },
    { count: totalCustomers },
    { count: pendingBookings },
    { data: monthRevenue },
    { data: lastMonthRevenue },
    { data: todayBookingsList },
    { data: yesterdayRevenue },
    { data: topServicesData },
    { data: weekBookings },
    { data: todayAllStaff },
    { count: activeStaffCount },
  ] = await Promise.all([
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_date', today),
    supabase.from('bookings').select('total').eq('booking_date', today).eq('payment_status', 'paid'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('bookings').select('booking_date, total').gte('booking_date', monthStartStr).eq('payment_status', 'paid'),
    supabase.from('bookings').select('total').gte('booking_date', lastMonthStartStr).lt('booking_date', monthStartStr).eq('payment_status', 'paid'),
    supabase.from('bookings').select('*, items:booking_items(service_name)')
      .eq('booking_date', today).neq('status', 'cancelled')
      .order('booking_time').limit(10),
    supabase.from('bookings').select('total').eq('booking_date', yesterday).eq('payment_status', 'paid'),
    supabase.from('booking_items').select('service_name').gte('created_at', monthStartStr),
    supabase.from('bookings').select('id, booking_date, booking_time, customer_name, total, status, payment_status').gte('booking_date', weekStart),
    supabase.from('bookings').select('duration_min').eq('booking_date', today).neq('status', 'cancelled'),
    supabase.from('staff').select('id', { count: 'exact', head: true }).eq('is_active', true),
  ]);

  const todayTotal = (todayRevenueData || []).reduce((s: number, b: any) => s + Number(b.total), 0);
  const yesterdayTotal = (yesterdayRevenue || []).reduce((s: number, b: any) => s + Number(b.total), 0);
  const monthTotal = (monthRevenue || []).reduce((s: number, b: any) => s + Number(b.total), 0);
  const lastMonthTotal = (lastMonthRevenue || []).reduce((s: number, b: any) => s + Number(b.total), 0);

  const todayVsYesterday = yesterdayTotal > 0 ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100) : null;
  const monthVsLastMonth = lastMonthTotal > 0 ? Math.round(((monthTotal - lastMonthTotal) / lastMonthTotal) * 100) : null;

  // الطاقة الاستيعابيّة · 8 ساعات لكل موظفة
  const bookedMinutes = (todayAllStaff || []).reduce((s: number, b: any) => s + (b.duration_min || 0), 0);
  const availableMinutes = (activeStaffCount || 0) * 8 * 60;

  // أعلى الخدمات
  const serviceCount: Record<string, number> = {};
  (topServicesData || []).forEach((i: any) => {
    serviceCount[i.service_name] = (serviceCount[i.service_name] || 0) + 1;
  });
  const topServicesSorted = Object.entries(serviceCount).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const greeting = timeGreeting();
  const roleLabel = (me as any)?.role === 'owner' ? 'المالكة' : 'المديرة';
  const RoleIcon = (me as any)?.role === 'owner' ? Crown : Shield;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">

      {/* ═══════════════════════════════════════════════════════════
          HERO · ترحيب سينمائي + الإيرادات اليوميّة الكبيرة
          ═══════════════════════════════════════════════════════════ */}
      <section className="relative bg-gradient-to-br from-gold-deep via-ink to-gold-deep rounded-3xl p-6 md:p-8 text-cream-50 overflow-hidden shadow-xl">

        {/* زخارف */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-light/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold-light/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div className="min-w-0">
              <div className="editorial-eyebrow text-gold-light/80 mb-1">OWNER COMMAND CENTER</div>
              <h1 className="font-ar-display text-3xl md:text-5xl font-bold flex items-center gap-3">
                {greeting.ar} · <span className="text-gold-light">{myFirstName}</span>
                <RoleIcon className="w-7 h-7 md:w-9 md:h-9 text-gold-light opacity-80" />
              </h1>
              <p className="text-cream-100/70 text-sm mt-2">
                {new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
              </p>
            </div>

            <Link
              href="/account/attendance"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500/20 text-emerald-200 rounded-xl border border-emerald-400/30 text-sm font-bold hover:bg-emerald-500/30 transition-colors backdrop-blur-sm"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              تسجيل حضور
            </Link>
          </div>

          {/* الإيرادات اليوميّة الكبيرة */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="editorial-eyebrow text-gold-light/80 mb-2">TODAY'S REVENUE</div>
              <div className="flex items-end gap-4 flex-wrap">
                <div className="font-en-display font-bold text-5xl md:text-6xl lg:text-7xl text-cream-50 leading-none">
                  {formatPrice(todayTotal, { showFrom: false })}
                </div>
                {todayVsYesterday !== null && (
                  <div className={`flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-full backdrop-blur-sm ${
                    todayVsYesterday >= 0
                      ? 'text-emerald-200 bg-emerald-500/20'
                      : 'text-rose-200 bg-rose-500/20'
                  }`}>
                    {todayVsYesterday >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {Math.abs(todayVsYesterday)}% عن الأمس
                  </div>
                )}
              </div>
              <div className="text-cream-100/70 text-sm mt-2">
                {todayBookingsCount || 0} حجز اليوم · {bookedMinutes >= 60 ? Math.floor(bookedMinutes / 60) + 'س' : bookedMinutes + 'د'} عمل مجدول
              </div>
            </div>

            {/* بطاقة شهريّة */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15">
              <div className="editorial-eyebrow text-gold-light/80 mb-1">THIS MONTH</div>
              <div className="font-en-display font-bold text-2xl md:text-3xl text-cream-50 leading-none">
                {formatPrice(monthTotal, { showFrom: false })}
              </div>
              {monthVsLastMonth !== null && (
                <div className="mt-2 flex items-center gap-1 text-xs text-cream-100/80">
                  {monthVsLastMonth >= 0 ? <TrendingUp className="w-3 h-3 text-emerald-400" /> : <TrendingDown className="w-3 h-3 text-rose-400" />}
                  <span className={monthVsLastMonth >= 0 ? 'text-emerald-200' : 'text-rose-200'}>
                    {Math.abs(monthVsLastMonth)}%
                  </span>
                  <span>عن الشهر الماضي</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PENDING ALERT · تنبيه الحجوزات المعلّقة
          ═══════════════════════════════════════════════════════════ */}
      {(pendingBookings || 0) > 0 && (
        <Link
          href="/admin/bookings?status=pending"
          className="group block bg-gradient-to-l from-amber-50 via-white to-white border border-amber-200 rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-600 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-ink text-base">
                {pendingBookings} حجز معلّق يحتاج تأكيد
              </div>
              <div className="text-xs text-ink-soft mt-0.5">
                اضغطي للمراجعة والتأكيد السريع عبر واتساب
              </div>
            </div>
            <ArrowUpRight className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform shrink-0" />
          </div>
        </Link>
      )}

      {/* ═══════════════════════════════════════════════════════════
          2 بطاقات رئيسيّة · Capacity + Live Staff Status
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-2 gap-5">
        <CapacityMeter
          bookedMinutes={bookedMinutes}
          availableMinutes={availableMinutes}
          totalBookings={todayBookingsCount || 0}
          activeStaffCount={activeStaffCount || 0}
        />
        <LiveStaffStatus />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          إحصائيّات ذكيّة
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <SmartStat
          icon={CalendarCheck}
          label="حجوزات اليوم"
          value={String(todayBookingsCount || 0)}
          color="gold"
        />
        <SmartStat
          icon={DollarSign}
          label="إيرادات اليوم"
          value={formatPrice(todayTotal, { showFrom: false })}
          trend={todayVsYesterday}
          color="emerald"
        />
        <SmartStat
          icon={Users}
          label="إجمالي العميلات"
          value={String(totalCustomers || 0)}
          color="violet"
        />
        <SmartStat
          icon={TrendingUp}
          label="إيرادات الشهر"
          value={formatPrice(monthTotal, { showFrom: false })}
          trend={monthVsLastMonth}
          color="gold"
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          إجراءات سريعة
          ═══════════════════════════════════════════════════════════ */}
      <div>
        <div className="editorial-eyebrow text-ink-soft mb-3">QUICK ACTIONS · إجراءات سريعة</div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
          <QuickAction href="/admin/bookings" icon={CalendarCheck} label="الحجوزات" color="gold" />
          <QuickAction href="/admin/reminders" icon={Bell} label="تذكيرات اليوم" color="emerald" />
          <QuickAction href="/admin/services" icon={Scissors} label="الخدمات" color="violet" />
          <QuickAction href="/admin/customers" icon={UserPlus} label="العميلات" color="blue" />
          {(me as any)?.role === 'owner' && (
            <QuickAction href="/admin/reports" icon={BarChart3} label="التقارير" color="rose" />
          )}
          {(me as any)?.role === 'manager' && (
            <QuickAction href="/admin/push" icon={Bell} label="الإشعارات" color="rose" />
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Timeline + Insights
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Timeline اليوم */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-cream-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-cream-200 bg-gradient-to-l from-gold-light/5 to-transparent flex items-center justify-between">
            <div>
              <h3 className="font-ar-display text-lg font-bold text-gold-deep flex items-center gap-2">
                <Clock className="w-5 h-5" />
                جدول اليوم
              </h3>
              <p className="text-[11px] text-ink-soft mt-0.5">
                {todayBookingsList?.length || 0} حجز مجدول
              </p>
            </div>
            <Link href="/admin/bookings" className="text-xs font-bold text-gold-deep hover:underline flex items-center gap-1">
              الكل <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>

          {!todayBookingsList || todayBookingsList.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-5xl mb-3">☕</div>
              <div className="font-ar-display font-bold text-lg text-ink mb-1">يوم هادئ</div>
              <div className="text-sm text-ink-soft">ما فيه حجوزات اليوم</div>
            </div>
          ) : (
            <TodayTimeline bookings={todayBookingsList as any[]} />
          )}
        </div>

        {/* Smart Insights */}
        <div className="space-y-5">
          <SmartInsights weekBookings={(weekBookings || []) as any} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Chart + Top Services
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* الرسم البياني */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-cream-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-cream-200">
            <h3 className="font-ar-display text-lg font-bold text-gold-deep flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              إيرادات الشهر
            </h3>
            <p className="text-[11px] text-ink-soft mt-0.5">تطوّر الإيرادات اليوميّة</p>
          </div>
          <div className="p-4">
            <RevenueChart data={monthRevenue || []} />
          </div>
        </div>

        {/* أعلى الخدمات */}
        <div className="bg-white rounded-3xl border border-cream-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-cream-200 bg-gradient-to-l from-gold-light/5 to-transparent">
            <h3 className="font-ar-display text-lg font-bold text-gold-deep flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              أعلى الخدمات
            </h3>
            <p className="text-[11px] text-ink-soft mt-0.5">هذا الشهر</p>
          </div>
          {topServicesSorted.length === 0 ? (
            <div className="p-8 text-center text-sm text-ink-soft">
              لا توجد بيانات بعد
            </div>
          ) : (
            <ul className="divide-y divide-cream-100">
              {topServicesSorted.map(([name, count], i) => {
                const max = topServicesSorted[0][1];
                const width = (count / max) * 100;
                return (
                  <li key={name} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`
                          w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                          ${i === 0 ? 'bg-gold-deep text-cream-50' : i === 1 ? 'bg-gold-light text-ink' : 'bg-cream-200 text-ink-soft'}
                        `}>
                          {i + 1}
                        </span>
                        <span className="text-sm font-bold text-ink truncate">{name}</span>
                      </div>
                      <span className="font-en-display text-sm font-bold text-gold-deep shrink-0">
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 bg-cream-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-gold-deep to-gold-light rounded-full"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

function SmartStat({
  icon: Icon, label, value, trend, color,
}: {
  icon: any; label: string; value: string;
  trend?: number | null;
  color: 'gold' | 'emerald' | 'violet' | 'blue';
}) {
  const bgColors = {
    gold:    'from-gold-light/15 to-gold-light/5',
    emerald: 'from-emerald-500/15 to-emerald-500/5',
    violet:  'from-violet-500/15 to-violet-500/5',
    blue:    'from-blue-500/15 to-blue-500/5',
  }[color];
  const textColors = {
    gold: 'text-gold-deep', emerald: 'text-emerald-600',
    violet: 'text-violet-600', blue: 'text-blue-600',
  }[color];

  return (
    <div className="relative bg-white rounded-2xl md:rounded-3xl p-4 md:p-5 border border-cream-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={`w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-to-br ${bgColors} ${textColors} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== null && trend !== undefined && (
          <div className={`flex items-center gap-0.5 text-[10px] md:text-xs font-bold px-1.5 py-0.5 rounded-full ${
            trend >= 0 ? 'text-emerald-600 bg-emerald-500/10' : 'text-rose-600 bg-rose-500/10'
          }`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className={`font-en-display text-xl md:text-2xl font-bold ${textColors} truncate`}>
        {value}
      </div>
      <div className="text-[11px] md:text-xs text-ink-soft mt-0.5 font-semibold truncate">
        {label}
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, color }: { href: string; icon: any; label: string; color: string }) {
  const bg = {
    gold: 'bg-gold-light/15 hover:bg-gold-light/25 text-gold-deep',
    emerald: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700',
    violet: 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-700',
    blue: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-700',
    rose: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-700',
  }[color] || 'bg-cream-100 text-ink';

  return (
    <Link
      href={href}
      className={`${bg} rounded-2xl p-3 md:p-4 flex items-center gap-2.5 transition-colors border border-transparent hover:border-current/20`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-xs md:text-sm font-bold truncate">{label}</span>
    </Link>
  );
}

function TodayTimeline({ bookings }: { bookings: any[] }) {
  return (
    <ul className="divide-y divide-cream-100">
      {bookings.map((b) => {
        const statusColors: Record<string, string> = {
          pending: 'bg-amber-100 text-amber-700 border-amber-200',
          confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
          completed: 'bg-slate-100 text-slate-700 border-slate-200',
        };
        const statusLabels: Record<string, string> = {
          pending: 'معلّق',
          confirmed: 'مؤكّد',
          in_progress: 'جارِ',
          completed: 'مكتمل',
        };
        return (
          <li key={b.id} className="px-4 py-3 flex items-center gap-3 hover:bg-cream-50/50 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-light/20 to-cream-100 flex flex-col items-center justify-center shrink-0">
              <span className="font-en-display font-bold text-sm text-gold-deep leading-none">
                {b.booking_time.slice(0, 5)}
              </span>
              <span className="text-[9px] text-ink-soft mt-0.5">{b.duration_min}د</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-ink truncate">{b.customer_name}</div>
              <div className="text-[11px] text-ink-soft truncate">
                {(b.items || []).map((i: any) => i.service_name).join(' · ') || 'خدمة'}
              </div>
            </div>
            <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 shrink-0 ${statusColors[b.status] || statusColors.pending}`}>
              {statusLabels[b.status] || b.status}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
