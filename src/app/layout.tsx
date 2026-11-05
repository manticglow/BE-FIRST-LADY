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
import LoaderScreen from '@/components/ui/LoaderScreen';
import ScrollToTop from '@/components/ui/ScrollToTop';
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://befirstlady.com'),
  title: {
    default: 'Be First Lady — صالون السيدة الأولى · المدينة المنوّرة',
    template: '%s · Be First Lady',
  },
  description: 'مركز نسائي متكامل في قلب المدينة المنوّرة — ترفٌ يليق بك، وجمالٌ يُحكى عنه. مساج، حمّام مغربي، تنظيف بشرة، شعر، مكياج.',
  keywords: ['سبا', 'صالون', 'المدينة المنورة', 'مساج', 'حمام مغربي', 'تنظيف بشرة', 'مكياج', 'شعر'],
  authors: [{ name: 'Be First Lady' }],
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: '/',
    title: 'Be First Lady — صالون السيدة الأولى',
    description: 'نعتني بكِ لتُزهري · A Sanctuary for You to Bloom',
    siteName: 'Be First Lady',
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Be First Lady',
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
    statusBarStyle: 'default',
    title: 'Be First Lady',
    startupImage: '/apple-splash.png',
  },
  applicationName: 'Be First Lady',
  formatDetection: {
    telephone: true,
  },
};

export const viewport: Viewport = {
  themeColor: '#7d613b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
          href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Cairo:wght@300;400;500;600;700;800&family=Cinzel:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />

        {/* ─── JSON-LD · Schema.org LocalBusiness ─── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BeautySalon',
              name: 'Be First Lady',
              alternateName: 'بي فيرست ليدي',
              description: 'مركز نسائي متكامل في قلب المدينة المنوّرة · سبا · صالون · تجميل',
              url: 'https://befirstlady.com',
              logo: 'https://befirstlady.com/images/logo.png',
              image: 'https://befirstlady.com/images/og-image.jpg',
              telephone: '+966504389329',
              email: 'info@befirstlady.com',
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
                'https://instagram.com/befirstlady',
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
        <LoaderScreen />
        <ThemeProvider />
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
