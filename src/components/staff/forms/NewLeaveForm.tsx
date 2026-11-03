/**
 * NewLeaveForm — نموذج طلب إجازة
 */
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const TYPES = [
  { value: 'annual', label: 'سنوية' },
  { value: 'sick', label: 'مرضية' },
  { value: 'emergency', label: 'طارئة' },
  { value: 'unpaid', label: 'بدون راتب' },
  { value: 'other', label: 'أخرى' },
];

export default function NewLeaveForm({ onDone }: { onDone: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [leave_type, setType] = useState('annual');
  const [start_date, setStart] = useState(today);
  const [end_date, setEnd] = useState(today);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!start_date || !end_date) return toast.error('حدّدي التواريخ');
    if (new Date(end_date) < new Date(start_date)) return toast.error('تاريخ النهاية قبل البداية');

    setBusy(true);
    const res = await fetch('/api/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leave_type, start_date, end_date, reason: reason || null }),
    });
    setBusy(false);
    const d = await res.json();
    if (!res.ok) return toast.error(d.error || 'فشل');
    toast.success('تم إرسال الطلب 🌸');
    onDone();
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-ink-soft mb-1.5">نوع الإجازة</label>
        <select
          value={leave_type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm"
        >
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1.5">من</label>
          <input
            type="date"
            value={start_date}
            min={today}
            onChange={(e) => setStart(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm font-en-display"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1.5">إلى</label>
          <input
            type="date"
            value={end_date}
            min={start_date}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm font-en-display"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink-soft mb-1.5">السبب (اختياري)</label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          placeholder="سبب الإجازة..."
          className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm resize-none"
        />
      </div>

      <button
        onClick={submit}
        disabled={busy}
        className="w-full py-3 rounded-xl bg-gold-deep text-cream-50 font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        إرسال الطلب
      </button>
    </div>
  );
}
