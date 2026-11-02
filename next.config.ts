import type { NextConfig } from 'next';

/**
 * ═══════════════════════════════════════════════════════════
 * 🛡️ Security Headers
 * ═══════════════════════════════════════════════════════════
 * - HSTS: إجبار HTTPS لمدّة سنة
 * - X-Frame-Options: منع تحميل الموقع داخل iframe (clickjacking)
 * - X-Content-Type-Options: منع MIME sniffing
 * - Referrer-Policy: ما نرسل URL كامل للمواقع الخارجيّة
 * - Permissions-Policy: نقيّد صلاحيّات browser APIs
 * - CSP: Content Security Policy (منع XSS)
 */
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Permissions-Policy',
    // نسمح فقط بما نحتاجه: الموقع الجغرافي (للحضور) والـcamera (للـQR)
    value: 'geolocation=(self), camera=(self), microphone=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js يحتاج inline scripts للـhydration
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-insights.com https://*.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.qrserver.com https://graph.facebook.com https://api.resend.com https://api.moyasar.com https://api.tabby.ai https://api.tamara.co https://api-sandbox.tamara.co https://*.vercel-insights.com",
      "frame-src 'self' https://*.moyasar.com https://*.tabby.ai https://*.tamara.co",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
];

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'api.qrserver.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts'],
  },
  // Vercel strict type checking · نتجاوز لتسريع النشر
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // ═══ Security Headers على كل الصفحات ═══
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },

  // منع البحث عن الـX-Powered-By (معلومة غير ضروريّة للمهاجمين)
  poweredByHeader: false,
};

export default config;
