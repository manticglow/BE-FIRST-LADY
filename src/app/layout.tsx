import type { Metadata, Viewport } from 'next';
import { Amiri, Cairo, Cormorant_Garamond, Cinzel } from 'next/font/google';
import { Toaster } from 'sonner';
import PWARegister from '@/components/ui/PWARegister';
import NativeShell from '@/components/mobile/NativeShell';
import AppSplash from '@/components/mobile/AppSplash';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import CartFab from '@/components/cart/CartFab';
import BookingSuccessModal from '@/components/booking/BookingSuccessModal';
import './globals.css';

// ═══════ الخطوط (محمّلة محلياً عبر next/font) ═══════
const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
});

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cairo',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cinzel',
  display: 'swap',
});

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
      className={`${amiri.variable} ${cairo.variable} ${cormorant.variable} ${cinzel.variable}`}
    >
      <body className="min-h-screen bg-cream-50 md:bg-brand-radial md:bg-fixed pb-20 md:pb-0">
        <AppSplash />
        {children}
        <BookingSuccessModal />
        <CartFab />
        <MobileBottomNav />
        <NativeShell />
        <PWARegister />
        <Toaster
          position="top-center"
          dir="rtl"
          toastOptions={{
            style: {
              background: 'linear-gradient(to left, #fbf7ef, #f6eee0)',
              border: '1px solid #c9a96e',
              color: '#2a1c10',
              fontFamily: 'var(--font-cairo)',
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
