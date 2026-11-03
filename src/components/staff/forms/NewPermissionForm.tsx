/**
 * NewPermissionForm — نموذج طلب إذن
 */
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const TYPES = [
  { value: 'early_leave', label: 'انصراف مبكّر', needsDuration: false },
  { value: 'late_arrival', label: 'تأخّر في الوصول', needsDuration: false },
  { value: 'short_break', label: 'استراحة قصيرة', needsDuration: true },
];

export default function NewPermissionForm({ onDone }: { onDone: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [request_type, setType] = useState('early_leave');
  const [request_date, setDate] = useState(today);
  const [requested_time, setTime] = useState('12:00');
  const [duration_min, setDuration] = useState(30);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const selectedType = TYPES.find((t) => t.value === request_type)!;

  async function submit() {
    if (reason.trim().length < 3) return toast.error('اكتبي سبباً واضحاً');
    setBusy(true);
    const res = await fetch('/api/account/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        request_type,
        request_date,
        requested_time,
        duration_min: selectedType.needsDuration ? duration_min : null,
        reason,
      }),
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
        <label className="block text-xs font-semibold text-ink-soft mb-1.5">نوع الإذن</label>
        <div className="grid grid-cols-3 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`py-2.5 px-2 rounded-xl text-[11px] font-bold border-2 transition-all ${
                request_type === t.value
                  ? 'bg-gold-deep text-cream-50 border-gold-deep'
                  : 'bg-white border-cream-200 text-ink hover:border-gold-light'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink-soft mb-1.5">التاريخ</label>
        <input
          type="date"
          value={request_date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm font-en-display"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink-soft mb-1.5">الوقت</label>
        <input
          type="time"
          value={requested_time}
          onChange={(e) => setTime(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm font-en-display"
        />
      </div>

      {selectedType.needsDuration && (
        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1.5">
            المدّة (بالدقائق) · {duration_min} دقيقة
          </label>
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={duration_min}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full accent-gold-deep"
          />
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-ink-soft mb-1.5">السبب *</label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          placeholder="مثل: موعد طبّي · ظرف عائلي..."
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
