/**
 * DeleteAccountSection · حذف الحساب (PDPL Article 17)
 * ═══════════════════════════════════════════════════════════
 * - شاشة تحذير · يجب كتابة "احذفي حسابي"
 * - يستدعي /api/account/delete-account
 */
'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function DeleteAccountSection() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      const res = await fetch('/api/account/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation, reason }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(data.message);
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        toast.error(data.error || 'تعثّر الحذف');
        setBusy(false);
      }
    } catch {
      toast.error('تعثّر الاتّصال');
      setBusy(false);
    }
  }

  return (
    <div className="bg-white p-6 border border-rose-200" style={{ borderRadius: '20px' }}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-11 h-11 bg-rose-50 flex items-center justify-center shrink-0" style={{ borderRadius: '2px' }}>
          <Trash2 className="w-5 h-5 text-rose-600" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h3 className="font-ar-display text-lg font-bold text-ink">حذف الحساب</h3>
          <p className="text-xs text-ink-soft mt-1 leading-relaxed">
            حقّكِ بموجب نظام حماية البيانات الشخصيّة · PDPL المادة 17 · يحذف بياناتكِ نهائياً
          </p>
        </div>
      </div>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full border border-rose-500 text-rose-600 hover:bg-rose-500 hover:text-white font-bold text-[13px] uppercase py-3 transition-colors"
          style={{ borderRadius: '2px', letterSpacing: '0.1em' }}
        >
          طلب حذف حسابي
        </button>
      ) : (
        <div className="space-y-4 border-t border-cream-200 pt-4">

          {/* تحذير */}
          <div className="bg-rose-50 border border-rose-200 p-3 flex items-start gap-2" style={{ borderRadius: '2px' }}>
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="text-xs text-rose-900 leading-relaxed">
              <strong>تنبيه:</strong> سيتم حذف:
              <ul className="list-disc pr-5 mt-1 space-y-0.5">
                <li>بياناتكِ الشخصيّة · الاسم · الجوّال · البريد</li>
                <li>قائمة انتظاركِ · مفضّلاتكِ · تحدّياتكِ</li>
                <li>رصيد محفظتكِ · أجهزة Face ID</li>
                <li>الصور (قبل/بعد) · الملف الجمالي</li>
              </ul>
              <div className="mt-2 text-[10px]">
                <strong>سيبقى:</strong> سجلّ الحجوزات (مُجهّل) · سجلّ الفواتير (مطلب ZATCA)
              </div>
            </div>
          </div>

          {/* سبب (اختياري) */}
          <div>
            <label className="block text-xs font-bold text-ink-soft mb-1.5">
              السبب (اختياري · يساعدنا نتحسّن)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="inp"
              placeholder="مثلاً: انتقلت لمدينة أخرى..."
            />
          </div>

          {/* التأكيد النصّي */}
          <div>
            <label className="block text-xs font-bold text-ink-soft mb-1.5">
              للتأكيد · اكتبي "احذفي حسابي"
            </label>
            <input
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className="inp"
              placeholder="احذفي حسابي"
              autoComplete="off"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setOpen(false); setConfirmation(''); setReason(''); }}
              className="flex-1 bg-cream-100 hover:bg-cream-200 text-ink py-3 font-bold text-[12px] uppercase"
              style={{ borderRadius: '2px', letterSpacing: '0.1em' }}
            >
              تراجع
            </button>
            <button
              onClick={confirm}
              disabled={busy || confirmation !== 'احذفي حسابي'}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-3 font-bold text-[12px] uppercase disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ borderRadius: '2px', letterSpacing: '0.1em' }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              احذفي نهائياً
            </button>
          </div>

          <p className="text-[10px] text-ink-soft text-center">
            سيتمّ حذف حسابكِ فوراً · لا يمكن التراجع
          </p>
        </div>
      )}
    </div>
  );
}
