/**
 * Admin Layout — لوحة تحكم المالكة
 * ═══════════════════════════════════════════════════════════
 * - Server Component للمصادقة
 * - يسلّم للـAdminShell (Client) اللي يتعامل مع responsive + drawer
 */
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AdminShell, { type SidebarItem } from '@/components/admin/AdminShell';

const SIDEBAR: SidebarItem[] = [
  { href: '/admin',             label: 'الرئيسية',   iconKey: 'LayoutDashboard', roles: ['owner', 'manager', 'staff'], mobileNav: true },
  { href: '/admin/bookings',    label: 'الحجوزات',   iconKey: 'CalendarCheck',   roles: ['owner', 'manager', 'staff'], mobileNav: true },
  { href: '/admin/reminders',   label: 'التذكيرات',  iconKey: 'BellRing',        roles: ['owner', 'manager'],          mobileNav: true },
  { href: '/admin/attendance',  label: 'الحضور',     iconKey: 'Clock',           roles: ['owner', 'manager'] },
  { href: '/admin/leaves',      label: 'الإجازات',   iconKey: 'Umbrella',        roles: ['owner', 'manager'] },
  { href: '/admin/customers',   label: 'العميلات',   iconKey: 'Users',           roles: ['owner', 'manager'] },
  { href: '/admin/staff',       label: 'الموظفات',   iconKey: 'UserCircle',      roles: ['owner', 'manager'] },
  { href: '/admin/services',    label: 'الخدمات',    iconKey: 'Scissors',        roles: ['owner', 'manager'], mobileNav: true },
  { href: '/admin/packages',    label: 'البكجات',    iconKey: 'Package',         roles: ['owner', 'manager'] },
  { href: '/admin/inventory',   label: 'المخزون',    iconKey: 'Boxes',           roles: ['owner', 'manager'] },
  { href: '/admin/coupons',     label: 'الكوبونات',  iconKey: 'Tag',             roles: ['owner', 'manager'] },
  { href: '/admin/gift-cards',  label: 'بطاقات هدية', iconKey: 'Gift',           roles: ['owner', 'manager'] },
  { href: '/admin/reviews',     label: 'التقييمات',  iconKey: 'Star',            roles: ['owner', 'manager'] },
  { href: '/admin/gallery',     label: 'المعرض',     iconKey: 'ImageIcon',       roles: ['owner', 'manager'] },
  { href: '/admin/payroll',     label: 'الرواتب',    iconKey: 'Banknote',        roles: ['owner'] },
  { href: '/admin/push',        label: 'الإشعارات',  iconKey: 'Bell',            roles: ['owner', 'manager'] },
  { href: '/admin/reports',     label: 'التقارير',   iconKey: 'BarChart3',       roles: ['owner'] },
  { href: '/admin/users',       label: 'اليوزرات',   iconKey: 'Shield',          roles: ['owner'] },
  { href: '/admin/settings',    label: 'الإعدادات',  iconKey: 'Settings',        roles: ['owner'] },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['owner', 'manager', 'staff'].includes(profile.role)) {
    redirect('/');
  }

  return (
    <AdminShell
      items={SIDEBAR}
      role={profile.role as 'owner' | 'manager' | 'staff'}
      fullName={profile.full_name || ''}
    >
      {children}
    </AdminShell>
  );
}
