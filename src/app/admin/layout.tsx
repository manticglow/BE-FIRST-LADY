/**
 * Admin Layout — لوحة تحكم المالكة
 * ═══════════════════════════════════════════════════════════
 * - Sidebar ديناميكي حسب الدور
 * - شريط علوي: بحث + جرس + ثيم
 * - Dark mode (localStorage)
 */
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import {
  LayoutDashboard, CalendarCheck, Users, Scissors, Image as ImageIcon,
  BarChart3, Settings, LogOut, Package, UserCircle, Tag, Star, Shield,
  Clock, Umbrella, Gift, Boxes, Banknote, Bell, BellRing,
} from 'lucide-react';
import NotificationBell from '@/components/admin/NotificationBell';
import GlobalSearch from '@/components/admin/GlobalSearch';
import ThemeToggle from '@/components/admin/ThemeToggle';

const SIDEBAR = [
  { href: '/admin',             label: 'الرئيسية',   icon: LayoutDashboard, roles: ['owner', 'manager', 'staff'] },
  { href: '/admin/bookings',    label: 'الحجوزات',   icon: CalendarCheck,   roles: ['owner', 'manager', 'staff'] },
  { href: '/admin/reminders',   label: 'التذكيرات',  icon: BellRing,        roles: ['owner', 'manager'] },
  { href: '/admin/attendance',  label: 'الحضور',     icon: Clock,           roles: ['owner', 'manager'] },
  { href: '/admin/leaves',      label: 'الإجازات',   icon: Umbrella,        roles: ['owner', 'manager'] },
  { href: '/admin/customers',   label: 'العميلات',   icon: Users,           roles: ['owner', 'manager'] },
  { href: '/admin/staff',       label: 'الموظفات',   icon: UserCircle,      roles: ['owner', 'manager'] },
  { href: '/admin/services',    label: 'الخدمات',    icon: Scissors,        roles: ['owner', 'manager'] },
  { href: '/admin/packages',    label: 'البكجات',    icon: Package,         roles: ['owner', 'manager'] },
  { href: '/admin/inventory',   label: 'المخزون',    icon: Boxes,           roles: ['owner', 'manager'] },
  { href: '/admin/coupons',     label: 'الكوبونات',  icon: Tag,             roles: ['owner', 'manager'] },
  { href: '/admin/gift-cards',  label: 'بطاقات هدية', icon: Gift,          roles: ['owner', 'manager'] },
  { href: '/admin/reviews',     label: 'التقييمات',  icon: Star,            roles: ['owner', 'manager'] },
  { href: '/admin/gallery',     label: 'المعرض',     icon: ImageIcon,       roles: ['owner', 'manager'] },
  { href: '/admin/payroll',     label: 'الرواتب',    icon: Banknote,        roles: ['owner'] },
  { href: '/admin/push',        label: 'الإشعارات',  icon: Bell,            roles: ['owner', 'manager'] },
  { href: '/admin/reports',     label: 'التقارير',   icon: BarChart3,       roles: ['owner'] },
  { href: '/admin/users',       label: 'اليوزرات',   icon: Shield,          roles: ['owner'] },
  { href: '/admin/settings',    label: 'الإعدادات',  icon: Settings,        roles: ['owner'] },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user!.id)
    .single();

  return (
    <div data-admin-root className="min-h-screen bg-cream-50 dark:bg-ink flex transition-colors">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-gold-deep to-ink dark:from-ink dark:to-black text-cream-50 min-h-screen flex flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="font-en-display italic text-2xl">Be First Lady</div>
          <div className="font-en-label text-[9px] tracking-[0.3em] text-gold-light mt-1">ADMIN PANEL</div>
        </div>

        {/* البحث الشامل */}
        <div className="p-4 border-b border-white/10">
          <GlobalSearch />
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {SIDEBAR.filter((item) => !profile?.role || item.roles.includes(profile.role)).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-cream-100 hover:bg-white/10 transition-colors"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link
            href="/account/attendance"
            className="flex items-center gap-2 px-3 py-2 text-sm text-cream-100 bg-success/20 hover:bg-success/30 rounded-lg transition-colors border border-success/40"
          >
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>تسجيل حضور/انصراف</span>
          </Link>

          <div className="px-3 py-2 text-sm">
            <div className="font-bold flex items-center gap-1">
              {profile?.full_name}
              {profile?.role === 'owner' && <span>👑</span>}
              {profile?.role === 'manager' && <span>🛡</span>}
              {profile?.role === 'staff' && <span>💼</span>}
            </div>
            <div className="text-xs text-gold-light">
              {profile?.role === 'owner' ? 'المالكة'
                : profile?.role === 'manager' ? 'المديرة'
                : profile?.role === 'staff' ? 'موظفة'
                : ''}
            </div>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-cream-100 hover:bg-white/10 rounded-lg">
              <LogOut className="w-4 h-4" />
              <span>تسجيل خروج</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* شريط علوي صغير */}
        <div className="bg-white dark:bg-ink/80 border-b border-cream-200 dark:border-white/10 px-6 py-2 flex items-center justify-end gap-2">
          <div className="bg-gold-deep rounded-lg flex items-center">
            <NotificationBell />
          </div>
          <div className="bg-gold-deep rounded-lg">
            <ThemeToggle />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
