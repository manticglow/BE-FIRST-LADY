/**
 * Global Error Boundary — صفحة الخطأ العامة
 * ═══════════════════════════════════════════════════════════
 * تظهر لمّا يصير خطأ غير متوقّع في أي صفحة
 */
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // سجّلي الخطأ في console (ممكن ترسلينه لـ Sentry لاحقاً)
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-cream-50 to-cream-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gold-light/20">
        <div className="w-20 h-20 rounded-full bg-rose-50 mx-auto flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
        </div>

        <h1 className="font-ar-display text-2xl font-bold text-gold-deep mb-2">
          عذراً · حدث خطأ غير متوقّع
        </h1>
        <p className="text-sm text-ink-soft mb-6 leading-relaxed">
          ما قدرنا نحمّل هالصفحة الآن · حاولي مرة أخرى أو ارجعي للرئيسية
        </p>

        {error.digest && (
          <p className="text-[10px] text-ink-soft/60 mb-6 font-en-display">
            رقم الخطأ: {error.digest}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={reset}
            className="flex-1 bg-gradient-to-br from-gold-deep to-ink text-cream-50 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
          >
            <RefreshCw className="w-4 h-4" />
            حاولي مجدداً
          </button>
          <Link
            href="/"
            className="flex-1 bg-cream-50 text-gold-deep border border-gold-light/40 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gold-light/10 transition-colors"
          >
            <Home className="w-4 h-4" />
            الرئيسية
          </Link>
        </div>
      </div>
    </main>
  );
}
