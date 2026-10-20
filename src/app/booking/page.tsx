/**
 * Booking Page — صفحة الحجز
 * ═══════════════════════════════════════════════════════════
 * - Server Component يجلب الخدمات والبكجات والساعات
 * - يسلمها لـ BookingWizard (Client Component)
 */
import { createClient } from '@/lib/supabase/server';
import BookingWizard from '@/components/booking/BookingWizard';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const dynamic = 'force-dynamic';

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ repeat?: string; service?: string; package?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const [
    { data: user },
    { data: categories },
    { data: services },
    { data: packages },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
    supabase.from('services').select('*').eq('is_active', true).order('display_order'),
    supabase.from('packages').select('*').eq('is_active', true).order('display_order'),
  ]);

  let profile = null;
  if (user?.user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.user.id).single();
    profile = data;
  }

  // 🔁 إعادة حجز سابق · جلب الخدمات والموظفة
  let repeatBooking: { serviceIds: string[]; staffId: string | null; packageId: string | null } | null = null;
  if (params.repeat && user?.user) {
    const { data: booking } = await supabase
      .from('bookings')
      .select('id, staff_id, items:booking_items(service_id)')
      .eq('id', params.repeat)
      .eq('customer_id', user.user.id)
      .single();

    if (booking) {
      repeatBooking = {
        serviceIds: (booking.items || []).map((i: any) => i.service_id).filter(Boolean),
        staffId: booking.staff_id,
        packageId: null, // الباقات تنربط بالحجز عبر الخدمات
      };
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center mb-8">
            <div className="font-en-label text-[10px] tracking-[0.3em] text-gold mb-2">
              RESERVATION
            </div>
            <h1 className="font-ar-display text-3xl md:text-4xl font-bold text-gold-deep mb-2">
              {repeatBooking ? 'كرّري حجزكِ السابق' : 'احجزي موعدكِ'}
            </h1>
            <p className="text-ink-soft text-sm">
              {repeatBooking
                ? '🔁 الخدمات والموظفة محمّلة مسبقاً · اختاري بس التاريخ'
                : 'اختاري الخدمات والوقت الذي يناسبكِ'}
            </p>
          </div>

          <BookingWizard
            categories={categories || []}
            services={services || []}
            packages={packages || []}
            user={profile}
            prefill={repeatBooking}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
