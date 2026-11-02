/**
 * /account/history — تاريخ الزيارات مع صور قبل/بعد
 */
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import {
  ChevronRight, Camera, Clock, Calendar, Sparkles, TrendingUp, Image as ImageIcon,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'تاريخ زياراتي · Be First Lady',
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/history');

  // جلب كل الحجوزات المكتملة مع صورها
  const { data: completed } = await supabase
    .from('bookings')
    .select(`
      id, booking_date, booking_time, total, booking_number,
      items:booking_items(service_name, service_id),
      photos:visit_photos(id, photo_type, photo_url, caption, is_shareable)
    `)
    .eq('customer_id', user.id)
    .eq('status', 'completed')
    .order('booking_date', { ascending: false })
    .limit(50);

  const visits = (completed as any[]) || [];
  const totalVisits = visits.length;
  const totalSpent = visits.reduce((s, v) => s + Number(v.total || 0), 0);
  const uniqueServices = new Set(
    visits.flatMap((v) => (v.items || []).map((i: any) => i.service_id))
  ).size;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4">

          <Link
            href="/account"
            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 mb-4"
          >
            <ChevronRight className="w-4 h-4" />
            عودة للحساب
          </Link>

          {/* Hero */}
          <div className="bg-gradient-to-br from-amber-50 via-rose-50 to-pink-50 rounded-3xl p-6 mb-6 border border-amber-100">
            <div className="editorial-eyebrow text-amber-700/80 mb-1">YOUR JOURNEY</div>
            <h1 className="font-ar-display text-2xl md:text-3xl font-bold text-ink mb-4 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-amber-600" />
              رحلة جمالكِ معنا
            </h1>

            <div className="grid grid-cols-3 gap-3">
              <StatBlock value={totalVisits} label="زيارة" color="amber" />
              <StatBlock value={uniqueServices} label="خدمة مختلفة" color="rose" />
              <StatBlock value={formatPrice(totalSpent, { showFrom: false }).replace(' ر.س', '')} label="إنفاق كلّي" color="pink" />
            </div>
          </div>

          {/* Timeline */}
          {visits.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-cream-200">
              <Camera className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <p className="text-ink-soft">ما عندكِ أي زيارات مكتملة بعد</p>
              <Link
                href="/booking"
                className="mt-4 inline-block bg-gold-deep text-cream-50 px-4 py-2 rounded-xl text-sm font-bold"
              >
                احجزي أول زيارة
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {visits.map((v) => <VisitCard key={v.id} visit={v} />)}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}

function StatBlock({ value, label, color }: { value: any; label: string; color: 'amber' | 'rose' | 'pink' }) {
  const colors = {
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-pink-500',
    pink: 'from-pink-500 to-purple-500',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-2xl p-3 text-center shadow-sm`}>
      <div className="font-en-display font-bold text-2xl leading-none">{value}</div>
      <div className="text-[10px] opacity-90 mt-1">{label}</div>
    </div>
  );
}

function VisitCard({ visit }: { visit: any }) {
  const date = new Date(visit.booking_date);
  const beforePhotos = (visit.photos || []).filter((p: any) => p.photo_type === 'before');
  const afterPhotos = (visit.photos || []).filter((p: any) => p.photo_type === 'after');

  return (
    <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">

      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-light/15 to-gold-light/5 flex flex-col items-center justify-center text-gold-deep shrink-0">
            <div className="font-en-display font-bold text-xl leading-none">
              {date.getDate()}
            </div>
            <div className="text-[9px] opacity-70 mt-0.5">
              {date.toLocaleString('ar-SA', { month: 'short' })}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-ar-display font-bold text-sm text-ink">
              {visit.items?.[0]?.service_name || 'زيارة'}
              {visit.items?.length > 1 && (
                <span className="text-gold-deep text-xs mr-1">+{visit.items.length - 1}</span>
              )}
            </div>
            <div className="text-[11px] text-ink-soft mt-1 flex items-center gap-2">
              <Clock className="w-3 h-3" />
              {visit.booking_time?.slice(0, 5)}
              <span>·</span>
              <span className="font-en-display">#{visit.booking_number || visit.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>
        <div className="text-left">
          <div className="font-en-display font-bold text-sm text-gold-deep">
            {formatPrice(visit.total, { showFrom: false })}
          </div>
        </div>
      </div>

      {/* صور قبل/بعد */}
      {(beforePhotos.length > 0 || afterPhotos.length > 0) && (
        <div className="border-t border-cream-100 p-4 bg-stone-50/50">
          <div className="editorial-eyebrow text-stone-400 mb-2">BEFORE · AFTER</div>
          <div className="grid grid-cols-2 gap-3">
            {beforePhotos.length > 0 && (
              <div>
                <div className="text-[10px] text-stone-500 mb-1 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  قبل
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {beforePhotos.slice(0, 2).map((p: any) => (
                    <img key={p.id} src={p.photo_url} alt="before"
                         className="w-full aspect-square object-cover rounded-lg" />
                  ))}
                </div>
              </div>
            )}
            {afterPhotos.length > 0 && (
              <div>
                <div className="text-[10px] text-rose-600 mb-1 flex items-center gap-1 font-bold">
                  <Sparkles className="w-3 h-3" />
                  بعد ✨
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {afterPhotos.slice(0, 2).map((p: any) => (
                    <img key={p.id} src={p.photo_url} alt="after"
                         className="w-full aspect-square object-cover rounded-lg ring-2 ring-rose-200" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(visit.photos || []).length === 0 && (
        <div className="border-t border-cream-100 px-4 py-2.5 text-[10px] text-stone-400 text-center">
          لا توجد صور لهذه الزيارة بعد
        </div>
      )}
    </div>
  );
}
