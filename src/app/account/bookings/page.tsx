/**
 * My Bookings — كل حجوزات العميلة · Calendar Mini Layout
 * ═══════════════════════════════════════════════════════════
 * - تقويم شهري مُصغّر أعلى الصفحة
 * - قائمة حجوزات اليوم المختار أسفل
 * - زرّ للتبديل بين "التقويم" و"كل الحجوزات"
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BookingsCalendarView from '@/components/account/BookingsCalendarView';

export const dynamic = 'force-dynamic';

export default async function MyBookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/bookings');

  const { data: bookingsRaw } = await supabase
    .from('bookings')
    .select('*, items:booking_items(*)')
    .eq('customer_id', user.id)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false });
  const bookings = (bookingsRaw as any[]) || [];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
          <Link href="/account" className="text-sm text-ink-soft hover:text-gold-deep mb-4 inline-block">
            ← الحساب
          </Link>
          <div className="mb-6">
            <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mb-1">
              MY SCHEDULE
            </div>
            <h1 className="font-ar-display text-3xl md:text-4xl font-bold text-gold-deep italic">
              جدولي
            </h1>
            <p className="text-ink-soft text-sm mt-1">
              {bookings?.length || 0} حجز · اختاري يوم لعرض تفاصيله
            </p>
          </div>

          <BookingsCalendarView bookings={bookings} />
        </div>
      </main>
      <Footer />
    </>
  );
}
