/**
 * GiftCardField — استخدام بطاقة هدية في الحجز
 */
'use client';

import { useState } from 'react';
import { Gift, Check, X, Loader2 } from 'lucide-react';

interface Props {
  subtotal: number;
  value: string;
  onApplied: (code: string, amount: number) => void;
  onCleared: () => void;
}

export default function GiftCardField({ subtotal, value, onApplied, onCleared }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<{ amount: number; balance: number } | null>(
    value ? { amount: 0, balance: 0 } : null
  );
  const [error, setError] = useState('');

  async function validate() {
    if (!input.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`/api/gift-cards?code=${encodeURIComponent(input.trim())}`);
      const data = await res.json();
      if (!data.valid) {
        setError(data.error || data.expired ? 'منتهية' : 'غير صالحة');
        return;
      }
      const applyAmount = Math.min(Number(data.balance), subtotal);
      setApplied({ amount: applyAmount, balance: Number(data.balance) });
      onApplied(data.code, applyAmount);
    } catch { setError('خطأ في التحقق'); }
    finally { setLoading(false); }
  }

  function clear() {
    setApplied(null); setInput(''); setError('');
    onCleared();
  }

  if (applied) {
    return (
      <div className="bg-gold-light/15 border border-gold-light rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gift className="w-4 h-4 text-gold-deep" />
          <div>
            <div className="text-sm font-bold text-gold-deep">
              بطاقة هدية مُطبّقة · {applied.amount.toFixed(0)} ر.س
            </div>
            <div className="text-xs text-ink-soft">
              الرصيد: {applied.balance.toFixed(0)} ر.س
            </div>
          </div>
        </div>
        <button onClick={clear} className="text-ink-soft hover:text-danger">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Gift className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && validate()}
            placeholder="بطاقة هدية (GC-XXXXXXXX)"
            className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm font-en-display uppercase"
          />
        </div>
        <button
          onClick={validate}
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 rounded-xl bg-gold-deep text-cream-50 text-sm font-bold hover:bg-ink disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تطبيق'}
        </button>
      </div>
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}
