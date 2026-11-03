'use client';

/**
 * AdminMobileHome — واجهة محمولة فاخرة للموظّفات والمالكة
 * ═══════════════════════════════════════════════════════════
 * - غلاف واحد لتجربة app-like
 * - quick actions (check-in · bookings · earnings)
 * - today's bookings timeline
 * - push notifications
 */
import Link from 'next/link';
import {
  Clock, CalendarCheck, LogIn, LogOut, Users, DollarSign, Bell,
  Scissors, Package, Gift, BarChart3, UserCheck, Settings, Sparkles,
  ChevronLeft, TrendingUp, Phone,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Props {
  profile: {
    full_name: string;
    role: 'owner' | 'manager' | 'staff';
  };
  stats: {
    today_bookings: number;
    today_revenue: number;
    pending_count: number;
    completed_today: number;
  };
  todayBookings: Array<{
    id: string;
    booking_time: string;
    customer_name: string;
    service_name: string;
    status: string;
  }>;
}

const QUICK_ACTIONS_BY_ROLE: Record<string, Array<any>> = {
  owner: [
    { href: '/admin/bookings',   label: 'الحجوزات',   icon: CalendarCheck, color: 'emerald' },
    { href: '/admin/customers',  label: 'العميلات',   icon: Users,         color: 'rose' },
    { href: '/admin/reports',    label: 'التقارير',   icon: BarChart3,     color: 'violet' },
    { href: '/admin/staff',      label: 'الموظّفات',  icon: UserCheck,     color: 'blue' },
    { href: '/admin/services',   label: 'الخدمات',    icon: Scissors,      color: 'amber' },
    { href: '/admin/gift-cards', label: 'بطاقات',    icon: Gift,          color: 'pink' },
    { href: '/admin/push',       label: 'إشعارات',   icon: Bell,          color: 'cyan' },
    { href: '/admin/settings',   label: 'إعدادات',   icon: Settings,      color: 'stone' },
  ],
  manager: [
    { href: '/admin/bookings',   label: 'الحجوزات',   icon: CalendarCheck, color: 'emerald' },
    { href: '/admin/customers',  label: 'العميلات',   icon: Users,         color: 'rose' },
    { href: '/admin/staff',      label: 'الموظّفات',  icon: UserCheck,     color: 'blue' },
    { href: '/admin/services',   label: 'الخدمات',    icon: Scissors,      color: 'amber' },
    { href: '/admin/gift-cards', label: 'بطاقات',    icon: Gift,          color: 'pink' },
    { href: '/admin/push',       label: 'إشعارات',   icon: Bell,          color: 'cyan' },
  ],
  staff: [
    { href: '/account/attendance', label: 'الحضور',    icon: Clock,         color: 'emerald' },
    { href: '/admin/bookings',     label: 'حجوزاتي',   icon: CalendarCheck, color: 'rose' },
    { href: '/account/leaves',     label: 'الإجازات',  icon: LogOut,        color: 'amber' },
  ],
};

export default function AdminMobileHome({ profile, stats, todayBookings }: Props) {
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return { ar: 'صباح الخير', emoji: '☀️' };
    if (h < 17) return { ar: 'مساء الخير', emoji: '🌤️' };
    if (h < 20) return { ar: 'مساء النور', emoji: '🌅' };
    return { ar: 'مساء الورد', emoji: '🌙' };
  })();

  const actions = QUICK_ACTIONS_BY_ROLE[profile.role] || QUICK_ACTIONS_BY_ROLE.staff;
  const roleName = profile.role === 'owner' ? 'المالكة' : profile.role === 'manager' ? 'المديرة' : 'الموظّفة';

  return (
    <div className="md:hidden min-h-screen bg-gradient-to-b from-cream-50 via-white to-cream-50 pb-24">

      {/* ─── Hero Header ─── */}
      <header className="relative bg-gradient-to-br from-ink via-[#2a1c10] to-gold-deep text-cream-50 overflow-hidden">
        {/* Light rays */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background: 'conic-gradient(from 215deg at 90% 10%, transparent 0deg, rgba(232,200,138,0.3) 20deg, transparent 60deg)',
          }}
        />
        <div className="absolute top-0 left-0 w-40 h-40 bg-gold-light/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />

        <div className="relative px-5 pt-8 pb-6">
          {/* Greeting */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="text-[11px] text-gold-light/70">
                {greeting.ar} {greeting.emoji}
              </div>
              <h1 className="font-ar-display text-2xl font-bold text-cream-50 mt-1">
                {profile.full_name.split(' ')[0]}
              </h1>
              <div className="text-[10px] text-gold-light/60 mt-0.5 font-en-label tracking-wider">
                {roleName.toUpperCase()}
              </div>
            </div>
            <Link
              href="/account"
              className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-cream-50 active:scale-95 transition-all"
              aria-label="حسابي"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </div>

          {/* Live Stats · 4 Tiles */}
          <div className="grid grid-cols-4 gap-2">
            <StatTile value={stats.today_bookings} label="حجز اليوم" icon={CalendarCheck} />
            <StatTile value={stats.completed_today} label="مكتملة" icon={Sparkles} />
            <StatTile value={stats.pending_count} label="بانتظار" icon={Clock} warn={stats.pending_count > 0} />
            <StatTile value={formatPrice(stats.today_revenue, { showFrom: false }).replace(' ر.س', '')} label="إيرادات" icon={DollarSign} small />
          </div>
        </div>
      </header>

      {/* ─── Quick Actions Grid ─── */}
      <section className="px-5 pt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-ar-display font-bold text-gold-deep text-sm">إجراءات سريعة</h2>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {actions.map((a) => (
            <ActionTile key={a.href} action={a} />
          ))}
        </div>
      </section>

      {/* ─── Today's Bookings ─── */}
      <section className="px-5 pt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-ar-display font-bold text-gold-deep text-sm flex items-center gap-1.5">
            <CalendarCheck className="w-4 h-4" />
            حجوزات اليوم
          </h2>
          <Link
            href="/admin/bookings"
            className="text-[11px] text-gold-deep font-bold hover:text-ink flex items-center gap-0.5"
          >
            الكل
            <ChevronLeft className="w-3 h-3" />
          </Link>
        </div>

        {todayBookings.length === 0 ? (
          <div className="bg-cream-50 border border-cream-200 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-2">🌙</div>
            <div className="text-sm text-ink-soft">ما فيه حجوزات اليوم</div>
            <div className="text-[11px] text-ink-soft/70 mt-1">خذي وقتكِ · يوم هادئ</div>
          </div>
        ) : (
          <div className="space-y-2">
            {todayBookings.slice(0, 5).map((b) => (
              <BookingTile key={b.id} booking={b} />
            ))}
          </div>
        )}
      </section>

      {/* ─── Footer Stats · staff-only ─── */}
      {profile.role === 'staff' && (
        <section className="px-5 pt-8">
          <div className="relative bg-gradient-to-br from-emerald-500 to-teal-700 rounded-3xl p-5 text-white overflow-hidden shadow-xl">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <div className="editorial-eyebrow text-white/70 mb-1">MY EARNINGS</div>
              <div className="font-ar-display text-lg font-bold">أرباحكِ اليوم</div>
              <div className="font-en-display font-bold text-4xl mt-2">
                {formatPrice(stats.today_revenue * 0.20, { showFrom: false })}
              </div>
              <div className="text-[11px] opacity-80 mt-2">
                من {stats.today_bookings} حجز · عمولة 20%
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  );
}

function StatTile({
  value, label, icon: Icon, warn, small,
}: {
  value: any; label: string; icon: any; warn?: boolean; small?: boolean;
}) {
  return (
    <div className={`relative bg-white/10 backdrop-blur-sm border rounded-xl p-2.5 overflow-hidden ${
      warn ? 'border-rose-400/60 ring-1 ring-rose-400/30 animate-pulse' : 'border-white/20'
    }`}>
      <Icon className="w-3.5 h-3.5 text-gold-light opacity-60 mb-1" />
      <div className={`font-en-display font-bold text-cream-50 leading-none ${small ? 'text-sm' : 'text-xl'}`}>
        {value}
      </div>
      <div className="text-[9px] text-gold-light/70 mt-1 truncate">{label}</div>
    </div>
  );
}

function ActionTile({ action }: { action: any }) {
  const Icon = action.icon;
  const colors: Record<string, string> = {
    emerald: 'from-emerald-50 to-green-50 text-emerald-700 border-emerald-200',
    rose: 'from-rose-50 to-pink-50 text-rose-700 border-rose-200',
    violet: 'from-violet-50 to-purple-50 text-violet-700 border-violet-200',
    blue: 'from-blue-50 to-sky-50 text-blue-700 border-blue-200',
    amber: 'from-amber-50 to-yellow-50 text-amber-700 border-amber-200',
    pink: 'from-pink-50 to-rose-50 text-pink-700 border-pink-200',
    cyan: 'from-cyan-50 to-sky-50 text-cyan-700 border-cyan-200',
    stone: 'from-stone-50 to-neutral-50 text-stone-700 border-stone-200',
  };
  return (
    <Link
      href={action.href}
      className={`relative aspect-square bg-gradient-to-br ${colors[action.color]} border rounded-2xl flex flex-col items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm hover:shadow-md group overflow-hidden`}
    >
      <div className="absolute top-0 right-0 w-12 h-12 bg-white/40 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <Icon className="w-5 h-5 relative" />
      <span className="text-[10px] font-bold relative">{action.label}</span>
    </Link>
  );
}

function BookingTile({ booking }: { booking: any }) {
  const statusColor = {
    pending:     'bg-amber-100 text-amber-700',
    confirmed:   'bg-emerald-100 text-emerald-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed:   'bg-stone-100 text-stone-600',
    cancelled:   'bg-rose-100 text-rose-700',
  }[booking.status as string] || 'bg-stone-100 text-stone-600';

  const statusLabel = {
    pending: 'بانتظار',
    confirmed: 'مؤكّد',
    in_progress: 'جاري',
    completed: 'مكتمل',
    cancelled: 'ملغي',
  }[booking.status as string] || booking.status;

  return (
    <Link
      href={`/admin/bookings`}
      className="flex items-center gap-3 bg-white rounded-xl border border-cream-200 p-3 active:scale-[0.98] transition-transform hover:shadow-sm"
    >
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-light/15 to-amber-50 text-gold-deep flex flex-col items-center justify-center shrink-0">
        <span className="font-en-display font-bold text-sm leading-none">
          {booking.booking_time?.slice(0, 5)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-ink truncate">
          {booking.customer_name}
        </div>
        <div className="text-[11px] text-ink-soft truncate">
          {booking.service_name}
        </div>
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColor}`}>
        {statusLabel}
      </span>
    </Link>
  );
}
