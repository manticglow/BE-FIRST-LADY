/**
 * StaffDashboard v3.2 — لوحة الموظفة الجذريّة
 * ═══════════════════════════════════════════════════════════
 * التصميم الجديد:
 *   1. Hero شخصي · ترحيب + أرقام اليوم
 *   2. بطاقة الحضور بشكل بارز (مع زر كبير)
 *   3. TodayFocusView (الجلسة الحاليّة أو القادمة)
 *   4. إحصائيّات الشهر
 *   5. الإجازات والطلبات
 */
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import TodayFocusView from '@/components/admin/TodayFocusView';
import {
  Clock, Umbrella, Award, Phone, CheckCircle2, Timer,
  Sparkles, Calendar, TrendingUp, PlayCircle, Users,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

function timeGreeting(): { ar: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { ar: 'صباح الخير', emoji: '☀️' };
  if (h < 17) return { ar: 'مساء الخير', emoji: '🌤️' };
  if (h < 20) return { ar: 'مساء النور', emoji: '🌅' };
  return { ar: 'مساء الورد', emoji: '🌙' };
}

export default async function StaffDashboard({
  userId, firstName,
}: {
  userId: string; firstName: string;
}) {
  const supabase = await createClient();
  const todayStr = new Date().toISOString().split('T')[0];
  const monthStart = new Date();
  monthStart.setDate(1);
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());

  const { data: staffRecord } = await supabase
    .from('staff')
    .select('id, name')
    .eq('profile_id', userId)
    .maybeSingle();
  const staffId = (staffRecord as any)?.id;

  const [
    { data: todayBookings },
    { data: weekBookings },
    { data: openAttendance },
    { data: monthAttendance },
    { data: pendingLeaves },
    { data: monthBookings },
  ] = await Promise.all([
    staffId
      ? supabase.from('bookings')
          .select('id, booking_number, customer_name, customer_phone, booking_time, duration_min, status, customer_notes, items:booking_items(service_name, service_price)')
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

  const monthMinutes = (monthAttendance as any[])?.reduce((s, r) => s + (r.total_minutes || 0), 0) || 0;
  const monthHours = Math.floor(monthMinutes / 60);
  const weekTotal = (weekBookings as any[])?.filter((b) => b.payment_status === 'paid')
    .reduce((s, b) => s + Number(b.total), 0) || 0;
  const monthRevenue = (monthBookings as any[])?.reduce((s, b) => s + Number(b.total), 0) || 0;
  const completedToday = (todayBookings as any[])?.filter((b) => b.status === 'completed').length || 0;

  const greeting = timeGreeting();
  const isCheckedIn = !!openAttendance;
  const checkInTime = isCheckedIn ? new Date((openAttendance as any).check_in_at) : null;
  const elapsedMinutes = checkInTime
    ? Math.floor((Date.now() - checkInTime.getTime()) / 60000)
    : 0;
  const elapsedH = Math.floor(elapsedMinutes / 60);
  const elapsedM = elapsedMinutes % 60;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto space-y-5 md:space-y-6">

      {/* ═══ Hero · ترحيب شخصي ═══ */}
      <section className="relative bg-gradient-to-br from-ink via-gold-deep to-ink rounded-3xl p-5 md:p-7 text-cream-50 overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gold-light/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="editorial-eyebrow text-gold-light/80 mb-1">STAFF DASHBOARD</div>
          <h1 className="font-ar-display text-2xl md:text-4xl font-bold flex items-center gap-3 mb-2">
            {greeting.ar} · <span className="text-gold-light">{firstName}</span>
            <span className="text-2xl">{greeting.emoji}</span>
          </h1>
          <p className="text-cream-100/70 text-sm">
            {new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
          </p>

          {/* إحصائيّات سريعة في الهيدر */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <HeroStat value={String((todayBookings as any)?.length || 0)} label="مواعيد اليوم" />
            <HeroStat value={String(completedToday)} label="أكملتِها" />
            <HeroStat value={`${monthHours}h`} label="ساعاتكِ هذا الشهر" />
          </div>
        </div>
      </section>

      {/* ═══ بطاقة الحضور الكبيرة ═══ */}
      <AttendanceCard
        isCheckedIn={isCheckedIn}
        elapsedH={elapsedH}
        elapsedM={elapsedM}
        checkInTime={checkInTime}
      />

      {/* ═══ TodayFocusView · المحور الرئيسي ═══ */}
      <TodayFocusView todayBookings={(todayBookings as any) || []} />

      {/* ═══ طلبات الإجازة المعلّقة (إذا موجودة) ═══ */}
      {pendingLeaves && pendingLeaves.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <Umbrella className="w-5 h-5 text-amber-700" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-amber-900 text-sm">
              عندكِ {pendingLeaves.length} طلب إجازة بانتظار الموافقة
            </div>
          </div>
          <Link
            href="/account/leaves"
            className="text-xs font-bold text-amber-700 hover:text-amber-900"
          >
            عرض →
          </Link>
        </div>
      )}

      {/* ═══ إحصائيّات الشهر ═══ */}
      <div className="bg-white rounded-3xl border border-cream-200 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-cream-200 bg-gradient-to-l from-gold-light/5 to-transparent">
          <h3 className="font-ar-display text-lg font-bold text-gold-deep flex items-center gap-2">
            <Award className="w-5 h-5" />
            إنجازاتكِ هذا الشهر
          </h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-cream-100 divide-x-reverse">
          <MonthStat icon={CheckCircle2} value={String((monthBookings as any)?.length || 0)} label="جلسة مكتملة" color="emerald" />
          <MonthStat icon={Clock} value={`${monthHours}`} label="ساعة عمل" color="violet" />
          <MonthStat icon={TrendingUp} value={formatPrice(weekTotal, { showFrom: false })} label="أسبوعك" color="gold" />
          <MonthStat icon={Sparkles} value={formatPrice(monthRevenue, { showFrom: false })} label="إيرادات الشهر" color="rose" />
        </div>
      </div>

      {/* ═══ روابط سريعة ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickLink href="/admin/bookings" icon={Calendar} label="كل الحجوزات" color="gold" />
        <QuickLink href="/account/leaves" icon={Umbrella} label="إجازاتي" color="violet" />
        <QuickLink href="/account/attendance" icon={PlayCircle} label="سجل الحضور" color="emerald" />
        <QuickLink href="/account/profile" icon={Users} label="ملفّي" color="rose" />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15">
      <div className="font-en-display font-bold text-2xl text-cream-50 leading-none">{value}</div>
      <div className="text-[10px] text-cream-100/70 mt-1 font-semibold">{label}</div>
    </div>
  );
}

function AttendanceCard({
  isCheckedIn, elapsedH, elapsedM, checkInTime,
}: {
  isCheckedIn: boolean; elapsedH: number; elapsedM: number;
  checkInTime: Date | null;
}) {
  if (isCheckedIn) {
    return (
      <Link
        href="/account/attendance"
        className="group block relative bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-5 md:p-6 text-white shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-sm text-[11px] font-bold px-3 py-1 rounded-full mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              حاضرة · داخل الشفت
            </div>
            <div className="font-en-display font-bold text-3xl md:text-4xl leading-none">
              {String(elapsedH).padStart(2, '0')}:{String(elapsedM).padStart(2, '0')}
            </div>
            <div className="text-xs opacity-80 mt-1">
              دخلتِ الساعة {checkInTime?.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
            <Timer className="w-7 h-7" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href="/account/attendance"
      className="group block relative bg-gradient-to-br from-gold-deep to-ink rounded-3xl p-5 md:p-6 text-cream-50 shadow-lg overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all"
    >
      <div className="relative flex items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-[11px] font-bold px-3 py-1 rounded-full mb-2">
            خارج الشفت
          </div>
          <div className="font-ar-display font-bold text-xl md:text-2xl mb-1">
            اضغطي لتسجيل الحضور
          </div>
          <div className="text-xs opacity-80">
            بالموقع الجغرافي · تلقائي
          </div>
        </div>

        <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
          <PlayCircle className="w-7 h-7" />
        </div>
      </div>
    </Link>
  );
}

function MonthStat({ icon: Icon, value, label, color }: { icon: any; value: string; label: string; color: 'emerald' | 'violet' | 'gold' | 'rose' }) {
  const colors = {
    emerald: 'text-emerald-600',
    violet: 'text-violet-600',
    gold: 'text-gold-deep',
    rose: 'text-rose-600',
  }[color];

  return (
    <div className="p-4 md:p-5 text-center">
      <Icon className={`w-5 h-5 ${colors} mx-auto mb-2`} />
      <div className="font-en-display font-bold text-lg md:text-xl text-ink leading-tight">
        {value}
      </div>
      <div className="text-[10px] text-ink-soft mt-1 font-semibold">
        {label}
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label, color }: { href: string; icon: any; label: string; color: string }) {
  const bg = {
    gold: 'bg-gold-light/15 hover:bg-gold-light/25 text-gold-deep',
    emerald: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700',
    violet: 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-700',
    rose: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-700',
  }[color] || 'bg-cream-100 text-ink';

  return (
    <Link
      href={href}
      className={`${bg} rounded-2xl p-3 flex items-center gap-2.5 transition-colors`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="text-xs font-bold truncate">{label}</span>
    </Link>
  );
}
