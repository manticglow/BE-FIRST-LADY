/**
 * AdminShell — إطار لوحة الأدمن المتجاوب
 * ═══════════════════════════════════════════════════════════
 * Mobile (<768px):  همبرغر → drawer جانبي + bottom nav سفلي
 * Tablet (768-1024): sidebar مُصغّر (أيقونات فقط)
 * Desktop (≥1024):   sidebar كامل
 */
'use client';

import { useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, CalendarCheck, Users, Scissors, Image as ImageIcon,
  BarChart3, Settings, LogOut, Package, UserCircle, Tag, Star, Shield,
  Clock, Umbrella, Gift, Boxes, Banknote, Bell, BellRing, Menu, X, ChevronLeft,
} from 'lucide-react';
import NotificationBell from '@/components/admin/NotificationBell';
import GlobalSearch from '@/components/admin/GlobalSearch';

type Role = 'owner' | 'manager' | 'staff';

const ICON_MAP = {
  LayoutDashboard, CalendarCheck, Users, Scissors, ImageIcon,
  BarChart3, Settings, Package, UserCircle, Tag, Star, Shield,
  Clock, Umbrella, Gift, Boxes, Banknote, Bell, BellRing,
};

export interface SidebarItem {
  href: string;
  label: string;
  iconKey: keyof typeof ICON_MAP;
  roles: Role[];
  /** يظهر في الـbottom nav على الموبايل · 4 عناصر فقط */
  mobileNav?: boolean;
}

interface Props {
  items: SidebarItem[];
  role: Role;
  fullName: string;
  children: ReactNode;
}

export default function AdminShell({ items, role, fullName, children }: Props) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // أغلقي الـdrawer عند تغيير الصفحة
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // 🌙 إزالة أي بقايا للوضع الليلي القديم (إذا كانت المستخدمة فعّلته من قبل)
  useEffect(() => {
    const admin = document.querySelector('[data-admin-root]');
    admin?.classList.remove('dark');
    try { localStorage.removeItem('bfl_admin_theme'); } catch {}
  }, []);

  // منع scroll الصفحة لمّا الـdrawer مفتوح
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const roleLabel = role === 'owner' ? 'المالكة' : role === 'manager' ? 'المديرة' : 'موظفة';
  const roleEmoji = role === 'owner' ? '👑' : role === 'manager' ? '🛡' : '💼';
  const visibleItems = items.filter((it) => it.roles.includes(role));
  const mobileNavItems = visibleItems.filter((it) => it.mobileNav).slice(0, 4);

  function isActive(href: string): boolean {
    if (href === '/admin') return pathname === '/admin';
    return pathname?.startsWith(href) ?? false;
  }

  return (
    <div data-admin-root className="min-h-screen bg-cream-50 dark:bg-ink flex transition-colors">
      {/* ═══════════ Sidebar · Desktop (lg+) + Drawer للموبايل ═══════════ */}
      <aside
        className={`
          fixed lg:static inset-y-0 right-0 z-50
          w-72 lg:w-64
          bg-gradient-to-b from-gold-deep to-ink dark:from-ink dark:to-black
          text-cream-50
          flex flex-col
          transition-transform duration-300 ease-out
          ${drawerOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          shadow-2xl lg:shadow-none
        `}
      >
        {/* الهيدر داخل الـsidebar */}
        <div className="p-5 lg:p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="font-en-display italic text-2xl">Be First Lady</div>
            <div className="font-en-label text-[9px] tracking-[0.3em] text-gold-light mt-1">ADMIN PANEL</div>
          </div>
          {/* زر إغلاق · للموبايل فقط */}
          <button
            onClick={() => setDrawerOpen(false)}
            className="lg:hidden p-2 -mr-2 text-cream-100 hover:bg-white/10 rounded-lg"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* البحث الشامل */}
        <div className="p-4 border-b border-white/10">
          <GlobalSearch />
        </div>

        {/* القائمة */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {visibleItems.map((item) => {
            const Icon = ICON_MAP[item.iconKey];
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
                  transition-colors
                  ${active
                    ? 'bg-cream-50/15 text-white'
                    : 'text-cream-100/90 hover:bg-white/10'}
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.label}</span>
                {active && <ChevronLeft className="w-4 h-4 mr-auto text-gold-light" />}
              </Link>
            );
          })}
        </nav>

        {/* الأسفل · حضور + الاسم + خروج */}
        <div className="p-4 border-t border-white/10 space-y-2 shrink-0">
          <Link
            href="/account/attendance"
            className="flex items-center gap-2 px-3 py-2.5 text-sm text-cream-100 bg-success/20 hover:bg-success/30 rounded-lg transition-colors border border-success/40"
          >
            <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0" />
            <span>تسجيل حضور/انصراف</span>
          </Link>

          <div className="px-3 py-2 text-sm">
            <div className="font-bold flex items-center gap-1 truncate">
              <span className="truncate">{fullName}</span>
              <span className="shrink-0">{roleEmoji}</span>
            </div>
            <div className="text-xs text-gold-light">{roleLabel}</div>
          </div>

          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-cream-100 hover:bg-white/10 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل خروج</span>
            </button>
          </form>
        </div>
      </aside>

      {/* الـoverlay على الموبايل */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm lg:hidden"
          aria-hidden
        />
      )}

      {/* ═══════════ Content ═══════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* شريط علوي */}
        <header className="sticky top-0 z-30 bg-white dark:bg-ink/90 border-b border-cream-200 dark:border-white/10 backdrop-blur-md">
          <div className="px-4 md:px-6 py-2.5 flex items-center justify-between gap-2">
            {/* يسار · همبرغر (موبايل فقط) + العنوان */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden p-2 -ml-2 text-gold-deep dark:text-cream-100 hover:bg-cream-100 dark:hover:bg-white/10 rounded-lg"
                aria-label="فتح القائمة"
              >
                <Menu className="w-6 h-6" />
              </button>
              {/* شعار مُصغّر · موبايل فقط */}
              <div className="lg:hidden font-en-display italic text-lg text-gold-deep dark:text-cream-100 truncate">
                Be First Lady
              </div>
            </div>

            {/* يمين · أيقونات */}
            <div className="flex items-center gap-1.5">
              <div className="bg-gold-deep rounded-lg flex items-center">
                <NotificationBell />
              </div>
            </div>
          </div>
        </header>

        {/* المحتوى · padding سفلي على الموبايل عشان الـbottom nav */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* ═══════════ Bottom Nav · موبايل فقط ═══════════ */}
      {mobileNavItems.length > 0 && (
        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-ink/95 border-t border-cream-200 dark:border-white/10 backdrop-blur-md"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="flex items-stretch justify-around px-2 pt-1.5 pb-1">
            {mobileNavItems.map((item) => {
              const Icon = ICON_MAP[item.iconKey];
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex-1 flex flex-col items-center justify-center py-1.5 min-w-0 relative"
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      active ? 'text-gold-deep dark:text-gold-light' : 'text-ink-soft dark:text-cream-100/60'
                    }`}
                  />
                  <span
                    className={`text-[10px] mt-0.5 truncate font-semibold ${
                      active ? 'text-gold-deep dark:text-gold-light' : 'text-ink-soft dark:text-cream-100/60'
                    }`}
                  >
                    {item.label}
                  </span>
                  {active && (
                    <span className="absolute top-0 inset-x-6 h-0.5 bg-gold-deep dark:bg-gold-light rounded-b" />
                  )}
                </Link>
              );
            })}
            {/* زر "المزيد" يفتح الـdrawer */}
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex-1 flex flex-col items-center justify-center py-1.5 min-w-0 text-ink-soft dark:text-cream-100/60"
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 font-semibold">المزيد</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
