/**
 * TimeSlotPicker — عارض مواعيد ذكي
 * ═══════════════════════════════════════════════════════════
 * يجلب التوفّر من /api/availability بناءً على التاريخ والمدة
 */
'use client';

import { useState, useEffect } from 'react';
import { Loader2, Clock, AlertCircle } from 'lucide-react';

interface Props {
  date: string;
  duration: number;
  staffId?: string | null;
  value: string;
  onChange: (time: string) => void;
}

interface Slot {
  time: string;
  available: boolean;
  slotsLeft: number;
}

export default function TimeSlotPicker({ date, duration, staffId, value, onChange }: Props) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [closed, setClosed] = useState(false);
  const [closedReason, setClosedReason] = useState('');

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    const params = new URLSearchParams({ date, duration: String(duration) });
    if (staffId) params.set('staff_id', staffId);
    fetch(`/api/availability?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots || []);
        setClosed(data.closed || false);
        setClosedReason(data.reason || '');
      })
      .finally(() => setLoading(false));
  }, [date, duration, staffId]);

  if (!date) {
    return (
      <div className="text-xs text-ink-soft text-center py-6">
        اختاري التاريخ أولاً
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-ink-soft">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        جاري البحث عن مواعيد متاحة...
      </div>
    );
  }

  if (closed) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="w-8 h-8 text-warning mx-auto mb-2" />
        <div className="text-sm font-bold text-ink">الصالون مغلق في هذا اليوم</div>
        {closedReason && <div className="text-xs text-ink-soft mt-1">{closedReason}</div>}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="w-8 h-8 text-warning mx-auto mb-2" />
        <div className="text-sm text-ink-soft">لا توجد مواعيد متاحة لهذا اليوم</div>
        <div className="text-xs text-ink-soft mt-1">جرّبي يوماً آخر 💛</div>
      </div>
    );
  }

  // جمّع حسب الفترة (صباح، ظهر، مساء، ليلة)
  const periods: { [k: string]: Slot[] } = {
    '🌅 صباحاً': slots.filter((s) => parseInt(s.time) < 12),
    '☀️ ظهراً': slots.filter((s) => parseInt(s.time) >= 12 && parseInt(s.time) < 17),
    '🌙 مساءً': slots.filter((s) => parseInt(s.time) >= 17 && parseInt(s.time) < 21),
    '✨ ليلاً': slots.filter((s) => parseInt(s.time) >= 21),
  };

  return (
    <div className="space-y-4">
      {Object.entries(periods).map(([label, periodSlots]) => {
        if (periodSlots.length === 0) return null;
        return (
          <div key={label}>
            <div className="text-xs font-bold text-ink-soft mb-2">{label}</div>
            <div className="grid grid-cols-4 gap-2">
              {periodSlots.map((s) => {
                const sel = value === s.time;
                const almostFull = s.available && s.slotsLeft === 1;
                return (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    onClick={() => onChange(s.time)}
                    className={`relative py-2 rounded-lg text-xs font-en-display font-bold transition-all ${
                      sel
                        ? 'bg-gold-deep text-cream-50 shadow-md'
                        : s.available
                          ? 'bg-cream-50 text-ink border border-cream-200 hover:border-gold-light'
                          : 'bg-cream-100 text-ink-soft/40 cursor-not-allowed line-through'
                    }`}
                  >
                    {s.time}
                    {almostFull && !sel && (
                      <span className="absolute -top-1 -right-1 bg-warning text-cream-50 text-[8px] px-1 rounded-full font-bold">
                        آخر
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
