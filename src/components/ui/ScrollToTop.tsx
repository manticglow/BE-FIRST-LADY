/**
 * ScrollToTop — يرجّع الـscroll للأعلى عند كل تغيير مسار
 * ═══════════════════════════════════════════════════════════
 * مهم للـPWA/mobile · Next.js ما يسوّيها تلقائياً مع App Router
 */
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // اعمل scroll لأعلى الصفحة فوراً (بدون animation عشان يحس بالسرعة)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname, searchParams]);

  return null;
}
