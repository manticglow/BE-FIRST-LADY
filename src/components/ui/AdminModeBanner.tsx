/**
 * AdminModeBanner — تنبيه للمسؤولات في صفحات العميلات
 * ═══════════════════════════════════════════════════════════
 * • يظهر فقط للـowner/manager/staff
 * • يحوّل للـAdmin dashboard بضغطة واحدة
 * • يختفي في صفحات /admin
 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, ArrowLeft } from 'lucide-react';

interface Props {
  role: 'owner' | 'manager' | 'staff';
  name?: string;
}

const ROLE_LABEL: Record<Props['role'], string> = {
  owner: 'مالكة',
  manager: 'مديرة',
  staff: 'موظّفة',
};

const ROLE_HREF: Record<Props['role'], string> = {
  owner: '/admin',
  manager: '/admin',
  staff: '/staff',
};

export default function AdminModeBanner({ role, name }: Props) {
  const pathname = usePathname();

  // إخفاء في صفحات الإدارة
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/staff')) {
    return null;
  }

  const roleLabel = ROLE_LABEL[role];
  const dashboardHref = ROLE_HREF[role];

  return (
    <div
      className="sticky top-0 z-40 bg-gradient-to-l from-gold-deep via-gold to-gold-deep text-cream-50 shadow-lg"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="w-4 h-4 shrink-0" strokeWidth={2.5} />
          <div className="text-xs font-semibold truncate">
            <span className="hidden sm:inline">أنتِ تتصفّحين كـ</span>
            <span className="text-cream-50">{roleLabel}</span>
            {name && <span className="opacity-80 mr-1">· {name.split(' ')[0]}</span>}
          </div>
        </div>
        <Link
          href={dashboardHref}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap backdrop-blur-sm transition-colors shrink-0"
        >
          <span>لوحة التحكّم</span>
          <ArrowLeft className="w-3 h-3" strokeWidth={2.5} />
        </Link>
      </div>
    </div>
  );
}
