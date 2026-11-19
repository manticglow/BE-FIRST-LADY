/**
 * LogoutButton — زر خروج مع نافذة تأكيد فاخرة
 * ═══════════════════════════════════════════════════════════
 * - مودال تأكيد قبل الخروج (منع الخروج بالخطأ)
 * - توست وداعي بعد الخروج
 * - عودة ناعمة للصفحة الرئيسيّة
 */
'use client';

import { useState } from 'react';
import { LogOut, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AUTH } from '@/lib/brand-voice';

interface Props {
  className?: string;
  label?: string;
}

export default function LogoutButton({ className, label = 'تسجيل الخروج' }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
      });
      const data = await res.json();
      toast.success(data.message || AUTH.LOGOUT_SUCCESS);
      // تأخير بسيط عشان العميلة تشوف التوست
      setTimeout(() => {
        window.location.href = '/';
      }, 700);
    } catch {
      toast.error('تعثّر الخروج · حاولي مرّة ثانية 🤍');
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className || 'inline-flex items-center gap-2 text-ink-soft hover:text-ink text-sm'}
        style={{ minHeight: '44px', minWidth: '44px' }}
      >
        <LogOut className="w-4 h-4" />
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-full bg-cream-100 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-gold-deep" />
              </div>
              <button onClick={() => setOpen(false)} className="text-ink-soft hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="font-ar-display text-xl font-bold text-ink mb-1">
              الخروج من حسابكِ
            </h2>
            <p className="text-sm text-ink-soft mb-5 leading-relaxed">
              {AUTH.LOGOUT_CONFIRM}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={busy}
                className="flex-1 bg-cream-100 hover:bg-cream-200 text-ink py-3 rounded-xl font-bold text-sm disabled:opacity-50"
                style={{ minHeight: '44px' }}
              >
                البقاء هنا
              </button>
              <button
                onClick={confirm}
                disabled={busy}
                className="flex-1 bg-ink hover:bg-ink/90 text-cream-50 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ minHeight: '44px' }}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                نعم · خروج
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
