/**
 * NewSwapForm — نموذج طلب تبديل دوام
 */
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, User } from 'lucide-react';

interface Colleague {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export default function NewSwapForm({ onDone }: { onDone: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [recipient_id, setRecipient] = useState('');
  const [requester_date, setMyDate] = useState(today);
  const [recipient_date, setTheirDate] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/account/colleagues')
      .then((r) => r.json())
      .then((d) => setColleagues(d.items || []))
      .catch(() => toast.error('تعذّر تحميل قائمة الزميلات'));
  }, []);

  async function submit() {
    if (!recipient_id) return toast.error('اختاري زميلة');
    if (reason.trim().length < 3) return toast.error('اكتبي سبباً واضحاً');

    setBusy(true);
    const res = await fetch('/api/account/swaps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requester_date,
        recipient_id,
        recipient_date: recipient_date || null,
        reason,
      }),
    });
    setBusy(false);
    const d = await res.json();
    if (!res.ok) return toast.error(d.error || 'فشل');
    toast.success('تم إرسال الطلب · الزميلة بتشوفه 🌸');
    onDone();
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-ink-soft mb-1.5">الزميلة</label>
        {colleagues.length === 0 ? (
          <div className="text-xs text-ink-soft bg-cream-50 border border-cream-200 rounded-xl p-3 text-center">
            لا توجد زميلات مسجّلات
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {colleagues.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setRecipient(c.id)}
                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all text-right ${
                  recipient_id === c.id
                    ? 'bg-gold-deep text-cream-50 border-gold-deep'
                    : 'bg-white border-cream-200 hover:border-gold-light'
                }`}
              >
                {c.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.avatar_url} alt={c.full_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    recipient_id === c.id ? 'bg-white/20' : 'bg-cream-100 text-gold-deep'
                  }`}>
                    {c.full_name.charAt(0)}
                  </div>
                )}
                <div className="text-xs font-bold truncate">{c.full_name}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink-soft mb-1.5">يومي (اللي راح أعطيه للزميلة)</label>
        <input
          type="date"
          value={requester_date}
          min={today}
          onChange={(e) => setMyDate(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm font-en-display"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink-soft mb-1.5">يومها (اختياري · اللي راح آخذه بدل)</label>
        <input
          type="date"
          value={recipient_date}
          min={today}
          onChange={(e) => setTheirDate(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm font-en-display"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink-soft mb-1.5">السبب *</label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          placeholder="مثل: مناسبة عائليّة · ظرف طارئ..."
          className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm resize-none"
        />
      </div>

      <button
        onClick={submit}
        disabled={busy || !recipient_id}
        className="w-full py-3 rounded-xl bg-gold-deep text-cream-50 font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
        إرسال الطلب
      </button>
    </div>
  );
}
