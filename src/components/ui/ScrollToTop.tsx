/**
 * ScrollToTop — يرجّع الـscroll للأعلى عند كل تغيير مسار
 * ═══════════════════════════════════════════════════════════
 * مهم للـPWA/mobile · Next.js ما يسوّيها دائماً مع App Router
 *
 * نستخدم 3 تقنيات معاً لنضمن الوصول:
 *   • window.scrollTo
 *   • document.documentElement.scrollTop
 *   • document.body.scrollTop
 *
 * ونفعّلها في useLayoutEffect قبل الطلاء + مرّتين بـrAF
 * لنضمن تجاوز أي restore تلقائي من المتصفّح أو Next.js
 */
'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function scrollTop() {
  if (typeof window === 'undefined') return;
  try {
    // الطريقة الحديثة
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  } catch {
    window.scrollTo(0, 0);
  }
  // Fallback لمتصفّحات قديمة أو حالات حافّة
  if (document.documentElement) document.documentElement.scrollTop = 0;
  if (document.body) document.body.scrollTop = 0;
}

export default function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const first = useRef(true);

  // عطّلي restore المتصفّح · لنستلم التحكّم كلّه
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      try { window.history.scrollRestoration = 'manual'; } catch { /* noop */ }
    }
  }, []);

  useLayoutEffect(() => {
    // ما نسوّي scroll في التحميل الأوّل (للحفاظ على سلوك الـanchor لو فيه #hash)
    if (first.current) {
      first.current = false;
      return;
    }

    // لو فيه hash (#section) · ما نسوّي scroll للأعلى · نترك المتصفّح يذهب للعنصر
    if (typeof window !== 'undefined' && window.location.hash) {
      return;
    }

    // Scroll فوري
    scrollTop();

    // مرّة ثانية بعد الـpaint · لتجاوز أي restore من Next
    requestAnimationFrame(() => {
      scrollTop();
      requestAnimationFrame(scrollTop);
    });
  }, [pathname, searchParams]);

  return null;
}
