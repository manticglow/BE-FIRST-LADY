/**
 * PWARegister — يسجّل الـ Service Worker + Install Prompt
 */
'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    // 1) سجّل الـ Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {});
    }

    // 2) اعترِض beforeinstallprompt (Android + Desktop)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // ما يظهر لو تم تجاهله خلال 7 أيام
      const dismissed = localStorage.getItem('bfl_install_dismissed');
      if (dismissed) {
        const days = (Date.now() - Number(dismissed)) / 86400000;
        if (days < 7) return;
      }

      // تأخير 10 ثواني — ما يزعج أول دخول
      setTimeout(() => setShowPrompt(true), 10000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // 3) اكتشف iOS (ما يدعم beforeinstallprompt)
    const ua = navigator.userAgent;
    const isIos = /iPhone|iPad|iPod/i.test(ua) && !/CriOS|FxiOS/i.test(ua);
    const isStandalone = (navigator as any).standalone === true
      || window.matchMedia('(display-mode: standalone)').matches;

    if (isIos && !isStandalone) {
      setIsIOS(true);
      const dismissed = localStorage.getItem('bfl_ios_install_dismissed');
      if (!dismissed || (Date.now() - Number(dismissed)) / 86400000 > 7) {
        setTimeout(() => setShowIOSPrompt(true), 15000);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function installApp() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowPrompt(false);
  }

  function dismiss() {
    localStorage.setItem('bfl_install_dismissed', String(Date.now()));
    setShowPrompt(false);
  }

  function dismissIOS() {
    localStorage.setItem('bfl_ios_install_dismissed', String(Date.now()));
    setShowIOSPrompt(false);
  }

  // Prompt عادي (Android/Desktop)
  if (showPrompt && deferredPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96 z-[9999] animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl border border-gold-light/40 p-4 flex items-center gap-3">
          <img src="/icons/icon-192.png" alt="BFL" className="w-12 h-12 rounded-xl" />
          <div className="flex-1 min-w-0">
            <div className="font-ar-display font-bold text-sm text-ink">ثبّتي Be First Lady</div>
            <div className="text-xs text-ink-soft mt-0.5">كتطبيق على جهازكِ ✨</div>
          </div>
          <button onClick={installApp} className="btn-primary !py-2 !px-4 text-xs flex items-center gap-1">
            <Download className="w-3.5 h-3.5" />
            ثبّتي
          </button>
          <button onClick={dismiss} className="p-1 hover:bg-cream-100 rounded-full text-ink-soft">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Prompt iOS (تعليمات يدوية)
  if (showIOSPrompt && isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:w-96 z-[9999] animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl border border-gold-light/40 p-4">
          <div className="flex items-start gap-3">
            <img src="/icons/icon-192.png" alt="BFL" className="w-12 h-12 rounded-xl" />
            <div className="flex-1">
              <div className="font-ar-display font-bold text-sm text-ink">ثبّتي التطبيق على آيفونك</div>
              <ol className="text-xs text-ink-soft mt-2 space-y-1 list-decimal pr-4">
                <li>اضغطي زر المشاركة <span className="inline-block w-5 h-5 border border-ink-soft rounded text-center">⬆︎</span> في Safari</li>
                <li>اختاري <strong>&quot;إضافة إلى الشاشة الرئيسية&quot;</strong></li>
                <li>اضغطي <strong>إضافة</strong> ✨</li>
              </ol>
            </div>
            <button onClick={dismissIOS} className="p-1 hover:bg-cream-100 rounded-full text-ink-soft">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
