/**
 * MobileBottomNav — شريط تنقّل سفلي ناعم فاخر حديث
 * ═══════════════════════════════════════════════════════════
 * • يطفو فوق المحتوى بـ shadow ناعم
 * • زر "+" ذهبي كبير بالوسط لحجز سريع
 * • الأيقونة النشطة بذهبي عميق · غير النشطة بـink-soft
 * • يختفي في صفحات محدّدة (admin, login, booking, ...)
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Plus, Heart, User } from 'lucide-react';
import { haptic } from '@/lib/mobile/haptics';

const TABS = [
  { href: '/',                  icon: Home,     label: 'الرئيسية' },
  { href: '/account/bookings',  icon: Calendar, label: 'حجوزاتي' },
  { href: '/booking',           icon: Plus,     label: 'احجزي',    primary: true },
  { href: '/account/favorites', icon: Heart,    label: 'المفضّلة' },
  { href: '/account',           icon: User,     label: 'حسابي' },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  // إخفاء في الصفحات اللي ما يناسبها الشريط
  const SERVICE_DETAIL_RE = /^\/services\/[^/]+$/;
  if (pathname?.startsWith('/admin') ||
      pathname?.startsWith('/login') ||
      pathname?.startsWith('/signup') ||
      pathname?.startsWith('/legal') ||
      pathname?.startsWith('/booking') ||
      pathname?.startsWith('/cart') ||
      pathname?.startsWith('/account/bookings/') ||
      (pathname && SERVICE_DETAIL_RE.test(pathname))) {
    return null;
  }

  return (
    <nav
      className="md:hidden fixed inset-x-0 z-40 flex justify-center pointer-events-none"
      style={{
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      }}
      aria-label="التنقّل السفلي"
    >
      <div
        className="pointer-events-auto bg-white rounded-[28px] shadow-fab border border-cream-100 flex items-center justify-around px-1.5 py-2"
        style={{ width: 'calc(100vw - 24px)', maxWidth: 420 }}
      >
        {TABS.map((tab) => {
          const active = pathname === tab.href
            || (tab.href !== '/' && pathname?.startsWith(tab.href));

          if (tab.primary) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                onClick={() => haptic('medium')}
                className="relative -mt-7 flex items-center justify-center shrink-0"
                aria-label={tab.label}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-light via-gold to-gold-deep shadow-fab flex items-center justify-center text-white border-[3px] border-white transition-transform active:scale-95">
                  <tab.icon className="w-6 h-6" strokeWidth={2.5} />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              onClick={() => haptic('light')}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 min-w-0 relative"
            >
              <tab.icon
                className={`w-[22px] h-[22px] transition-all ${
                  active ? 'text-gold-deep scale-110' : 'text-ink-soft'
                }`}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span className={`text-[9.5px] truncate transition-colors ${
                active ? 'text-gold-deep font-bold' : 'text-ink-soft font-medium'
              }`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
