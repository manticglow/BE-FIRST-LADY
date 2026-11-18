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
  Clock, Umbrella, Gift, Boxes, Banknote, Bell, BellRing, Inbox,
  MessageSquare, MessageCircle, Cloud, Palette, Activity, Menu, X, ChevronLeft,
  Phone, Megaphone, TrendingUp, FileText,
} from 'lucide-react';
import NotificationBell from '@/components/admin/NotificationBell';
import GlobalSearch from '@/components/admin/GlobalSearch';

type Role = 'owner' | 'manager' | 'staff';

const ICON_MAP = {
  LayoutDashboard, CalendarCheck, Users, Scissors, ImageIcon,
  BarChart3, Settings, Package, UserCircle, Tag, Star, Shield,
  Clock, Umbrella, Gift, Boxes, Banknote, Bell, BellRing, Inbox,
  MessageSquare, MessageCircle, Cloud, Palette, Activity,
  Phone, Megaphone, TrendingUp, FileText,
};

export interface SidebarItem {
  href: string;
  label: string;
  iconKey: keyof typeof ICON_MAP;
  roles: Role[];
  /** يظهر في الـbottom nav على الموبايل · 4 عناصر فقط */
  mobileNav?: boolean;
}

export interface SidebarGroup {
  label: string;      // English (for the eyebrow)
  labelAr: string;    // عربي (tooltip / mobile section header)
  items: SidebarItem[];
}

interface Props {
  groups: SidebarGroup[];
  role: Role;
  fullName: string;
  children: ReactNode;
}

export default function AdminShell({ groups, role, fullName, children }: Props) {
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
    try { localStorage.removeItem('tfl_admin_theme'); } catch {}
  }, []);

  // منع scroll الصفحة لمّا الـdrawer مفتوح
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const roleLabel = role === 'owner' ? 'المالكة' : role === 'manager' ? 'المديرة' : 'موظفة';
  // Filter groups → keep only items the role can see, drop empty groups
  const visibleGroups = groups
    .map((g) => ({ ...g, items: g.items.filter((it) => it.roles.includes(role)) }))
    .filter((g) => g.items.length > 0);
  const allVisibleItems = visibleGroups.flatMap((g) => g.items);
  const mobileNavItems = allVisibleItems.filter((it) => it.mobileNav).slice(0, 4);

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
        {/* الهيدر داخل الـsidebar · boutique */}
        <div className="p-5 lg:p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <div className="font-en-display italic text-2xl tracking-tight">The First Lady</div>
            <div className="w-8 h-[1px] bg-gold-light/60 mt-2 mb-2" />
            <div className="font-en-label text-[9px] tracking-[0.3em] text-gold-light uppercase">
              {role === 'owner' ? 'Owner Panel' : role === 'manager' ? 'Manager Panel' : 'Staff Panel'}
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="lg:hidden p-2 -mr-2 text-cream-100 hover:bg-white/10 transition-colors"
            aria-label="إغلاق القائمة"
            style={{ borderRadius: '2px' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* البحث الشامل */}
        <div className="p-4 border-b border-white/10">
          <GlobalSearch />
        </div>

        {/* القائمة · مجموعات بـeyebrows */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {visibleGroups.map((group, gIdx) => (
            <div key={group.label} className={gIdx > 0 ? 'mt-5' : ''}>
              {/* Group eyebrow */}
              <div className="px-5 mb-2">
                <div className="font-en-label text-[9px] tracking-[0.3em] text-gold-light/70 uppercase font-bold">
                  {group.label}
                </div>
                <div className="font-ar-body text-[9px] text-cream-100/40 mt-0.5">
                  {group.labelAr}
                </div>
              </div>

              {/* Group items */}
              <div className="px-2 space-y-0.5">
                {group.items.map((item) => {
                  const Icon = ICON_MAP[item.iconKey];
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        group relative flex items-center gap-3 px-3 py-2.5 text-sm
                        transition-all duration-200
                        ${active
                          ? 'bg-cream-50/15 text-white font-bold'
                          : 'text-cream-100/85 hover:bg-white/10 hover:text-white font-semibold'}
                      `}
                      style={{ borderRadius: '2px' }}
                    >
                      {/* شريط ذهبي على يمين البند النشط */}
                      {active && (
                        <span
                          className="absolute right-0 top-1/2 -translate-y-1/2 w-[2px] h-5 bg-gold-light"
                          aria-hidden="true"
                        />
                      )}
                      <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${active ? 'text-gold-light' : 'text-cream-100/70 group-hover:text-cream-100'}`} />
                      <span className="flex-1">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* الأسفل · حضور + الاسم + خروج · boutique */}
        <div className="p-4 border-t border-white/10 space-y-2 shrink-0">
          <Link
            href="/account/attendance"
            className="flex items-center gap-2 px-3 py-2.5 text-xs text-cream-100 bg-success/20 hover:bg-success/30 transition-colors border border-success/40"
            style={{ borderRadius: '2px' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shrink-0" />
            <span className="font-bold">تسجيل حضور/انصراف</span>
          </Link>

          {/* الاسم والدور · بدون emoji */}
          <div className="px-3 py-2 text-sm border-r-2 border-gold-light/40">
            <div className="font-bold text-cream-50 truncate">{fullName}</div>
            <div className="font-en-label text-[9px] tracking-[0.25em] text-gold-light/80 uppercase mt-0.5">
              {roleLabel}
            </div>
          </div>

          <form action="/api/auth/logout" method="post">
            <button
              type="submit"
              className="group w-full flex items-center gap-2 px-3 py-2.5 text-xs text-cream-100/80 hover:text-white hover:bg-white/10 transition-all font-bold"
              style={{ borderRadius: '2px' }}
            >
              <LogOut className="w-3.5 h-3.5 group-hover:translate-x-[-2px] transition-transform" />
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
                The First Lady
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
      {/* الموظّفة عندها StaffMobileApp بـbottom nav خاص · نخفي بتاع AdminShell لها على الموبايل */}
      {mobileNavItems.length > 0 && (
        <nav
          className={`${role === 'staff' ? 'hidden' : 'lg:hidden'} fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-ink/95 border-t border-cream-200 dark:border-white/10 backdrop-blur-md`}
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
