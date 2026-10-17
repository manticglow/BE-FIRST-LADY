/**
 * الصفحة الرئيسية — Home
 * ═══════════════════════════════════════════════════════════
 *
 * Server Component — تجيب البيانات من Supabase وقت التحميل
 * (SSG مع revalidation كل 60 ثانية)
 */
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import StorySection from '@/components/sections/StorySection';
import SummerOfferSection from '@/components/sections/SummerOfferSection';
import HoursSection from '@/components/sections/HoursSection';
import LashesBannerSection from '@/components/sections/LashesBannerSection';
import GallerySection from '@/components/sections/GallerySection';
import ServicesSection from '@/components/sections/ServicesSection';
import ReviewsSection from '@/components/sections/ReviewsSection';
import ContactSection from '@/components/sections/ContactSection';
import FloatingButtons from '@/components/ui/FloatingButtons';
import LoaderScreen from '@/components/ui/LoaderScreen';
import MobileHomeApp from '@/components/mobile/MobileHomeApp';

export const revalidate = 60; // أعد التحميل كل دقيقة

export default async function HomePage() {
  const supabase = await createClient();

  // جلب كل البيانات بالتوازي + معلومات المستخدم
  const [
    { data: categories },
    { data: services },
    { data: offer },
    { data: packages },
    { data: gallery },
    { data: reviews },
    { data: hours },
    { data: { user } },
  ] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
    supabase.from('services').select('*, category:categories(*)').eq('is_active', true).order('display_order'),
    supabase.from('packages').select('*, services:package_services(service:services(*))').eq('slug', 'summer-2026').single(),
    supabase.from('packages').select('*').eq('is_active', true).order('display_order'),
    supabase.from('gallery').select('*').eq('is_published', true).order('display_order').limit(9),
    supabase.from('reviews').select('*').eq('is_approved', true).order('created_at', { ascending: false }).limit(6),
    supabase.from('hours').select('*'),
    supabase.auth.getUser(),
  ]);

  let userProfile = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
    userProfile = data;
  }

  return (
    <>
      <LoaderScreen />

      {/* ═══ تجربة التطبيق · للموبايل فقط ═══ */}
      {categories && services && (
        <MobileHomeApp
          categories={categories}
          services={services}
          packages={packages || []}
          user={userProfile}
        />
      )}

      {/* ═══ الموقع الفاخر · للتابلت والديسكتوب ═══ */}
      <div className="hidden md:block">
        <Header />
        <main>
          <HeroSection />
          <StorySection />
          {offer && <SummerOfferSection offer={offer} />}
          <HoursSection hours={hours || []} />
          <LashesBannerSection />
          {gallery && <GallerySection items={gallery} />}
          {categories && services && (
            <ServicesSection categories={categories} services={services} />
          )}
          {reviews && <ReviewsSection reviews={reviews} />}
          <ContactSection />
        </main>
        <Footer />
        <FloatingButtons />
      </div>
    </>
  );
}
