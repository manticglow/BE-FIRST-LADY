/**
 * LoaderScreen — شاشة انتقال ناعمة بين الصفحات
 * ═══════════════════════════════════════════════════════════
 * • تحميل الصفحات بالتطبيق (ليس التحميل الأوّل)
 * • اللوقو مع هالة ذهبيّة · اسم البراند · 3 نقاط تحميل
 * • 500ms · ناعمة وسريعة
 */
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function LoaderScreen() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);

  // انتظري 3 ثواني بعد mount حتى تختفي FirstLoadSplash أولاً
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // عند تغيير المسار · أظهري loader قصير
  useEffect(() => {
    if (!ready) return;
    setShow(true);
    const timer = setTimeout(() => setShow(false), 500);
    return () => clearTimeout(timer);
  }, [pathname, ready]);

  // اعترضي ضغطات الروابط لإظهار الـloader فوراً
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
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center animate-fade-in"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(201,169,110,0.18), transparent 60%), rgba(251, 247, 239, 0.98)',
        backdropFilter: 'blur(12px)',
      }}
      aria-hidden="true"
    >
      {/* اللوقو مع هالة متوهّجة */}
      <div className="relative mb-6">
        <div className="absolute inset-0 -m-6 rounded-full bg-gradient-to-br from-gold-light/40 via-gold/20 to-transparent blur-2xl animate-halo-pulse" />
        <div className="relative animate-lotus-breathe">
          <Image
            src="/images/logo.svg"
            alt=""
            width={80}
            height={80}
            priority
            className="drop-shadow-lg"
          />
        </div>
      </div>

      {/* اسم البراند */}
      <div className="font-en-display italic text-2xl text-ink mb-1 tracking-tight">
        Be First Lady
      </div>
      <div className="font-en-label text-[9px] tracking-[0.4em] text-gold font-medium mb-8">
        SALON · MADINAH
      </div>

      {/* 3 نقاط تحميل */}
      <div className="flex gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-gold animate-load-dot" />
        <span className="w-1.5 h-1.5 rounded-full bg-gold-light animate-load-dot [animation-delay:150ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-gold animate-load-dot [animation-delay:300ms]" />
      </div>

      <style jsx>{`
        @keyframes halo-pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes lotus-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes load-dot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        .animate-halo-pulse { animation: halo-pulse 2.5s ease-in-out infinite; }
        .animate-lotus-breathe { animation: lotus-breathe 2.5s ease-in-out infinite; }
        .animate-load-dot { animation: load-dot 1.4s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
