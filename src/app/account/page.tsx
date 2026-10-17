/**
 * Account Dashboard — لوحة العميلة الفاخرة
 * ═══════════════════════════════════════════════════════════
 * - تحية حسب الوقت + مؤشر الموعد القادم
 * - بطاقة ولاء دائرية مع تدرّج فاخر
 * - 4 إحصائيات ذكية
 * - شريط إجراءات ملوّن
 * - Timeline للموعد القادم مع عداد تنازلي
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BookingCard from '@/components/account/BookingCard';
import {
  CalendarPlus, Clock, Heart, User as UserIcon, Award, Sparkles,
  Gift, LogOut, Phone, MessageCircle, ChevronLeft, Crown, Star,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const TIER_INFO: Record<string, {
  label: string; next: number | null; emoji: string;
  gradient: string; glow: string; ringColor: string;
}> = {
  bronze:  { label: 'برونزية', next: 2000,  emoji: '🥉', gradient: 'from-amber-700 via-amber-500 to-amber-800', glow: 'shadow-amber-500/30', ringColor: 'stroke-amber-300' },
  silver:  { label: 'فضيّة',   next: 5000,  emoji: '🥈', gradient: 'from-slate-500 via-slate-300 to-slate-600', glow: 'shadow-slate-400/30', ringColor: 'stroke-slate-200' },
  gold:    { label: 'ذهبيّة',  next: 10000, emoji: '🥇', gradient: 'from-yellow-600 via-yellow-400 to-yellow-700', glow: 'shadow-yellow-400/40', ringColor: 'stroke-yellow-200' },
  diamond: { label: 'ماسيّة',  next: null,  emoji: '💎', gradient: 'from-cyan-600 via-sky-400 to-blue-700', glow: 'shadow-cyan-400/40', ringColor: 'stroke-cyan-200' },
};

export const dynamic = 'force-dynamic';

function timeGreeting(): { ar: string; emoji: string } {
  const h = new Date().getHours();
  if (h < 12) return { ar: 'صباح الخير', emoji: '☀️' };
  if (h < 17) return { ar: 'مساء الخير', emoji: '🌤️' };
  if (h < 20) return { ar: 'مساء النور', emoji: '🌅' };
  return { ar: 'مساء الورد', emoji: '🌙' };
}

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account');

  const { data: roleCheck } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (roleCheck && ['owner', 'manager', 'staff'].includes(roleCheck.role)) {
    redirect('/admin');
  }

  const [{ data: profile }, { data: bookings }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('bookings').select('*, items:booking_items(*)')
      .eq('customer_id', user.id)
      .order('booking_date', { ascending: false })
      .limit(10),
  ]);

  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = (bookings || [])
    .filter((b) => b.booking_date >= todayStr && b.status !== 'cancelled')
    .sort((a, b) => (a.booking_date + a.booking_time).localeCompare(b.booking_date + b.booking_time));
  const past = (bookings || []).filter(
    (b) => b.booking_date < todayStr || b.status === 'completed'
  );

  const totalSpent = (bookings || [])
    .filter((b) => b.payment_status === 'paid')
    .reduce((sum, b) => sum + Number(b.total), 0);

  const nextBooking = upcoming[0] as any;
  let minsToNext: number | null = null;
  if (nextBooking) {
    const target = new Date(`${nextBooking.booking_date}T${nextBooking.booking_time}`);
    minsToNext = Math.round((target.getTime() - Date.now()) / 60000);
  }

  const firstName = profile?.full_name?.split(' ')[0] || 'عزيزتي';
  const greeting = timeGreeting();
  const memberSince = new Date(profile?.created_at || Date.now()).getFullYear();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">

          {/* ═══ Hero ═══ */}
          <div className="mb-6 md:mb-8 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mb-1">
                MY ACCOUNT · حسابي
              </div>
              <h1 className="font-ar-display text-2xl md:text-4xl font-bold text-gold-deep">
                {greeting.ar}، {firstName} {greeting.emoji}
              </h1>
              <p className="text-ink-soft mt-1.5 text-sm">
                {new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
                {upcoming.length > 0 && (
                  <> · <span className="font-bold text-gold-deep">{upcoming.length}</span> {upcoming.length === 1 ? 'موعد قادم' : 'مواعيد قادمة'}</>
                )}
              </p>
            </div>

            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-cream-200 text-ink-soft hover:text-danger hover:border-danger/40 transition-colors text-xs font-semibold shrink-0"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </form>
          </div>

          {/* ═══ موعدكِ القادم (إذا موجود) ═══ */}
          {nextBooking && minsToNext !== null && minsToNext >= 0 && (
            <NextBookingCard booking={nextBooking} minsToNext={minsToNext} />
          )}

          {/* ═══ بطاقة الولاء الفاخرة ═══ */}
          {profile && (
            <LoyaltyCardPremium
              points={profile.loyalty_points || 0}
              tier={profile.loyalty_tier || 'bronze'}
              totalSpent={profile.total_spent || totalSpent}
            />
          )}

          {/* ═══ 4 إحصائيات ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            <StatTile icon={CalendarPlus} label="حجوزات قادمة" value={String(upcoming.length)} color="emerald" />
            <StatTile icon={Heart} label="زيارات سابقة" value={String(past.length)} color="pink" />
            <StatTile icon={Sparkles} label="إجمالي الإنفاق" value={formatPrice(totalSpent)} color="gold" />
            <StatTile icon={Crown} label="عضوة منذ" value={String(memberSince)} color="violet" />
          </div>

          {/* ═══ شريط إجراءات ═══ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 md:mb-10">
            <ActionLink
              href="/booking"
              title="احجزي موعداً جديداً"
              subtitle="خدمات مختارة بعناية"
              icon={CalendarPlus}
              variant="primary"
              className="sm:col-span-2"
            />
            <ActionLink
              href="/account/profile"
              title="بياناتي"
              subtitle="تعديل الاسم والجوال"
              icon={UserIcon}
              variant="light"
            />
            <ActionLink
              href="/account/referral"
              title="ادعي صديقاتكِ"
              subtitle="50 ر.س لكِ ولصديقتكِ عند أول حجز 🎁"
              icon={Gift}
              variant="pink"
              className="sm:col-span-3"
            />
          </div>

          {/* ═══ الحجوزات القادمة ═══ */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-ar-display text-xl md:text-2xl font-bold text-gold-deep flex items-center gap-2">
                  <CalendarPlus className="w-5 h-5" />
                  الحجوزات القادمة
                </h2>
                <p className="text-[11px] text-ink-soft mt-0.5">مواعيدكِ المحجوزة</p>
              </div>
              <Link
                href="/account/bookings"
                className="text-xs text-gold-deep hover:text-gold font-bold flex items-center gap-1 shrink-0"
              >
                كل الحجوزات
                <ChevronLeft className="w-3 h-3" />
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <EmptyBookings />
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {upcoming.map((b) => <BookingCard key={b.id} booking={b} />)}
              </div>
            )}
          </section>

          {/* ═══ الحجوزات السابقة ═══ */}
          {past.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-ar-display text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500" />
                    زياراتكِ السابقة
                  </h2>
                  <p className="text-[11px] text-ink-soft mt-0.5">الذكريات الجميلة 💛</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {past.slice(0, 4).map((b) => <BookingCard key={b.id} booking={b} />)}
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

// ═══════════════════════════════════════════════════════════

function NextBookingCard({ booking, minsToNext }: { booking: any; minsToNext: number }) {
  const isToday = booking.booking_date === new Date().toISOString().split('T')[0];
  const isSoon = minsToNext < 60 && isToday;
  const serviceNames = booking.items?.map((i: any) => i.service_name).join('، ') || 'الخدمة';

  function formatCountdown(mins: number): string {
    if (!isToday) {
      const days = Math.floor(mins / (60 * 24));
      return `بعد ${days} ${days === 1 ? 'يوم' : 'أيام'}`;
    }
    if (mins < 60) return `بعد ${mins} دقيقة`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `بعد ${h}س${m > 0 ? ` ${m}د` : ''}`;
  }

  return (
    <div className={`mb-6 bg-gradient-to-br from-gold-deep via-gold-deep to-ink text-cream-50 rounded-3xl p-5 md:p-6 shadow-xl shadow-gold-deep/20 relative overflow-hidden`}>
      <div className="absolute top-0 right-0 opacity-10">
        <Sparkles className="w-40 h-40" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="font-en-label text-[10px] tracking-[0.3em] text-gold-light">
            NEXT APPOINTMENT · موعدكِ القادم
          </span>
          {isSoon && (
            <span className="bg-cream-50/15 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-bold text-cream-50 animate-pulse">
              قريباً جداً
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-3 mb-2">
          <span className="font-en-display text-4xl md:text-5xl font-bold">
            {booking.booking_time.slice(0, 5)}
          </span>
          <span className="text-sm text-gold-light">
            {formatCountdown(minsToNext)}
          </span>
        </div>

        <div className="text-sm text-cream-100/80 mb-1 font-en-display">
          {booking.booking_date}
        </div>
        <div className="font-ar-display text-lg md:text-xl font-bold mb-4">
          {serviceNames}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/account/bookings"
            className="bg-cream-50/15 hover:bg-cream-50/25 backdrop-blur text-cream-50 text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            إدارة الحجز
          </Link>
          <a
            href="https://wa.me/966504389329"
            target="_blank"
            className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            تواصلي مع المركز
          </a>
        </div>
      </div>
    </div>
  );
}

function LoyaltyCardPremium({ points, tier, totalSpent }: { points: number; tier: string; totalSpent: number }) {
  const info = TIER_INFO[tier] || TIER_INFO.bronze;
  const progress = info.next ? Math.min(100, (totalSpent / info.next) * 100) : 100;
  const remaining = info.next ? Math.max(0, info.next - totalSpent) : 0;
  const circumference = 2 * Math.PI * 42; // r=42
  const strokeOffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`mb-6 bg-gradient-to-br ${info.gradient} text-white rounded-3xl p-6 md:p-8 shadow-xl ${info.glow} relative overflow-hidden`}>
      {/* زخرفة الخلفية */}
      <div className="absolute -top-10 -left-10 opacity-10">
        <Sparkles className="w-48 h-48" />
      </div>
      <div className="absolute bottom-0 right-0 opacity-5 text-9xl leading-none">
        {info.emoji}
      </div>

      <div className="relative z-10 flex items-center gap-6 flex-wrap">
        {/* الدائرة مع النقاط */}
        <div className="relative shrink-0">
          <svg className="w-32 h-32 md:w-36 md:h-36 -rotate-90" viewBox="0 0 100 100">
            {/* الحلقة الخلفية */}
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/15" />
            {/* الحلقة التقدّمية */}
            {info.next && (
              <circle
                cx="50" cy="50" r="42"
                fill="none" stroke="currentColor" strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                className="text-white transition-all duration-1000"
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-en-display text-3xl md:text-4xl font-bold leading-none">
              {points.toLocaleString()}
            </div>
            <div className="text-[10px] opacity-80 mt-1">نقطة</div>
          </div>
        </div>

        {/* المعلومات */}
        <div className="flex-1 min-w-[180px]">
          <div className="flex items-center gap-1.5 mb-1.5 opacity-80">
            <Award className="w-3.5 h-3.5" />
            <span className="font-en-label text-[9px] tracking-[0.3em]">LOYALTY TIER</span>
          </div>
          <div className="font-ar-display text-2xl md:text-3xl font-bold flex items-center gap-2 mb-2">
            عضوة {info.label}
            <span className="text-2xl">{info.emoji}</span>
          </div>
          {info.next ? (
            <div className="space-y-1">
              <div className="text-xs opacity-90">
                <span className="font-bold font-en-display">{remaining.toLocaleString()}</span> ر.س للترقية
              </div>
              <div className="text-[10px] opacity-70">
                كل 10 ر.س تنفقينها = نقطة ولاء · استبدليها بخصومات على الحجز
              </div>
            </div>
          ) : (
            <div className="text-sm font-bold">
              ✨ أعلى طبقة · شكراً لولائكِ 💎
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, color }: {
  icon: any; label: string; value: string;
  color: 'gold' | 'emerald' | 'pink' | 'violet';
}) {
  const colors = {
    gold:    'from-gold-light/15 to-gold-light/5 text-gold-deep',
    emerald: 'from-emerald-500/15 to-emerald-500/5 text-emerald-600',
    pink:    'from-pink-500/15 to-pink-500/5 text-pink-600',
    violet:  'from-violet-500/15 to-violet-500/5 text-violet-600',
  }[color];

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 border border-cream-200 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="font-en-display text-xl md:text-2xl font-bold text-ink truncate">{value}</div>
      <div className="text-[11px] md:text-xs text-ink-soft mt-0.5 font-semibold truncate">{label}</div>
    </div>
  );
}

function ActionLink({
  href, title, subtitle, icon: Icon, variant, className = '',
}: {
  href: string; title: string; subtitle: string; icon: any;
  variant: 'primary' | 'light' | 'pink';
  className?: string;
}) {
  const variants = {
    primary: 'bg-gradient-to-br from-gold-deep via-gold-deep to-ink text-cream-50 shadow-lg shadow-gold-deep/20',
    light:   'bg-white border border-cream-200 text-ink hover:border-gold-light hover:shadow-md',
    pink:    'bg-gradient-to-br from-pink-500 via-rose-500 to-rose-700 text-white shadow-lg shadow-pink-500/20',
  }[variant];

  const subtitleCls = variant === 'light' ? 'text-ink-soft' : variant === 'primary' ? 'text-gold-light' : 'text-white/80';
  const iconCls = variant === 'light' ? 'text-gold-deep' : variant === 'primary' ? 'text-gold-light' : 'text-white/80';

  return (
    <Link
      href={href}
      className={`rounded-2xl p-5 flex items-center justify-between gap-3 hover:scale-[1.01] transition-all group ${variants} ${className}`}
    >
      <div className="min-w-0 flex-1">
        <div className="font-ar-display text-base md:text-lg font-bold">{title}</div>
        <div className={`text-xs mt-0.5 ${subtitleCls}`}>{subtitle}</div>
      </div>
      <Icon className={`w-7 h-7 md:w-8 md:h-8 shrink-0 ${iconCls} group-hover:scale-110 transition-transform`} />
    </Link>
  );
}

function EmptyBookings() {
  return (
    <div className="bg-white rounded-3xl p-10 text-center border border-cream-200">
      <div className="text-5xl mb-3">🌸</div>
      <div className="font-ar-display font-bold text-lg text-ink mb-1">
        ما عندكِ حجوزات قادمة بعد
      </div>
      <div className="text-sm text-ink-soft mb-5">
        دللي نفسكِ بتجربة فاخرة في Be First Lady
      </div>
      <Link
        href="/booking"
        className="inline-flex items-center gap-2 bg-gradient-to-br from-gold-deep to-ink text-cream-50 font-bold py-3 px-6 rounded-xl hover:shadow-lg transition-all"
      >
        <CalendarPlus className="w-4 h-4" />
        احجزي الآن
      </Link>
    </div>
  );
}
