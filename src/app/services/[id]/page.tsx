/**
 * Service Detail Page — صفحة تفاصيل الخدمة
 * ═══════════════════════════════════════════════════════════
 * - صورة · عنوان · وصف · سعر
 * - زر "أضيفي للسلة" (يتطلّب تسجيل دخول)
 * - زر "احجزي الآن"
 * - التفاصيل · المدة · ملاحظات
 * - التقييمات من العميلات اللي حجزن هذه الخدمة
 */
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ServiceDetailClient from '@/components/services/ServiceDetailClient';

export const dynamic = 'force-dynamic';

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // جلب الخدمة
  const { data: service } = await supabase
    .from('services')
    .select('*, category:categories(*)')
    .eq('id', id)
    .single();

  if (!service) notFound();

  // جلب المستخدم (لمعرفة إذا مسجّلة)
  const { data: { user } } = await supabase.auth.getUser();
  let userProfile = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();
    userProfile = data;
  }

  // جلب التقييمات لهذه الخدمة (من حجوزات تحتوي عليها)
  const { data: relatedBookings } = await supabase
    .from('booking_items')
    .select('booking_id')
    .eq('service_id', id);

  const bookingIds = (relatedBookings || []).map((b) => b.booking_id);
  let reviews: any[] = [];
  if (bookingIds.length > 0) {
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('*')
      .in('booking_id', bookingIds)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(20);
    reviews = reviewsData || [];
  }

  // متوسط التقييم
  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length
    : null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24 pb-28">
        <ServiceDetailClient
          service={service}
          reviews={reviews}
          avgRating={avgRating}
          isLoggedIn={!!user}
          userName={userProfile?.full_name}
        />
      </main>
      <Footer />
    </>
  );
}
