/**
 * My Bookings — كل حجوزات العميلة
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BookingCard from '@/components/account/BookingCard';

export const dynamic = 'force-dynamic';

export default async function MyBookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/bookings');

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, items:booking_items(*)')
    .eq('customer_id', user.id)
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
          <Link href="/account" className="text-sm text-ink-soft hover:text-gold-deep mb-4 inline-block">
            ← الحساب
          </Link>
          <h1 className="font-ar-display text-3xl font-bold text-gold-deep mb-2">
            جميع حجوزاتي
          </h1>
          <p className="text-ink-soft text-sm mb-8">
            {bookings?.length || 0} حجز
          </p>

          {!bookings || bookings.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-cream-200">
              <div className="text-ink-soft mb-4">ما عندكِ أي حجوزات بعد</div>
              <Link href="/booking" className="btn-primary">احجزي أول موعد</Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {bookings.map((b) => <BookingCard key={b.id} booking={b} />)}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
