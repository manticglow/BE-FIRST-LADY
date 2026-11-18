/**
 * PaymentInterstitial — شاشة انتقاليّة أثناء التحويل لبوّابة الدفع
 * ═══════════════════════════════════════════════════════════
 * - يمنع الشاشة البيضاء المريبة
 * - يطمئن بالأمان (PCI + مدى)
 * - يمنع double-click
 */
'use client';

import { Loader2, Lock, ShieldCheck } from 'lucide-react';

export default function PaymentInterstitial() {
  return (
    <div className="fixed inset-0 bg-cream-50 z-[200] flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        {/* شعار */}
        <div className="font-ar-display text-2xl font-bold text-gold-deep mb-2">
          السيّدة الأولى
        </div>
        <div className="w-10 h-[1px] bg-gold-deep/40 mx-auto mb-10" />

        {/* Spinner */}
        <div className="relative mb-6">
          <Loader2 className="w-10 h-10 text-gold-deep animate-spin mx-auto" />
        </div>

        {/* الرسالة */}
        <h2 className="font-ar-display text-xl font-bold text-ink mb-2">
          نحوّلكِ إلى بوّابة دفع آمنة
        </h2>
        <p className="text-sm text-ink-soft leading-relaxed mb-8">
          لحظات ويظهر لكِ شريط الدفع
          <br />
          لا تُغلقي الصفحة من فضلكِ 🤍
        </p>

        {/* ضمانات الأمان */}
        <div className="inline-flex items-center gap-4 bg-white rounded-full px-5 py-2.5 border border-cream-200">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink-soft">
            <Lock className="w-3 h-3 text-emerald-600" />
            PCI DSS
          </div>
          <div className="w-px h-3 bg-cream-200" />
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink-soft">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            مدى مُعتمدة
          </div>
        </div>
      </div>
    </div>
  );
}
