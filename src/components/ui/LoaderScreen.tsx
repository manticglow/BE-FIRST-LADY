/**
 * LoaderScreen — شاشة انتقال بين الصفحات
 * ═══════════════════════════════════════════════════════════
 * - لا تظهر عند أوّل تحميل للموقع (محذوفة من البداية)
 * - تظهر بين الصفحات عند التنقّل (navigation transition)
 * - سريعة (0.6 ثانية) · ناعمة · فاخرة
 */
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function LoaderScreen() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);

  // ─── انتظري 3 ثواني بعد mount حتى نسمح للـFirstLoadSplash تختفي أولاً ───
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // ─── عند تغيّر الـpathname (بعد ما نكون ready) · نظهر الـloader قصيراً ───
  useEffect(() => {
    if (!ready) return;
    setShow(true);
    const timer = setTimeout(() => setShow(false), 500);
    return () => clearTimeout(timer);
  }, [pathname, ready]);

  // ─── اعترضي ضغطات الروابط لإظهار الـloader فوراً قبل أن يتغيّر الـpathname ───
  useEffect(() => {
    if (!ready) return;

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      if (href === pathname || href === window.location.pathname) return;
      setShow(true);
    }

    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [ready, pathname]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-cream-50/95 backdrop-blur-md flex items-center justify-center animate-fade-in"
      aria-hidden="true"
    >
      {/* زهرة اللوتس تنبض بلطف */}
      <div className="relative">
        {/* هالة ذهبيّة متحرّكة */}
        <div className="absolute inset-0 -m-6 rounded-full bg-gradient-to-br from-gold-light/30 to-amber-200/20 blur-xl animate-pulse" />

        {/* اللوقو · pulse ناعم */}
        <div className="relative animate-pulse-soft">
          <Image
            src="/images/logo.svg"
            alt=""
            width={72}
            height={72}
            priority
            className="drop-shadow-lg"
          />
        </div>

        {/* نقاط loading تحت اللوقو */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-deep animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-gold-deep animate-pulse [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-gold-deep animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
