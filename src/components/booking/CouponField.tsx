/**
 * CouponField — إدخال كوبون + تحقق فوري
 */
'use client';

import { useState } from 'react';
import { Tag, Check, X, Loader2 } from 'lucide-react';

interface Props {
  subtotal: number;
  value: string;
  onApplied: (code: string, discount: number) => void;
  onCleared: () => void;
}

export default function CouponField({ subtotal, value, onApplied, onCleared }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<{ discount: number; description?: string } | null>(
    value ? { discount: 0 } : null
  );
  const [error, setError] = useState('');

  async function validate() {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: input.trim(), subtotal }),
      });
      const data = await res.json();
      if (!data.valid) {
        setError(data.error || 'غير صالح');
        return;
      }
      setApplied({ discount: data.discount, description: data.description });
      onApplied(data.code, data.discount);
    } catch {
      setError('خطأ في التحقق');
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setApplied(null);
    setInput('');
    setError('');
    onCleared();
  }

  if (applied) {
    return (
      <div className="bg-success/10 border border-success/30 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-success" />
          <div>
            <div className="text-sm font-bold text-success">
              كوبون مُطبّق · خصم {applied.discount.toFixed(0)} ر.س
            </div>
            {applied.description && (
              <div className="text-xs text-ink-soft">{applied.description}</div>
            )}
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
          <Tag className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && validate()}
            placeholder="كود الخصم (اختياري)"
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
