/**
 * MobileBottomNav — شريط تنقّل سفلي (ناتيف)
 * ═══════════════════════════════════════════════════════════
 * يظهر فقط على الموبايل + داخل التطبيق الناتيف
 * 5 تبويبات: الرئيسية · الحجوزات · حجز جديد · الهدايا · حسابي
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Plus, Gift, User } from 'lucide-react';
import { haptic } from '@/lib/mobile/haptics';

const TABS = [
  { href: '/',               icon: Home,     label: 'الرئيسية' },
  { href: '/account/bookings', icon: Calendar, label: 'حجوزاتي' },
  { href: '/booking',        icon: Plus,     label: 'احجزي',    primary: true },
  { href: '/gift-cards',     icon: Gift,     label: 'هدايا' },
  { href: '/account',        icon: User,     label: 'حسابي' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  // لا نعرضه في صفحات الأدمن أو تسجيل الدخول
  // أخفي الشريط السفلي في الصفحات اللي عندها أزرار إجراء خاصة بها
  const SERVICE_DETAIL_RE = /^\/services\/[^/]+$/;
  if (pathname?.startsWith('/admin') ||
      pathname?.startsWith('/login') ||
      pathname?.startsWith('/signup') ||
      pathname?.startsWith('/legal') ||
      pathname?.startsWith('/booking') ||
      pathname?.startsWith('/cart') ||
      (pathname && SERVICE_DETAIL_RE.test(pathname))) {
    return null;
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-cream-200 pb-safe"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch justify-around px-2 pt-1.5 pb-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href
            || (tab.href !== '/' && pathname?.startsWith(tab.href));

          if (tab.primary) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => haptic('medium')}
                className="relative -mt-6 flex flex-col items-center"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-deep to-ink shadow-lg shadow-gold-deep/30 flex items-center justify-center text-cream-50">
                  <tab.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-gold-deep mt-1">
                  {tab.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => haptic('light')}
              className="flex-1 flex flex-col items-center py-1 min-w-0"
            >
              <tab.icon
                className={`w-5 h-5 transition-colors ${
                  active ? 'text-gold-deep' : 'text-ink-soft'
                }`}
              />
              <span className={`text-[10px] mt-0.5 truncate ${
                active ? 'text-gold-deep font-bold' : 'text-ink-soft'
              }`}>
                {tab.label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-10 h-0.5 bg-gold-deep rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
