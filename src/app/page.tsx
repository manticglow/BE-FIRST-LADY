/**
 * الصفحة الرئيسية — Home v3.0 · Editorial Luxury
 * ═══════════════════════════════════════════════════════════
 * ترتيب الأقسام الجديد (تدفّق سينمائي):
 *   1. Hero (editorial)
 *   2. Story (قصّتنا)
 *   3. SignatureServices (bento grid)
 *   4. Summer Offer (إذا موجود)
 *   5. Services (قائمة كاملة)
 *   6. Trust (الأرقام والوعود)
 *   7. Gallery (معرض الأعمال)
 *   8. Reviews (آراء العميلات)
 *   9. Hours
 *   10. Contact
 */
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import StorySection from '@/components/sections/StorySection';
import SignatureServicesSection from '@/components/sections/SignatureServicesSection';
import SummerOfferSection from '@/components/sections/SummerOfferSection';
import ServicesSection from '@/components/sections/ServicesSection';
import TrustSection from '@/components/sections/TrustSection';
import GallerySection from '@/components/sections/GallerySection';
import ReviewsSection from '@/components/sections/ReviewsSection';
import HoursSection from '@/components/sections/HoursSection';
import LashesBannerSection from '@/components/sections/LashesBannerSection';
import ContactSection from '@/components/sections/ContactSection';
import FAQSection from '@/components/sections/FAQSection';
import FloatingButtons from '@/components/ui/FloatingButtons';
import LoaderScreen from '@/components/ui/LoaderScreen';
import MobileHomeApp from '@/components/mobile/MobileHomeApp';
import Reveal from '@/components/ui/Reveal';

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
          {/* 1. البطل · Hero editorial */}
          <HeroSection />

          {/* 2. قصّتنا */}
          <Reveal direction="up"><StorySection /></Reveal>

          {/* 3. الخدمات المميّزة · Bento Grid */}
          <Reveal direction="up" delay={80}><SignatureServicesSection /></Reveal>

          {/* 4. العرض الصيفي (إذا موجود) */}
          {offer && <Reveal direction="scale"><SummerOfferSection offer={offer} /></Reveal>}

          {/* 5. قائمة الخدمات الكاملة */}
          {categories && services && (
            <Reveal direction="up">
              <ServicesSection categories={categories} services={services} isLoggedIn={!!user} />
            </Reveal>
          )}

          {/* 6. الأرقام والوعود */}
          <Reveal direction="up"><TrustSection /></Reveal>

          {/* 7. معرض الأعمال */}
          {gallery && <Reveal direction="up"><GallerySection items={gallery} /></Reveal>}

          {/* 8. اللاش بانر */}
          <Reveal direction="scale"><LashesBannerSection /></Reveal>

          {/* 9. آراء العميلات */}
          {reviews && <Reveal direction="up"><ReviewsSection reviews={reviews} /></Reveal>}

          {/* 10. ساعات العمل */}
          <Reveal direction="up"><HoursSection hours={hours || []} /></Reveal>

          {/* 11. أسئلة شائعة */}
          <Reveal direction="up"><FAQSection /></Reveal>

          {/* 12. تواصل */}
          <Reveal direction="up"><ContactSection /></Reveal>
        </main>
        <Footer />
        <FloatingButtons />
      </div>
    </>
  );
}
