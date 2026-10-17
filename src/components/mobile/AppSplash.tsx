/**
 * AppSplash — شاشة ترحيب فاخرة تظهر عند فتح التطبيق (PWA)
 * ═══════════════════════════════════════════════════════════
 * - تظهر فقط عند فتح الموقع كتطبيق (standalone mode)
 * - أو عند أول تحميل في الجلسة
 * - تختفي بعد 1.2 ثانية مع fade
 */
'use client';

import { useEffect, useState } from 'react';

const SPLASH_SHOWN_KEY = 'bfl_splash_shown';

export default function AppSplash() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // تحقّقي إذا كان الـPWA مثبّت
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone;

    const alreadyShown = sessionStorage.getItem(SPLASH_SHOWN_KEY);

    // اظهر الـsplash في: PWA standalone مرة أول · أو ابتداءً مرة لكل جلسة
    if (!alreadyShown && isStandalone) {
      setVisible(true);
      sessionStorage.setItem(SPLASH_SHOWN_KEY, '1');
      const fadeTimer = setTimeout(() => setFading(true), 1000);
      const hideTimer = setTimeout(() => setVisible(false), 1400);
      return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center
        bg-gradient-to-br from-gold-deep via-gold-deep to-ink
        transition-opacity duration-400 ease-out
        ${fading ? 'opacity-0' : 'opacity-100'}
      `}
    >
      {/* زخرفة الخلفية */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 right-20 w-48 h-48 rounded-full bg-gold-light blur-3xl" />
        <div className="absolute bottom-20 left-20 w-64 h-64 rounded-full bg-cream-50 blur-3xl" />
      </div>

      {/* الشعار */}
      <div className="relative z-10 text-center animate-in zoom-in duration-700">
        <div className="font-en-display italic text-5xl text-cream-50 mb-2">
          Be First Lady
        </div>
        <div className="font-en-label text-[11px] tracking-[0.4em] text-gold-light">
          SPA & SALON · MADINAH
        </div>
        <div className="w-16 h-px bg-gold-light mx-auto my-4 opacity-50" />
        <div className="font-ar-display text-sm text-cream-50/80">
          نعتني بكِ لتُزهري
        </div>

        {/* loader صغير */}
        <div className="mt-8 flex justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-gold-light animate-pulse" />
          <span className="w-1.5 h-1.5 rounded-full bg-gold-light animate-pulse [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-gold-light animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}
