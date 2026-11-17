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
import PushNotificationManager from '@/components/account/PushNotificationManager';
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

  // 🔁 آخر حجز للاستخدام في "كرّري آخر حجز"
  const lastCompleted = past.find((b: any) => b.status === 'completed') || past[0];

  // ❤️ عدد المفضّلات
  const { count: favoritesCount } = await supabase
    .from('customer_favorites')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', user.id);

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
            <StatTile icon={Heart} label="المفضّلات" value={String(favoritesCount || 0)} color="pink" />
            <StatTile icon={Sparkles} label="إجمالي الإنفاق" value={formatPrice(totalSpent)} color="gold" />
            <StatTile icon={Crown} label="عضوة منذ" value={String(memberSince)} color="violet" />
          </div>

          {/* ═══ إجراء سريع · حجز جديد ═══ */}
          <div className="mb-6">
            <Link
              href="/booking"
              className="block group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-gold-deep via-ink to-gold-dark text-cream-50 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-white/10 -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                  <CalendarPlus className="w-7 h-7 text-cream-50" />
                </div>
                <div className="flex-1">
                  <div className="font-ar-display text-xl font-bold italic">احجزي موعداً جديداً</div>
                  <div className="text-xs opacity-85 mt-0.5">خدمات مختارة بعناية خاصّة</div>
                </div>
                <ChevronLeft className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
              </div>
            </Link>
          </div>

          {/* ═══ iOS Grouped · الأقسام المنظّمة ═══ */}
          <div className="space-y-6 mb-8 md:mb-10">

            {/* المكرّر */}
            {lastCompleted && (
              <GroupSection label="SUGGESTED FOR YOU · مُقترح لكِ">
                <GroupRow
                  href={`/booking?repeat=${lastCompleted.id}`}
                  icon={Clock}
                  label="كرّري آخر حجز"
                  value={lastCompleted.items?.[0]?.service_name || 'آخر خدمة'}
                  iconBg="bg-rose-100"
                  iconColor="text-rose-700"
                />
              </GroupSection>
            )}

            {/* النشاط */}
            <GroupSection label="ACTIVITY · النشاط">
              <GroupRow
                href="/account/bookings"
                icon={CalendarPlus}
                label="حجوزاتي"
                value={upcoming.length > 0 ? `${upcoming.length} قادمة` : 'عرض الكل'}
                iconBg="bg-emerald-100"
                iconColor="text-emerald-700"
              />
              <GroupRow
                href="/account/favorites"
                icon={Heart}
                label="المفضّلة"
                value={favoritesCount && favoritesCount > 0 ? `${favoritesCount}` : 'ابدأي بالإضافة'}
                iconBg="bg-pink-100"
                iconColor="text-pink-700"
              />
              <GroupRow
                href="/account/history"
                icon={Sparkles}
                label="تاريخ زياراتكِ"
                value={past.length > 0 ? `${past.length} زيارة` : ''}
                iconBg="bg-amber-100"
                iconColor="text-amber-700"
              />
            </GroupSection>

            {/* الشخصيّة */}
            <GroupSection label="PERSONAL · الشخصيّة">
              <GroupRow
                href="/account/profile"
                icon={UserIcon}
                label="بياناتي الشخصيّة"
                value="تعديل"
                iconBg="bg-cream-200"
                iconColor="text-gold-deep"
              />
              <GroupRow
                href="/account/beauty-profile"
                icon={Sparkles}
                label="ملف الجمال"
                value="بشرة · شعر · تفضيلات"
                iconBg="bg-rose-100"
                iconColor="text-rose-700"
              />
            </GroupSection>

            {/* المكافآت */}
            <GroupSection label="REWARDS · المكافآت">
              <GroupRow
                href="/account/referral"
                icon={Gift}
                label="ادعي صديقاتكِ"
                value="50 ر.س لكِ ولها"
                iconBg="bg-gold-light/20"
                iconColor="text-gold-deep"
                highlight
              />
              <GroupRow
                href="/gift-cards"
                icon={Star}
                label="بطاقات الهديّة"
                value="أهدي من تحبّينَ"
                iconBg="bg-gold-light/20"
                iconColor="text-gold-deep"
              />
            </GroupSection>
          </div>

          {/* ═══ Push Notifications ═══ */}
          <section className="mb-8">
            <PushNotificationManager />
          </section>

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

          {/* ═══ احجزي مرّة ثانية · آخر خدمة ═══ */}
          {lastCompleted && (
            <section className="bg-gradient-to-br from-rose-50 via-amber-50 to-cream-50 rounded-3xl p-5 md:p-6 border border-amber-100">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1">
                  <div className="editorial-eyebrow text-amber-700/80 mb-1">BOOK AGAIN</div>
                  <h3 className="font-ar-display text-lg md:text-xl font-bold text-ink mb-1">
                    استمتعي مرّة ثانية بـ{lastCompleted.items?.[0]?.service_name || 'آخر زيارة'}
                  </h3>
                  <p className="text-xs text-ink-soft">
                    آخر زيارة في{' '}
                    {new Date(lastCompleted.booking_date).toLocaleDateString('ar-SA', {
                      day: 'numeric', month: 'long',
                    })}
                    {lastCompleted.items && lastCompleted.items.length > 1 && (
                      <> · {lastCompleted.items.length} خدمات</>
                    )}
                  </p>
                </div>
                <a
                  href={`/booking?repeat=${lastCompleted.id}`}
                  className="inline-flex items-center gap-1.5 bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50 px-4 py-2.5 rounded-xl font-ar-display font-bold text-sm hover:scale-[1.03] transition-transform shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  احجزي نفس الخدمة
                </a>
              </div>
            </section>
          )}

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
  const tierLabelEn = tier === 'bronze' ? 'BRONZE' : tier === 'silver' ? 'SILVER' : tier === 'gold' ? 'GOLD' : 'DIAMOND';

  // المميّزات حسب المستوى
  const perks: Record<string, Array<{ icon: string; text: string }>> = {
    bronze: [
      { icon: '✦', text: 'استبدال النقاط بخصومات' },
      { icon: '🎁', text: 'هديّة عيد ميلادكِ' },
    ],
    silver: [
      { icon: '✦', text: 'خصم 5% دائم' },
      { icon: '🎁', text: 'هديّة عيد ميلادكِ' },
      { icon: '⏰', text: 'تذكير قبل انتهاء الكوبونات' },
    ],
    gold: [
      { icon: '✦', text: 'خصم 15% دائم' },
      { icon: '👑', text: 'أولويّة الحجز' },
      { icon: '🎁', text: 'هديّة شهريّة' },
    ],
    diamond: [
      { icon: '💎', text: 'خصم 25% دائم' },
      { icon: '👑', text: 'أولويّة قصوى' },
      { icon: '🏆', text: 'جلسة VIP شهريّة مجانيّة' },
      { icon: '🎁', text: 'هدايا حصريّة' },
    ],
  };

  const activePerks = perks[tier] || perks.bronze;

  return (
    <div className="mb-6 space-y-3">
      {/* ═══ بطاقة العضويّة · كبطاقة ائتمان فاخرة ═══ */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-7 border border-gold-light/40 shadow-xl"
           style={{
             background: 'linear-gradient(135deg, #f5eee0 0%, #ebe0c9 50%, #dcc9a2 100%)',
             boxShadow: '0 10px 40px rgba(201, 168, 118, 0.25)',
           }}>
        {/* دوائر زخرفيّة */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/40 pointer-events-none"></div>
        <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-gold-deep/8 pointer-events-none"></div>

        {/* الصفّ العلوي: العلامة + المستوى */}
        <div className="relative z-10 flex items-start justify-between mb-5">
          <div>
            <div className="font-en-display italic text-xl md:text-2xl text-gold-dark">
              The First Lady
            </div>
            <div className="font-en-label text-[9px] tracking-[0.3em] text-gold-deep mt-0.5">
              MEMBERSHIP CARD
            </div>
          </div>
          <div className="text-left">
            <div className="inline-flex items-center gap-1 px-3 py-1 bg-white/70 backdrop-blur rounded-full border border-gold-light/40">
              <span className="text-sm">{info.emoji}</span>
              <span className="font-en-label text-[9px] tracking-[0.2em] text-gold-deep font-bold">
                {tierLabelEn}
              </span>
            </div>
          </div>
        </div>

        {/* النقاط · العدد الكبير */}
        <div className="relative z-10 mb-5">
          <div className="font-en-label text-[9px] tracking-[0.3em] text-gold-deep mb-1">
            AVAILABLE POINTS
          </div>
          <div className="font-en-display text-5xl md:text-6xl font-light text-gold-dark leading-none">
            {points.toLocaleString()}
          </div>
          <div className="text-xs text-gold-deep mt-2 font-ar-display italic">
            تعادل {Math.floor(points / 10).toLocaleString()} ر.س خصم على حجزكِ القادم
          </div>
        </div>

        {/* شريط التقدّم */}
        {info.next ? (
          <div className="relative z-10">
            <div className="h-2 bg-white/50 rounded-full overflow-hidden mb-2">
              <div
                className="h-full bg-gradient-to-r from-gold-deep to-gold transition-all duration-1000 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-gold-deep font-ar-display italic">
                عضويّة {info.label}
              </span>
              <span className="font-en-label tracking-wider text-gold-deep font-bold">
                {remaining.toLocaleString()} ر.س للترقية
              </span>
            </div>
          </div>
        ) : (
          <div className="relative z-10 text-center py-2">
            <div className="text-sm font-bold text-gold-dark font-ar-display">
              ✨ أعلى مستوى · شكراً لولائكِ 💎
            </div>
          </div>
        )}
      </div>

      {/* ═══ مميّزاتكِ ═══ */}
      <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-cream-100 flex items-center justify-between">
          <div className="font-en-label text-[9px] tracking-[0.3em] text-gold-deep font-bold">
            YOUR PERKS
          </div>
          <div className="text-[10px] text-ink-muted font-ar-display italic">
            {activePerks.length} مميّزات مفعّلة
          </div>
        </div>
        <div className="divide-y divide-cream-100">
          {activePerks.map((p, i) => (
            <div key={i} className="px-5 py-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cream-100 flex items-center justify-center shrink-0 text-base">
                {p.icon}
              </div>
              <div className="text-sm text-ink flex-1">{p.text}</div>
              <span className="text-[10px] text-emerald-600 font-bold">✓</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GroupSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light px-4 pb-2 font-bold">
        {label}
      </div>
      <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-sm">
        {children}
      </div>
    </div>
  );
}

function GroupRow({
  href,
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
  highlight,
}: {
  href: string;
  icon: any;
  label: string;
  value?: string;
  iconBg: string;
  iconColor: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-cream-50 border-b border-cream-100 last:border-b-0 ${highlight ? 'bg-gold-light/5' : ''}`}
    >
      <div className={`w-9 h-9 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-ink font-bold">{label}</div>
      </div>
      {value && (
        <div className="text-xs text-ink-muted shrink-0 flex items-center gap-2">
          <span>{value}</span>
          <ChevronLeft className="w-3.5 h-3.5 text-ink-muted" />
        </div>
      )}
      {!value && <ChevronLeft className="w-3.5 h-3.5 text-ink-muted" />}
    </Link>
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
  const glow = {
    gold:    'rgba(201, 169, 110, 0.25)',
    emerald: 'rgba(16, 185, 129, 0.2)',
    pink:    'rgba(236, 72, 153, 0.2)',
    violet:  'rgba(139, 92, 246, 0.2)',
  }[color];

  return (
    <div
      className="group relative glass-card rounded-2xl p-4 md:p-5 overflow-hidden hover:scale-[1.02] transition-transform"
      style={{ boxShadow: `0 4px 20px -8px ${glow}` }}
    >
      {/* ضوء ذهبي يظهر عند الـhover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${glow}, transparent 60%)` }}
      />
      <div className="relative">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="font-en-display text-xl md:text-2xl font-bold text-ink truncate">{value}</div>
        <div className="text-[11px] md:text-xs text-ink-soft mt-0.5 font-semibold truncate">{label}</div>
      </div>
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
        دللي نفسكِ بتجربة فاخرة في The First Lady
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
