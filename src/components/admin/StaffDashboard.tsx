/**
 * StaffDashboard — لوحة الموظفة · تصميم فاخر
 * ═══════════════════════════════════════════════════════════
 * - تحية مخصصة حسب الوقت
 * - بطاقة الحضور الذكية (مع الوقت المنقضي)
 * - "موعدك القادم" مع عداد تنازلي
 * - Timeline اليوم بتصميم مرئي
 * - إحصائيات شهرية
 */
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  Calendar, Clock, Users, Phone, Award, Umbrella,
  CheckCircle2, PlayCircle, Timer, MessageCircle, MapPin, Sparkles,
} from 'lucide-react';

function timeGreeting(): { ar: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { ar: 'صباح الخير', emoji: '☀️' };
  if (h < 17) return { ar: 'مساء الخير', emoji: '🌤️' };
  if (h < 20) return { ar: 'مساء النور', emoji: '🌅' };
  return { ar: 'مساء الورد', emoji: '🌙' };
}

function minutesUntil(dateStr: string, timeStr: string): number {
  const target = new Date(`${dateStr}T${timeStr}`);
  return Math.round((target.getTime() - Date.now()) / 60000);
}

export default async function StaffDashboard({ userId, firstName }: { userId: string; firstName: string }) {
  const supabase = await createClient();
  const todayStr = new Date().toISOString().split('T')[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date();
  monthStart.setDate(1);

  const { data: staffRecord } = await supabase.from('staff').select('id').eq('profile_id', userId).maybeSingle();
  const staffId = staffRecord?.id;

  const [
    { data: todayBookings },
    { data: weekBookings },
    { data: openAttendance },
    { data: monthAttendance },
    { data: pendingLeaves },
    { data: monthBookings },
  ] = await Promise.all([
    staffId
      ? supabase.from('bookings').select('*, items:booking_items(service_name, service_price)')
          .eq('staff_id', staffId).eq('booking_date', todayStr)
          .not('status', 'in', '(cancelled,no_show)')
          .order('booking_time')
      : Promise.resolve({ data: [] }),

    staffId
      ? supabase.from('bookings').select('id, booking_date, total, payment_status')
          .eq('staff_id', staffId).gte('booking_date', weekStart.toISOString().split('T')[0])
          .not('status', 'in', '(cancelled,no_show)')
      : Promise.resolve({ data: [] }),

    supabase.from('attendance_records').select('check_in_at')
      .eq('user_id', userId).is('check_out_at', null).maybeSingle(),

    supabase.from('attendance_records').select('total_minutes')
      .eq('user_id', userId).gte('check_in_at', monthStart.toISOString())
      .not('total_minutes', 'is', null),

    supabase.from('leave_requests').select('id, start_date, end_date, leave_type')
      .eq('user_id', userId).eq('status', 'pending'),

    staffId
      ? supabase.from('bookings').select('id, total')
          .eq('staff_id', staffId).gte('booking_date', monthStart.toISOString().split('T')[0])
          .eq('status', 'completed')
      : Promise.resolve({ data: [] }),
  ]);

  const monthMinutes = (monthAttendance || []).reduce((s: number, r: any) => s + (r.total_minutes || 0), 0);
  const monthHours = Math.floor(monthMinutes / 60);
  const weekBookingsCount = weekBookings?.length || 0;
  const monthServiceCount = monthBookings?.length || 0;
  const monthRevenue = (monthBookings || []).reduce((s, b: any) => s + Number(b.total || 0), 0);
  const isCheckedIn = !!openAttendance;
  const checkInTime = openAttendance ? new Date(openAttendance.check_in_at) : null;
  const workedMinutes = checkInTime ? Math.floor((Date.now() - checkInTime.getTime()) / 60000) : 0;
  const workedHours = Math.floor(workedMinutes / 60);
  const workedMins = workedMinutes % 60;

  // الموعد القادم اليوم
  const now = new Date();
  const nextBooking = (todayBookings || []).find((b: any) => {
    const t = new Date(`${b.booking_date}T${b.booking_time}`);
    return t > now;
  }) as any;
  const minsToNext = nextBooking ? minutesUntil(nextBooking.booking_date, nextBooking.booking_time) : null;

  const greeting = timeGreeting();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">

      {/* ═══ Hero ═══ */}
      <div className="mb-6 md:mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-en-label text-[10px] tracking-[0.3em] text-gold-light">
                STAFF DASHBOARD
              </span>
            </div>
            <h1 className="font-ar-display text-2xl md:text-4xl font-bold text-gold-deep dark:text-cream-50">
              {greeting.ar}، {firstName} {greeting.emoji}
            </h1>
            <p className="text-ink-soft dark:text-cream-100/60 text-sm mt-1.5">
              {new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
              {todayBookings && todayBookings.length > 0 && (
                <span> · عندك <span className="font-bold text-gold-deep dark:text-gold-light">{todayBookings.length}</span> حجوزات اليوم</span>
              )}
            </p>
          </div>

          {/* زر الحضور — بارز */}
          <Link
            href="/account/attendance"
            className={`
              group relative inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl text-sm font-bold shadow-lg transition-all hover:scale-[1.02]
              ${isCheckedIn
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-emerald-500/30'
                : 'bg-gradient-to-br from-gold-deep to-ink text-cream-50 shadow-gold-deep/30'}
            `}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${isCheckedIn ? 'bg-white animate-pulse' : 'bg-gold-light'}`} />
            {isCheckedIn
              ? <span>في العمل منذ {workedHours > 0 ? `${workedHours}س ` : ''}{workedMins}د</span>
              : <span>تسجيل حضور</span>}
          </Link>
        </div>
      </div>

      {/* ═══ الموعد القادم (إذا موجود) ═══ */}
      {nextBooking && minsToNext !== null && minsToNext >= 0 && (
        <div className="mb-6 bg-gradient-to-br from-gold-deep via-gold-deep to-ink text-cream-50 rounded-3xl p-5 md:p-6 shadow-xl shadow-gold-deep/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 opacity-10">
            <Sparkles className="w-40 h-40" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-en-label text-[10px] tracking-[0.3em] text-gold-light">NEXT APPOINTMENT</span>
              {minsToNext < 30 && (
                <span className="bg-cream-50/15 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-bold text-cream-50 animate-pulse">
                  قريباً جداً
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-en-display text-4xl md:text-5xl font-bold">
                {nextBooking.booking_time.slice(0, 5)}
              </span>
              <span className="text-sm text-gold-light">
                {minsToNext < 60
                  ? `بعد ${minsToNext} دقيقة`
                  : `بعد ${Math.floor(minsToNext / 60)}س ${minsToNext % 60}د`}
              </span>
            </div>
            <div className="font-ar-display text-xl md:text-2xl font-bold mb-1">
              {nextBooking.customer_name}
            </div>
            <div className="text-sm text-cream-100/80 mb-4">
              {nextBooking.items?.map((i: any) => i.service_name).join('، ')}
            </div>
            {nextBooking.customer_notes && (
              <div className="bg-cream-50/10 backdrop-blur rounded-xl p-3 text-xs text-cream-100/90 mb-4 border border-gold-light/20">
                📝 {nextBooking.customer_notes}
              </div>
            )}
            <div className="flex items-center gap-2">
              <a
                href={`tel:${nextBooking.customer_phone}`}
                className="bg-cream-50/15 hover:bg-cream-50/25 backdrop-blur text-cream-50 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                اتصلي
              </a>
              <a
                href={`https://wa.me/${nextBooking.customer_phone.replace(/\D/g, '').replace(/^0/, '966')}`}
                target="_blank"
                className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                واتساب
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ═══ إحصائيات شهرية ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <MetricCard icon={CheckCircle2} label="أنجزتِ هذا الشهر" value={String(monthServiceCount)} suffix="خدمة" color="emerald" />
        <MetricCard icon={Calendar} label="هذا الأسبوع" value={String(weekBookingsCount)} suffix="حجز" color="gold" />
        <MetricCard icon={Clock} label="ساعاتكِ الشهرية" value={String(monthHours)} suffix="ساعة" color="blue" />
        <MetricCard icon={Umbrella} label="إجازات معلّقة" value={String(pendingLeaves?.length || 0)} color="violet" />
      </div>

      {/* ═══ جدول اليوم ═══ */}
      <div className="bg-white dark:bg-white/5 rounded-3xl border border-cream-200 dark:border-white/10 overflow-hidden mb-6 shadow-sm">
        <div className="px-5 py-4 border-b border-cream-200 dark:border-white/10 bg-gradient-to-l from-gold-light/5 to-transparent flex items-center justify-between">
          <div>
            <h3 className="font-ar-display text-lg font-bold text-gold-deep dark:text-cream-50 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              جدولكِ اليوم
            </h3>
            <p className="text-[11px] text-ink-soft dark:text-cream-100/60 mt-0.5">
              {todayBookings?.length || 0} حجز مجدول
            </p>
          </div>
          <div className="text-[10px] font-en-display text-ink-soft dark:text-cream-100/60">
            {new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }).format(new Date())}
          </div>
        </div>

        {!staffId ? (
          <EmptyState
            emoji="🔗"
            title="لم يتم ربط حسابكِ بعد"
            subtitle="تواصلي مع المالكة لربط حسابكِ بالموظفة"
          />
        ) : !todayBookings || todayBookings.length === 0 ? (
          <EmptyState
            emoji="☕"
            title="يوم هادئ"
            subtitle="لا توجد حجوزات لكِ اليوم · استريحي 💛"
          />
        ) : (
          <TimelineList bookings={todayBookings} />
        )}
      </div>

      {/* ═══ روابط سريعة ═══ */}
      <div className="grid sm:grid-cols-2 gap-3">
        <QuickLink
          href="/account/leaves"
          icon={Umbrella}
          title="طلبات الإجازة"
          subtitle="قدّمي أو تابعي طلباتكِ"
          badge={(pendingLeaves?.length || 0) > 0 ? String(pendingLeaves!.length) : undefined}
        />
        <QuickLink
          href="/account/attendance"
          icon={Timer}
          title="سجل حضوركِ"
          subtitle="آخر 14 يوم من الحضور والساعات"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════

function MetricCard({ icon: Icon, label, value, suffix, color }: {
  icon: any; label: string; value: string; suffix?: string;
  color: 'gold' | 'emerald' | 'blue' | 'violet';
}) {
  const colors = {
    gold:    'from-gold-light/10 to-gold-light/5 text-gold-deep',
    emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600',
    blue:    'from-blue-500/10 to-blue-500/5 text-blue-600',
    violet:  'from-violet-500/10 to-violet-500/5 text-violet-600',
  }[color];

  return (
    <div className="bg-white dark:bg-white/5 rounded-2xl p-4 md:p-5 border border-cream-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex items-baseline gap-1">
        <div className="font-en-display text-2xl md:text-3xl font-bold text-ink dark:text-cream-50">
          {value}
        </div>
        {suffix && <div className="text-xs text-ink-soft dark:text-cream-100/60">{suffix}</div>}
      </div>
      <div className="text-[11px] md:text-xs text-ink-soft dark:text-cream-100/60 mt-1 font-semibold">{label}</div>
    </div>
  );
}

function TimelineList({ bookings }: { bookings: any[] }) {
  return (
    <div className="relative">
      {/* الخط الزمني العمودي */}
      <div className="absolute right-[52px] top-6 bottom-6 w-px bg-gradient-to-b from-gold-light/40 via-gold-light/20 to-transparent" aria-hidden />

      <ul className="divide-y divide-cream-100 dark:divide-white/5">
        {bookings.map((b: any) => {
          const target = new Date(`${b.booking_date}T${b.booking_time}`);
          const isPast = target < new Date();
          const isCurrent = Math.abs(target.getTime() - Date.now()) < 30 * 60 * 1000;

          return (
            <li
              key={b.id}
              className={`p-4 md:p-5 flex items-start gap-4 hover:bg-cream-50/50 dark:hover:bg-white/5 transition-colors relative ${
                isCurrent ? 'bg-gold-light/5' : isPast ? 'opacity-50' : ''
              }`}
            >
              {/* عمود الوقت */}
              <div className="relative shrink-0 text-center w-14">
                <div className={`font-en-display font-bold text-lg md:text-xl ${
                  isPast ? 'text-ink-soft dark:text-cream-100/40' : 'text-gold-deep dark:text-gold-light'
                }`}>
                  {b.booking_time.slice(0, 5)}
                </div>
                <div className="text-[9px] text-ink-soft dark:text-cream-100/60 mt-0.5">
                  {b.duration_min}د
                </div>
                {/* النقطة على الـtimeline */}
                <div className={`absolute left-[-4px] top-2 w-3 h-3 rounded-full border-2 ${
                  isCurrent
                    ? 'bg-gold-deep border-gold-light shadow-lg shadow-gold-deep/30 animate-pulse'
                    : isPast
                      ? 'bg-cream-200 border-cream-300 dark:bg-white/10 dark:border-white/20'
                      : 'bg-white border-gold-light dark:bg-ink dark:border-gold-deep'
                }`} />
              </div>

              {/* المحتوى */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm md:text-base text-ink dark:text-cream-50">
                    {b.customer_name}
                  </span>
                  <StatusBadge status={b.status} />
                </div>
                <div className="text-xs text-ink-soft dark:text-cream-100/60 mt-1">
                  {b.items?.map((i: any) => i.service_name).join(' · ')}
                </div>
                {b.customer_notes && (
                  <div className="mt-2 text-[11px] text-ink-soft dark:text-cream-100/60 bg-cream-50 dark:bg-white/5 border-r-2 border-gold-light rounded px-2 py-1 inline-block">
                    📝 {b.customer_notes}
                  </div>
                )}
              </div>

              {/* أزرار التواصل */}
              <div className="shrink-0 flex items-center gap-1.5">
                <a
                  href={`tel:${b.customer_phone}`}
                  className="w-8 h-8 rounded-full bg-cream-100 dark:bg-white/10 hover:bg-gold-light/20 flex items-center justify-center text-ink-soft hover:text-gold-deep transition-colors"
                  title="اتصلي"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
                <a
                  href={`https://wa.me/${b.customer_phone.replace(/\D/g, '').replace(/^0/, '966')}`}
                  target="_blank"
                  className="w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 dark:bg-green-500/20 dark:hover:bg-green-500/30 flex items-center justify-center text-green-600 transition-colors"
                  title="واتساب"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    pending:     { label: 'معلّق',  cls: 'bg-warning/15 text-warning' },
    confirmed:   { label: 'مؤكّد',  cls: 'bg-success/15 text-success' },
    in_progress: { label: '● جاري', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300' },
    completed:   { label: '✓ تم',  cls: 'bg-cream-200 text-ink-soft' },
  };
  const c = config[status] || config.pending;
  return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${c.cls}`}>{c.label}</span>;
}

function QuickLink({ href, icon: Icon, title, subtitle, badge }: {
  href: string; icon: any; title: string; subtitle: string; badge?: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white dark:bg-white/5 border border-cream-200 dark:border-white/10 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md hover:border-gold-light/40 transition-all group"
    >
      <div className="w-11 h-11 rounded-xl bg-gold-light/10 flex items-center justify-center text-gold-deep group-hover:bg-gold-deep group-hover:text-cream-50 transition-colors shrink-0">
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-ar-display font-bold text-ink dark:text-cream-50 flex items-center gap-2">
          <span>{title}</span>
          {badge && (
            <span className="bg-danger text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {badge}
            </span>
          )}
        </div>
        <div className="text-xs text-ink-soft dark:text-cream-100/60 mt-0.5">{subtitle}</div>
      </div>
    </Link>
  );
}

function EmptyState({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div className="p-10 text-center">
      <div className="text-5xl mb-3">{emoji}</div>
      <div className="font-ar-display font-bold text-lg text-ink dark:text-cream-50 mb-1">{title}</div>
      <div className="text-sm text-ink-soft dark:text-cream-100/60">{subtitle}</div>
    </div>
  );
}
