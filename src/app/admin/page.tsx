/**
 * Admin Dashboard — لوحة المالكة الفاخرة
 * ═══════════════════════════════════════════════════════════
 * - تحية ديناميكية + ملخص اليوم
 * - تنبيه بارز للحجوزات المعلّقة
 * - 4 بطاقات إحصائيات ذكية مع المقارنة
 * - شريط إجراءات سريعة
 * - Timeline حجوزات اليوم
 * - رسم بياني للإيرادات + أعلى الخدمات
 */
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import StaffDashboard from '@/components/admin/StaffDashboard';
import RevenueChart from '@/components/admin/RevenueChart';
import { formatPrice } from '@/lib/utils';
import {
  CalendarCheck, DollarSign, Users, TrendingUp, TrendingDown,
  AlertCircle, Bell, Plus, Scissors, UserPlus, BarChart3,
  Clock, ChevronLeft, Phone, Sparkles, MessageCircle,
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
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  const lastMonthStart = new Date();
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  lastMonthStart.setDate(1);
  const lastMonthStartStr = lastMonthStart.toISOString().split('T')[0];

  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = user
    ? await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
    : { data: null };
  const myFirstName = me?.full_name?.split(' ')[0] || 'عزيزتي';

  // الموظفة تحصل على لوحة خاصة
  if (me?.role === 'staff' && user) {
    return <StaffDashboard userId={user.id} firstName={myFirstName} />;
  }

  const roleLabel = me?.role === 'owner' ? 'المالكة' : 'المديرة';
  const roleEmoji = me?.role === 'owner' ? '👑' : '🛡️';

  const [
    { count: todayBookings },
    { data: todayRevenue },
    { count: totalCustomers },
    { count: pendingBookings },
    { data: monthRevenue },
    { data: lastMonthRevenue },
    { data: todayBookingsList },
    { data: yesterdayRevenue },
    { data: topServices },
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
  ]);

  const todayTotal = (todayRevenue || []).reduce((s, b) => s + Number(b.total), 0);
  const yesterdayTotal = (yesterdayRevenue || []).reduce((s, b) => s + Number(b.total), 0);
  const monthTotal = (monthRevenue || []).reduce((s, b) => s + Number(b.total), 0);
  const lastMonthTotal = (lastMonthRevenue || []).reduce((s, b) => s + Number(b.total), 0);

  const todayVsYesterday = yesterdayTotal > 0 ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100) : null;
  const monthVsLastMonth = lastMonthTotal > 0 ? Math.round(((monthTotal - lastMonthTotal) / lastMonthTotal) * 100) : null;

  // أعلى الخدمات
  const serviceCount: Record<string, number> = {};
  (topServices || []).forEach((i: any) => {
    serviceCount[i.service_name] = (serviceCount[i.service_name] || 0) + 1;
  });
  const topServicesSorted = Object.entries(serviceCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const greeting = timeGreeting();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">

      {/* ═══ Hero ═══ */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mb-1">
              OWNER DASHBOARD · {roleLabel.toUpperCase()}
            </div>
            <h1 className="font-ar-display text-2xl md:text-4xl font-bold text-gold-deep dark:text-cream-50 flex items-center gap-2">
              {greeting.ar}، {myFirstName}
              <span className="text-xl md:text-3xl">{roleEmoji}</span>
            </h1>
            <p className="text-ink-soft dark:text-cream-100/60 text-sm mt-1.5">
              {new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
              {(todayBookings || 0) > 0 && (
                <> · <span className="font-bold text-gold-deep dark:text-gold-light">{todayBookings}</span> حجز اليوم</>
              )}
            </p>
          </div>

          <Link
            href="/account/attendance"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/30 text-sm font-bold hover:bg-emerald-500/20 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            تسجيل حضور/انصراف
          </Link>
        </div>
      </div>

      {/* ═══ تنبيه الحجوزات المعلّقة ═══ */}
      {(pendingBookings || 0) > 0 && (
        <Link
          href="/admin/bookings?status=pending"
          className="group block mb-6 bg-gradient-to-l from-warning/15 via-warning/10 to-transparent border-r-4 border-warning rounded-2xl p-4 md:p-5 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 md:w-6 md:h-6 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-ink dark:text-cream-50 text-sm md:text-base">
                عندك {pendingBookings} حجز معلّق يحتاج تأكيد
              </div>
              <div className="text-xs text-ink-soft dark:text-cream-100/60 mt-0.5">
                اضغطي للمراجعة والتأكيد عبر واتساب
              </div>
            </div>
            <ChevronLeft className="w-5 h-5 text-warning group-hover:-translate-x-1 transition-transform shrink-0" />
          </div>
        </Link>
      )}

      {/* ═══ 4 بطاقات إحصائيات ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <SmartStat
          icon={CalendarCheck}
          label="حجوزات اليوم"
          value={String(todayBookings || 0)}
          color="gold"
        />
        <SmartStat
          icon={DollarSign}
          label="إيرادات اليوم"
          value={formatPrice(todayTotal)}
          trend={todayVsYesterday}
          trendLabel="عن الأمس"
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
          value={formatPrice(monthTotal)}
          trend={monthVsLastMonth}
          trendLabel="عن الشهر الماضي"
          color="gold"
        />
      </div>

      {/* ═══ إجراءات سريعة ═══ */}
      <div className="mb-6 md:mb-8">
        <div className="text-xs font-en-label tracking-[0.25em] text-ink-soft dark:text-cream-100/60 mb-3">
          QUICK ACTIONS · إجراءات سريعة
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
          <QuickAction href="/admin/bookings" icon={CalendarCheck} label="الحجوزات" color="gold" />
          <QuickAction href="/admin/reminders" icon={Bell} label="تذكيرات اليوم" color="emerald" />
          <QuickAction href="/admin/services" icon={Scissors} label="الخدمات" color="violet" />
          <QuickAction href="/admin/customers" icon={UserPlus} label="العميلات" color="blue" />
          {me?.role === 'owner' && <QuickAction href="/admin/reports" icon={BarChart3} label="التقارير" color="pink" />}
          {me?.role === 'manager' && <QuickAction href="/admin/push" icon={Bell} label="الإشعارات" color="pink" />}
        </div>
      </div>

      {/* ═══ Timeline + Side ═══ */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* عمود اليسار · timeline اليوم */}
        <div className="lg:col-span-2 bg-white dark:bg-white/5 rounded-3xl border border-cream-200 dark:border-white/10 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-cream-200 dark:border-white/10 bg-gradient-to-l from-gold-light/5 to-transparent flex items-center justify-between">
            <div>
              <h3 className="font-ar-display text-lg font-bold text-gold-deep dark:text-cream-50 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                جدول اليوم
              </h3>
              <p className="text-[11px] text-ink-soft dark:text-cream-100/60 mt-0.5">
                {todayBookingsList?.length || 0} حجز مجدول
              </p>
            </div>
            <Link
              href="/admin/bookings"
              className="text-xs font-bold text-gold-deep dark:text-gold-light hover:underline flex items-center gap-1"
            >
              الكل
              <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          {!todayBookingsList || todayBookingsList.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-5xl mb-3">☕</div>
              <div className="font-ar-display font-bold text-lg text-ink dark:text-cream-50 mb-1">يوم هادئ</div>
              <div className="text-sm text-ink-soft dark:text-cream-100/60">ما فيه حجوزات اليوم</div>
            </div>
          ) : (
            <TodayTimeline bookings={todayBookingsList} />
          )}
        </div>

        {/* عمود اليمين · أعلى الخدمات + رسم */}
        <div className="space-y-6">
          {/* أعلى الخدمات */}
          <div className="bg-white dark:bg-white/5 rounded-3xl border border-cream-200 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-cream-200 dark:border-white/10 bg-gradient-to-l from-gold-light/5 to-transparent">
              <h3 className="font-ar-display text-lg font-bold text-gold-deep dark:text-cream-50 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                أعلى الخدمات
              </h3>
              <p className="text-[11px] text-ink-soft dark:text-cream-100/60 mt-0.5">هذا الشهر</p>
            </div>
            {topServicesSorted.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-soft dark:text-cream-100/60">
                لا توجد بيانات بعد
              </div>
            ) : (
              <ul className="divide-y divide-cream-100 dark:divide-white/5">
                {topServicesSorted.map(([name, count], i) => {
                  const max = topServicesSorted[0][1];
                  const width = (count / max) * 100;
                  return (
                    <li key={name} className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0
                            ${i === 0 ? 'bg-gold-deep text-cream-50' : i === 1 ? 'bg-gold-light text-ink' : 'bg-cream-200 dark:bg-white/10 text-ink-soft'}
                          `}>
                            {i + 1}
                          </span>
                          <span className="text-sm font-bold text-ink dark:text-cream-50 truncate">{name}</span>
                        </div>
                        <span className="font-en-display text-sm font-bold text-gold-deep dark:text-gold-light shrink-0">
                          {count}
                        </span>
                      </div>
                      <div className="h-1.5 bg-cream-100 dark:bg-white/5 rounded-full overflow-hidden">
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

          {/* الرسم البياني */}
          <div className="bg-white dark:bg-white/5 rounded-3xl border border-cream-200 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-cream-200 dark:border-white/10">
              <h3 className="font-ar-display text-lg font-bold text-gold-deep dark:text-cream-50 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                إيرادات الشهر
              </h3>
            </div>
            <div className="p-4">
              <RevenueChart data={monthRevenue || []} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════

function SmartStat({
  icon: Icon, label, value, trend, trendLabel, color,
}: {
  icon: any; label: string; value: string;
  trend?: number | null; trendLabel?: string;
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
    <div className="relative bg-white dark:bg-white/5 rounded-2xl md:rounded-3xl p-4 md:p-5 border border-cream-200 dark:border-white/10 shadow-sm overflow-hidden">
      <div className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-l ${bgColors.replace('/15', '').replace('/5', '')}`} />
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br ${bgColors} ${textColors} flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4 md:w-5 md:h-5" />
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
      <div className="text-[11px] md:text-xs text-ink-soft dark:text-cream-100/60 mt-0.5 font-semibold truncate">
        {label}
      </div>
      {trend !== null && trend !== undefined && trendLabel && (
        <div className="text-[9px] text-ink-soft dark:text-cream-100/40 mt-1">{trendLabel}</div>
      )}
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, color }: {
  href: string; icon: any; label: string;
  color: 'gold' | 'emerald' | 'violet' | 'blue' | 'pink';
}) {
  const colors = {
    gold:    'from-gold-light/20 to-gold-light/5 text-gold-deep hover:from-gold-deep hover:to-ink hover:text-cream-50',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-600 hover:from-emerald-500 hover:to-emerald-700 hover:text-white',
    violet:  'from-violet-500/20 to-violet-500/5 text-violet-600 hover:from-violet-500 hover:to-violet-700 hover:text-white',
    blue:    'from-blue-500/20 to-blue-500/5 text-blue-600 hover:from-blue-500 hover:to-blue-700 hover:text-white',
    pink:    'from-pink-500/20 to-pink-500/5 text-pink-600 hover:from-pink-500 hover:to-pink-700 hover:text-white',
  }[color];

  return (
    <Link
      href={href}
      className={`bg-gradient-to-br ${colors} border border-cream-200 dark:border-white/10 rounded-2xl p-3 md:p-4 flex flex-col items-center gap-1.5 transition-all hover:shadow-lg hover:scale-[1.02] text-center group`}
    >
      <Icon className="w-5 h-5 md:w-6 md:h-6" />
      <span className="font-ar-display text-xs md:text-sm font-bold">{label}</span>
    </Link>
  );
}

function TodayTimeline({ bookings }: { bookings: any[] }) {
  return (
    <div className="relative">
      <div className="absolute right-[60px] top-6 bottom-6 w-px bg-gradient-to-b from-gold-light/40 via-gold-light/20 to-transparent" aria-hidden />
      <ul className="divide-y divide-cream-100 dark:divide-white/5">
        {bookings.map((b: any) => {
          const target = new Date(`${b.booking_date}T${b.booking_time}`);
          const isPast = target < new Date();
          const isCurrent = Math.abs(target.getTime() - Date.now()) < 30 * 60 * 1000;

          return (
            <li
              key={b.id}
              className={`p-4 flex items-start gap-3 hover:bg-cream-50/50 dark:hover:bg-white/5 transition-colors relative ${
                isCurrent ? 'bg-gold-light/5' : isPast ? 'opacity-60' : ''
              }`}
            >
              <div className="relative shrink-0 text-center w-14">
                <div className={`font-en-display font-bold text-lg ${
                  isPast ? 'text-ink-soft dark:text-cream-100/40' : 'text-gold-deep dark:text-gold-light'
                }`}>
                  {b.booking_time.slice(0, 5)}
                </div>
                <div className={`absolute left-[-4px] top-2 w-3 h-3 rounded-full border-2 ${
                  isCurrent
                    ? 'bg-gold-deep border-gold-light animate-pulse'
                    : isPast
                      ? 'bg-cream-200 border-cream-300 dark:bg-white/10'
                      : 'bg-white border-gold-light dark:bg-ink'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-ink dark:text-cream-50 truncate">
                  {b.customer_name}
                </div>
                <div className="text-xs text-ink-soft dark:text-cream-100/60 mt-0.5 truncate">
                  {b.items?.map((i: any) => i.service_name).join(' · ')}
                </div>
              </div>
              <a
                href={`https://wa.me/${b.customer_phone.replace(/\D/g, '').replace(/^0/, '966')}`}
                target="_blank"
                className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center text-green-600 shrink-0"
                title="واتساب"
              >
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
