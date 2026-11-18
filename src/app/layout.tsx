/**
 * Root Layout — الهيكل العام للموقع
 * ═══════════════════════════════════════════════════════════
 * الخطوط تُحمَّل عبر CSS <link> مباشرة في <head>
 * (بدلاً من next/font اللي كان يفشل في البناء على Vercel)
 */
import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import PWARegister from '@/components/ui/PWARegister';
import FirstLoadSplash from '@/components/ui/FirstLoadSplash';
import CookieConsent from '@/components/legal/CookieConsent';
import LoaderScreen from '@/components/ui/LoaderScreen';
import ScrollToTop from '@/components/ui/ScrollToTop';
import AdminModeGuard from '@/components/ui/AdminModeGuard';
import { Suspense } from 'react';
import ThemeProvider from '@/components/theme/ThemeProvider';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import ScrollProgress from '@/components/fx/ScrollProgress';
import CartFab from '@/components/cart/CartFab';
import BookingSuccessModal from '@/components/booking/BookingSuccessModal';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

// ═══════ Metadata (SEO) ═══════
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://thefirstlady.sa'),
  title: {
    default: 'The First Lady — مشغل السيدة الأولى · المدينة المنوّرة',
    template: '%s · The First Lady',
  },
  description: 'مركز نسائي متكامل في قلب المدينة المنوّرة — ترفٌ يليق بك، وجمالٌ يُحكى عنه. مساج، حمّام مغربي، تنظيف بشرة، شعر، مكياج.',
  keywords: ['سبا', 'صالون', 'المدينة المنورة', 'مساج', 'حمام مغربي', 'تنظيف بشرة', 'مكياج', 'شعر'],
  authors: [{ name: 'The First Lady' }],
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: '/',
    title: 'The First Lady — مشغل السيدة الأولى',
    description: 'نعتني بكِ لتُزهري · A Sanctuary for You to Bloom',
    siteName: 'The First Lady',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The First Lady',
    description: 'نعتني بكِ لتُزهري',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32' },
      { url: '/favicon-16.png', sizes: '16x16' },
    ],
    apple: [
      { url: '/icons/icon-180.png', sizes: '180x180' },
    ],
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    // 'default' = أيقونات شريط الحالة سوداء · تناسب خلفيّة كريم فاتحة
    // (كانت 'black-translucent' = أيقونات بيضاء غير مرئيّة على كريم)
    statusBarStyle: 'default',
    title: 'The First Lady',
    startupImage: '/apple-splash.png',
  },
  applicationName: 'The First Lady · مشغل السيدة الأولى',
  formatDetection: {
    telephone: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#fbf7ef',   // كريم يطابق خلفيّة الموقع · شريط الحالة ينسجم
  width: 'device-width',
  initialScale: 1,
  // ⚠️ لا نضع maximumScale = 1 (ينتهك WCAG + Apple يمنعه في PWA)
  // الـzoom على الـinputs محلول بـfont-size:16px في globals.css
  viewportFit: 'cover',
};

// ═══════ Root Layout ═══════
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      style={{ colorScheme: 'light' }}
    >
      <head>
        {/* ─── Google Fonts عبر CSS link (آمن ضد فشل next/font) ─── */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@300;400;500;600;700;800&family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Pinyon+Script&display=swap"
          rel="stylesheet"
        />

        {/* ─── JSON-LD · Schema.org LocalBusiness ─── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BeautySalon',
              name: 'The First Lady',
              alternateName: 'بي فيرست ليدي',
              description: 'مركز نسائي متكامل في قلب المدينة المنوّرة · سبا · صالون · تجميل',
              url: 'https://thefirstlady.sa',
              logo: 'https://thefirstlady.sa/images/logo.png',
              image: 'https://thefirstlady.sa/images/og-image.jpg',
              telephone: '+966504389329',
              email: 'info@thefirstlady.sa',
              priceRange: '$$$',
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'حي العوالي',
                addressLocality: 'المدينة المنوّرة',
                addressRegion: 'المنطقة الغربيّة',
                postalCode: '42311',
                addressCountry: 'SA',
              },
              geo: {
                '@type': 'GeoCoordinates',
                latitude: 24.4539,
                longitude: 39.6193,
              },
              openingHoursSpecification: {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                opens: '10:00',
                closes: '23:00',
              },
              sameAs: [
                'https://instagram.com/thefirstlady',
                'https://wa.me/966504389329',
              ],
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                reviewCount: '150',
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-cream-50 md:bg-brand-radial md:bg-fixed pb-20 md:pb-0 text-ink">
        <Suspense fallback={null}><ScrollToTop /></Suspense>
        <ScrollProgress />
        <FirstLoadSplash />
        <CookieConsent />
        <LoaderScreen />
        <ThemeProvider />
        {/* بنر "أنتِ تتصفّحين كـمديرة" لحسابات الإدارة · يظهر أعلى كل الصفحات ما عدا /admin و /staff */}
        <Suspense fallback={null}><AdminModeGuard /></Suspense>
        {children}
        <Analytics />
        <SpeedInsights />
        <BookingSuccessModal />
        <CartFab />
        <MobileBottomNav />
        <PWARegister />
        <Toaster
          position="top-center"
          dir="rtl"
          toastOptions={{
            style: {
              background: 'linear-gradient(to left, #fbf7ef, #f6eee0)',
              border: '1px solid #c9a96e',
              color: '#2a1c10',
              fontFamily: 'Cairo, sans-serif',
              borderRadius: '16px',
              boxShadow: '0 10px 40px -10px rgba(125, 97, 59, 0.25)',
            },
            classNames: {
              success: '!border-success !bg-success/10',
              error: '!border-danger !bg-danger/10',
            },
          }}
        />
      </body>
    </html>
  );
}
