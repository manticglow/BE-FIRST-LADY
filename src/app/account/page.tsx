/**
 * Account Dashboard — لوحة العميلة
 * ═══════════════════════════════════════════════════════════
 * - آخر الحجوزات
 * - أزرار سريعة (حجز جديد، تعديل البروفايل)
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BookingCard from '@/components/account/BookingCard';
import { CalendarPlus, Clock, Heart, User as UserIcon, Award, Sparkles, Gift } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const TIER_INFO: Record<string, { label: string; color: string; next: number | null }> = {
  bronze:   { label: 'برونزية', color: 'from-amber-600 to-amber-800', next: 2000 },
  silver:   { label: 'فضيّة',   color: 'from-slate-400 to-slate-600', next: 5000 },
  gold:     { label: 'ذهبيّة',  color: 'from-yellow-500 to-yellow-700', next: 10000 },
  diamond:  { label: 'ماسيّة',  color: 'from-cyan-500 to-blue-700', next: null },
};

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account');

  const [{ data: profile }, { data: bookings }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('bookings').select('*, items:booking_items(*)')
      .eq('customer_id', user.id)
      .order('booking_date', { ascending: false })
      .limit(10),
  ]);

  const upcoming = (bookings || []).filter(
    (b) => new Date(b.booking_date) >= new Date(new Date().toISOString().split('T')[0]) && b.status !== 'cancelled'
  );
  const past = (bookings || []).filter(
    (b) => new Date(b.booking_date) < new Date(new Date().toISOString().split('T')[0]) || b.status === 'completed'
  );

  const totalSpent = (bookings || [])
    .filter((b) => b.payment_status === 'paid')
    .reduce((sum, b) => sum + Number(b.total), 0);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
          {/* ترحيب */}
          <div className="mb-8">
            <h1 className="font-ar-display text-3xl md:text-4xl font-bold text-gold-deep">
              أهلاً بكِ، {profile?.full_name?.split(' ')[0] || 'عزيزتي'} 🌸
            </h1>
            <p className="text-ink-soft mt-1 text-sm">
              إليكِ ملخّص حسابكِ
            </p>
          </div>

          {/* بطاقة الولاء */}
          {profile && (
            <LoyaltyCard
              points={profile.loyalty_points || 0}
              tier={profile.loyalty_tier || 'bronze'}
              totalSpent={profile.total_spent || 0}
            />
          )}

          {/* إحصائيات سريعة */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <QuickCard icon={CalendarPlus} label="حجوزات قادمة" value={String(upcoming.length)} />
            <QuickCard icon={Heart} label="زيارات سابقة" value={String(past.length)} />
            <QuickCard icon={Clock} label="إجمالي الإنفاق" value={formatPrice(totalSpent)} />
            <QuickCard icon={UserIcon} label="عضو منذ" value={new Date(profile?.created_at || '').getFullYear().toString()} />
          </div>

          {/* أزرار سريعة */}
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {/* زر الحضور للموظفات */}
            {profile && ['staff', 'manager', 'owner'].includes(profile.role) && (
              <Link
                href="/account/attendance"
                className="bg-gradient-to-l from-success to-emerald-700 text-white rounded-2xl p-5 flex items-center justify-between hover:shadow-lg transition-shadow sm:col-span-2"
              >
                <div>
                  <div className="font-ar-display text-lg font-bold">⏱ الحضور والانصراف</div>
                  <div className="text-xs opacity-90 mt-1">سجّلي وصولكِ للعمل بتحديد الموقع</div>
                </div>
                <Clock className="w-8 h-8 opacity-80" />
              </Link>
            )}

            <Link
              href="/booking"
              className="bg-gradient-to-l from-gold-deep to-ink text-cream-50 rounded-2xl p-5 flex items-center justify-between hover:shadow-lg transition-shadow"
            >
              <div>
                <div className="font-ar-display text-lg font-bold">احجزي موعداً جديداً</div>
                <div className="text-xs text-gold-light mt-1">خدمات مختارة بعناية</div>
              </div>
              <CalendarPlus className="w-8 h-8 text-gold-light" />
            </Link>

            <Link
              href="/account/profile"
              className="bg-white border border-cream-200 rounded-2xl p-5 flex items-center justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="font-ar-display text-lg font-bold text-ink">بياناتي الشخصية</div>
                <div className="text-xs text-ink-soft mt-1">تعديل الاسم والجوال</div>
              </div>
              <UserIcon className="w-8 h-8 text-gold-deep" />
            </Link>

            <Link
              href="/account/referral"
              className="bg-gradient-to-l from-pink-500 to-rose-700 text-white rounded-2xl p-5 flex items-center justify-between hover:shadow-lg transition-shadow sm:col-span-2"
            >
              <div>
                <div className="font-ar-display text-lg font-bold">🎁 ادعي صديقاتكِ واربحي</div>
                <div className="text-xs opacity-90 mt-1">50 ر.س لكِ ولصديقتكِ عند أول حجز</div>
              </div>
              <Gift className="w-8 h-8 opacity-80" />
            </Link>
          </div>

          {/* الحجوزات القادمة */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-ar-display text-xl font-bold text-ink">
                الحجوزات القادمة
              </h2>
              <Link href="/account/bookings" className="text-xs text-gold-deep hover:text-gold font-bold">
                كل الحجوزات ←
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-cream-200">
                <div className="text-ink-soft text-sm mb-3">ما عندكِ حجوزات قادمة بعد</div>
                <Link href="/booking" className="btn-primary !py-2 !px-4 text-sm inline-block">
                  احجزي الآن
                </Link>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-3">
                {upcoming.map((b) => <BookingCard key={b.id} booking={b} />)}
              </div>
            )}
          </section>

          {/* الحجوزات السابقة */}
          {past.length > 0 && (
            <section>
              <h2 className="font-ar-display text-xl font-bold text-ink mb-4">
                زياراتكِ السابقة
              </h2>
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

function QuickCard({ icon: Icon, label, value }: any) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-cream-200 shadow-sm">
      <Icon className="w-6 h-6 text-gold-deep mb-2" />
      <div className="font-en-display text-2xl font-bold text-ink">{value}</div>
      <div className="text-xs text-ink-soft mt-1">{label}</div>
    </div>
  );
}

function LoyaltyCard({ points, tier, totalSpent }: { points: number; tier: string; totalSpent: number }) {
  const info = TIER_INFO[tier] || TIER_INFO.bronze;
  const progress = info.next ? Math.min(100, (totalSpent / info.next) * 100) : 100;
  const remaining = info.next ? info.next - totalSpent : 0;

  return (
    <div className={`bg-gradient-to-l ${info.color} text-white rounded-3xl p-6 mb-6 shadow-lg relative overflow-hidden`}>
      <div className="absolute top-0 right-0 opacity-10">
        <Sparkles className="w-32 h-32" />
      </div>
      <div className="relative z-10 grid md:grid-cols-3 gap-4 items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-5 h-5" />
            <span className="font-en-label text-[10px] tracking-[0.3em]">LOYALTY TIER</span>
          </div>
          <div className="font-ar-display text-3xl font-bold">عضوة {info.label}</div>
        </div>
        <div>
          <div className="text-xs opacity-80 mb-1">نقاطكِ</div>
          <div className="font-en-display text-4xl font-bold">{points.toLocaleString()}</div>
          <div className="text-xs opacity-80 mt-1">كل 10 ر.س = نقطة</div>
        </div>
        <div>
          {info.next ? (
            <>
              <div className="text-xs opacity-80 mb-1">
                {remaining.toFixed(0)} ر.س للطبقة التالية
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="text-[10px] opacity-70 mt-1 font-en-display">{progress.toFixed(0)}%</div>
            </>
          ) : (
            <div className="text-sm">✨ أعلى طبقة — شكراً لولائكِ 💎</div>
          )}
        </div>
      </div>
    </div>
  );
}
