/**
 * Account Dashboard v3.2 — لوحة العميلة الجذريّة
 * ═══════════════════════════════════════════════════════════
 * التصميم الجديد:
 *   1. Hero · ترحيب + ملخّص سريع
 *   2. UpcomingBookingHero (الموعد القادم بعدّاد لحظي)
 *   3. LoyaltyProgress (شريط تقدّم الولاء)
 *   4. 4 إجراءات سريعة ملوّنة
 *   5. الحجوزات السابقة
 *   6. اقتراحات ذكيّة
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BookingCard from '@/components/account/BookingCard';
import UpcomingBookingHero from '@/components/account/UpcomingBookingHero';
import LoyaltyProgress from '@/components/account/LoyaltyProgress';
import {
  CalendarPlus, Clock, Heart, User as UserIcon, Gift, Sparkles,
  LogOut, ChevronLeft, Phone, MessageCircle, Cake,
} from 'lucide-react';
import { formatPrice, waLink } from '@/lib/utils';

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

  // تحقّق من الدور · إذا موظفة أو مديرة → تحويل للـadmin
  const { data: roleCheck } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if ((roleCheck as any) && ['owner', 'manager', 'staff'].includes((roleCheck as any).role)) {
    redirect('/admin');
  }

  const [
    { data: profile },
    { data: bookings },
    { count: favoritesCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('bookings').select('*, items:booking_items(*), staff:staff(name)')
      .eq('customer_id', user.id)
      .order('booking_date', { ascending: false })
      .limit(10),
    supabase.from('customer_favorites').select('*', { count: 'exact', head: true })
      .eq('customer_id', user.id),
  ]);

  const todayStr = new Date().toISOString().split('T')[0];
  const upcoming = ((bookings as any[]) || [])
    .filter((b) => b.booking_date >= todayStr && b.status !== 'cancelled')
    .sort((a, b) => (a.booking_date + a.booking_time).localeCompare(b.booking_date + b.booking_time));
  const past = ((bookings as any[]) || []).filter(
    (b) => b.booking_date < todayStr || b.status === 'completed'
  );

  const totalSpent = ((bookings as any[]) || [])
    .filter((b) => b.payment_status === 'paid')
    .reduce((sum, b) => sum + Number(b.total), 0);

  const nextBooking = upcoming[0];
  const lastCompleted = past.find((b: any) => b.status === 'completed') || past[0];

  const firstName = (profile as any)?.full_name?.split(' ')[0] || 'عزيزتي';
  const greeting = timeGreeting();
  const memberSince = new Date((profile as any)?.created_at || Date.now()).getFullYear();
  const points = (profile as any)?.loyalty_points || 0;
  const tier = (profile as any)?.tier || 'bronze';

  // كم باقي على عيد الميلاد؟
  const dob = (profile as any)?.date_of_birth;
  let daysToBirthday: number | null = null;
  if (dob) {
    const today = new Date();
    const birthDate = new Date(dob);
    const nextBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
    if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
    daysToBirthday = Math.ceil((nextBirthday.getTime() - today.getTime()) / 86400000);
  }

  return (
    <>
      <Header />

      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24 pb-24 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-5 md:space-y-6">

          {/* ═══════════════════════════════════════════════════════════
              HERO · ترحيب شخصي
              ═══════════════════════════════════════════════════════════ */}
          <section className="relative bg-gradient-to-br from-white via-cream-50 to-cream-100 border border-gold-light/20 rounded-3xl p-5 md:p-7 overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gold-light/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="editorial-eyebrow text-gold-light/70 mb-1">
                  CLIENT DASHBOARD
                </div>
                <h1 className="font-ar-display text-2xl md:text-4xl font-bold text-gold-deep leading-tight flex items-center gap-3">
                  {greeting.ar} · <span className="text-ink">{firstName}</span>
                  <span className="text-2xl">{greeting.emoji}</span>
                </h1>
                <p className="text-ink-soft text-sm mt-2">
                  {new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
                  {upcoming.length > 0 && (
                    <>
                      {' · '}
                      <span className="text-gold-deep font-bold">
                        {upcoming.length} حجز قادم
                      </span>
                    </>
                  )}
                </p>
              </div>

              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-cream-100 hover:bg-cream-200 text-ink-soft hover:text-rose-600 rounded-xl text-xs font-bold transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  خروج
                </button>
              </form>
            </div>

            {/* ملخّص سريع */}
            <div className="relative grid grid-cols-4 gap-2 mt-5">
              <QuickBadge icon={CalendarPlus} value={String(upcoming.length)} label="قادم" color="emerald" />
              <QuickBadge icon={Heart} value={String(favoritesCount || 0)} label="مفضّلة" color="rose" />
              <QuickBadge icon={Sparkles} value={formatPrice(totalSpent, { showFrom: false })} label="الإنفاق" color="gold" />
              <QuickBadge icon={Clock} value={String(past.length)} label="زيارات" color="violet" />
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              UpcomingBookingHero · الموعد القادم
              ═══════════════════════════════════════════════════════════ */}
          {nextBooking && (
            <UpcomingBookingHero booking={nextBooking as any} />
          )}

          {/* ═══════════════════════════════════════════════════════════
              LoyaltyProgress · شريط الولاء
              ═══════════════════════════════════════════════════════════ */}
          <LoyaltyProgress
            tier={tier as any}
            points={points}
            totalSpent={totalSpent}
            visitsCount={past.length}
          />

          {/* ═══════════════════════════════════════════════════════════
              تنبيه عيد الميلاد (إذا قريب)
              ═══════════════════════════════════════════════════════════ */}
          {daysToBirthday !== null && daysToBirthday <= 30 && daysToBirthday > 0 && (
            <div className="bg-gradient-to-l from-rose-100 via-white to-white border border-rose-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
                <Cake className="w-5 h-5 text-rose-600" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-rose-900 text-sm">
                  🎂 عيد ميلادكِ بعد {daysToBirthday} يوم!
                </div>
                <div className="text-xs text-rose-700 mt-0.5">
                  راح يوصلكِ كوبون خصم 20% بواتساب في يومكِ المميّز
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              إجراءات سريعة
              ═══════════════════════════════════════════════════════════ */}
          <section>
            <div className="editorial-eyebrow text-ink-soft mb-3">QUICK ACTIONS</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ActionCard
                href="/booking"
                icon={CalendarPlus}
                title="احجزي جديد"
                color="gold"
                primary
              />
              {lastCompleted && (
                <ActionCard
                  href={`/booking?repeat=${lastCompleted.id}`}
                  icon={Clock}
                  title="كرّري آخر حجز"
                  subtitle="بنقرة واحدة"
                  color="emerald"
                />
              )}
              <ActionCard
                href="/account/favorites"
                icon={Heart}
                title="مفضّلتي"
                subtitle={`${favoritesCount || 0} عنصر`}
                color="rose"
              />
              <ActionCard
                href="/account/referral"
                icon={Gift}
                title="ادعي صديقة"
                subtitle="50 ر.س هديّة"
                color="violet"
              />
              <ActionCard
                href="/account/profile"
                icon={UserIcon}
                title="بياناتي"
                subtitle="تعديل"
                color="blue"
              />
              <ActionCard
                href="/account/bookings"
                icon={CalendarPlus}
                title="كل حجوزاتي"
                color="gold"
              />
              <ActionCard
                href={waLink('السلام عليكم')}
                icon={MessageCircle}
                title="واتساب"
                subtitle="تواصل سريع"
                color="emerald"
                external
              />
              <ActionCard
                href="tel:+966504389329"
                icon={Phone}
                title="اتصلي بنا"
                color="violet"
                external
              />
            </div>
          </section>

          {/* ═══════════════════════════════════════════════════════════
              الحجوزات السابقة
              ═══════════════════════════════════════════════════════════ */}
          {past.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="editorial-eyebrow text-ink-soft mb-1">PAST VISITS</div>
                  <h2 className="font-ar-display text-xl md:text-2xl font-bold text-ink flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    زياراتكِ السابقة
                  </h2>
                </div>
                <Link
                  href="/account/bookings"
                  className="text-xs text-gold-deep hover:text-ink font-bold flex items-center gap-1"
                >
                  كل الحجوزات
                  <ChevronLeft className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {past.slice(0, 4).map((b: any) => <BookingCard key={b.id} booking={b} />)}
              </div>
            </section>
          )}

          {/* ═══════════════════════════════════════════════════════════
              حالة فاضية (لو ما فيها حجوزات)
              ═══════════════════════════════════════════════════════════ */}
          {upcoming.length === 0 && past.length === 0 && (
            <section className="bg-white border border-cream-200 rounded-3xl p-10 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-light/20 to-cream-100 mx-auto flex items-center justify-center mb-4">
                <Sparkles className="w-10 h-10 text-gold-deep" />
              </div>
              <h3 className="font-ar-display text-xl font-bold text-ink mb-2">
                مرحباً بكِ في عائلة Be First Lady 💛
              </h3>
              <p className="text-sm text-ink-soft mb-6 max-w-sm mx-auto">
                احجزي أول موعد الحين · واستمتعي بتجربة فاخرة نُعدّها لكِ خصّيصاً
              </p>
              <Link
                href="/booking"
                className="inline-flex items-center gap-2 bg-gradient-to-br from-gold-deep to-ink text-cream-50 font-bold px-6 py-3 rounded-xl hover:scale-105 transition-transform"
              >
                <CalendarPlus className="w-4 h-4" />
                احجزي أول موعد
              </Link>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════ */

function QuickBadge({
  icon: Icon, value, label, color,
}: {
  icon: any; value: string; label: string;
  color: 'emerald' | 'rose' | 'gold' | 'violet';
}) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    gold: 'bg-gold-light/15 text-gold-deep border-gold-light/30',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
  }[color];

  return (
    <div className={`${colors} border rounded-xl p-2.5 text-center`}>
      <Icon className="w-3.5 h-3.5 mx-auto mb-0.5" />
      <div className="font-en-display font-bold text-sm leading-none truncate">{value}</div>
      <div className="text-[9px] font-semibold mt-1 opacity-80">{label}</div>
    </div>
  );
}

function ActionCard({
  href, icon: Icon, title, subtitle, color, primary = false, external = false,
}: {
  href: string; icon: any; title: string; subtitle?: string;
  color: string; primary?: boolean; external?: boolean;
}) {
  const colors: Record<string, string> = {
    gold: primary
      ? 'bg-gradient-to-br from-gold-deep to-ink text-cream-50 border-gold-deep shadow-lg shadow-gold-deep/20'
      : 'bg-gold-light/10 hover:bg-gold-light/20 text-gold-deep border-gold-light/30',
    emerald: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200',
    rose: 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200',
    violet: 'bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200',
    blue: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
  };
  const classes = colors[color] || colors.gold;

  const props = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <Link
      href={href}
      {...props}
      className={`${classes} border rounded-2xl p-4 flex flex-col items-start gap-1.5 transition-all hover:-translate-y-0.5`}
    >
      <Icon className="w-5 h-5" />
      <div className="font-bold text-sm leading-tight">{title}</div>
      {subtitle && (
        <div className={`text-[11px] ${primary ? 'opacity-80' : 'opacity-70'}`}>
          {subtitle}
        </div>
      )}
    </Link>
  );
}
