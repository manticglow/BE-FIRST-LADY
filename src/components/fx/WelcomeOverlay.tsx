/**
 * WelcomeOverlay · Overlay احتفالي عند أوّل دخول للحساب
 * ═══════════════════════════════════════════════════════════
 * - يظهر لحظة واحدة (2.5s) ثم يختفي
 * - يستخدم sessionStorage · ما يظهر لكل reload
 */
'use client';

import { useEffect, useState } from 'react';

interface Props {
  firstName?: string | null;
}

export default function WelcomeOverlay({ firstName }: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const seen = sessionStorage.getItem('tfl-welcome-seen');
      if (seen) return;
      sessionStorage.setItem('tfl-welcome-seen', '1');
      setShow(true);
      const t = setTimeout(() => setShow(false), 2600);
      return () => clearTimeout(t);
    } catch {
      // private mode: skip
    }
  }, []);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none"
      style={{ animation: 'welcome-glow-anim 2.5s ease-in-out forwards' }}
    >
      <div className="absolute inset-0 bg-cream-50/90 backdrop-blur-md" />

      <div className="relative text-center px-8">
        {/* شعار صغير */}
        <div className="font-en-display italic text-xs tracking-[0.5em] text-gold-deep uppercase mb-6">
          The First Lady
        </div>

        {/* الـwelcome الكبير */}
        <div className="font-ar-display text-3xl md:text-5xl font-bold text-ink mb-4">
          أهلاً بعودتكِ
          {firstName && <span className="block mt-2 text-gold-deep">{firstName}</span>}
        </div>

        {/* خطّ يد */}
        <div
          className="text-2xl md:text-3xl text-gold-deep italic mt-4"
          style={{ fontFamily: 'var(--font-handwritten, Pinyon Script, cursive)' }}
        >
          we missed you
        </div>

        {/* خط ذهبي */}
        <div className="w-10 h-[1px] bg-gold-deep/60 mx-auto mt-8" />
      </div>
    </div>
  );
}
