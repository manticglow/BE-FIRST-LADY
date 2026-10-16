/**
 * StaffPicker — اختيار الاختصاصية (أو "أي متاحة")
 */
'use client';

import { useState, useEffect } from 'react';
import { Loader2, Users, Check, Clock, AlertCircle } from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  job_title: string;
  avatar_url: string | null;
  specialties: string[];
  providesAll: boolean;
  workingToday: boolean;
  notBlocked: boolean;
  schedule: { start_time: string; end_time: string } | null;
  available: boolean;
}

interface Props {
  date: string;
  serviceIds: string[];
  value: string | null;
  onChange: (staffId: string | null) => void;
}

export default function StaffPicker({ date, serviceIds, value, onChange }: Props) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    const q = new URLSearchParams({ date, service_ids: serviceIds.join(',') });
    fetch(`/api/staff-available?${q}`)
      .then((r) => r.json())
      .then((d) => setStaff(d.staff || []))
      .finally(() => setLoading(false));
  }, [date, serviceIds.join(',')]);

  if (!date) {
    return <div className="text-xs text-ink-soft text-center py-4">اختاري التاريخ أولاً</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6 text-ink-soft text-sm">
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
        جاري البحث عن الاختصاصيات...
      </div>
    );
  }

  const available = staff.filter((s) => s.available);
  const unavailable = staff.filter((s) => !s.available);

  if (staff.length === 0) {
    return (
      <div className="text-center py-6">
        <Users className="w-8 h-8 text-ink-soft/50 mx-auto mb-2" />
        <div className="text-sm text-ink-soft">
          لا توجد موظفات مسجلات
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* "أي متاحة" */}
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`w-full text-right p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
          value === null
            ? 'border-gold-deep bg-gold-light/10'
            : 'border-cream-200 bg-cream-50 hover:border-gold-light'
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-gold-deep text-cream-50 flex items-center justify-center">
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="font-ar-display font-bold text-ink">أيّ اختصاصية متاحة</div>
          <div className="text-xs text-ink-soft">نختار المناسبة لكِ تلقائياً</div>
        </div>
        {value === null && <Check className="w-5 h-5 text-gold-deep" />}
      </button>

      {/* المتاحات */}
      {available.length > 0 && (
        <div>
          <div className="text-xs font-bold text-success mb-2 flex items-center gap-1">
            <Check className="w-3 h-3" />
            المتاحات هذا اليوم ({available.length})
          </div>
          <div className="space-y-2">
            {available.map((s) => {
              const sel = value === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onChange(s.id)}
                  className={`w-full text-right p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    sel ? 'border-gold-deep bg-gold-light/10' : 'border-cream-200 bg-white hover:border-gold-light'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-light to-gold-deep text-cream-50 flex items-center justify-center font-bold shrink-0">
                    {s.avatar_url ? (
                      <img src={s.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      s.name.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-ink">{s.name}</div>
                    <div className="text-xs text-gold-deep">{s.job_title}</div>
                    {s.schedule && (
                      <div className="flex items-center gap-1 text-[10px] text-ink-soft mt-1">
                        <Clock className="w-2.5 h-2.5" />
                        <span className="font-en-display">{s.schedule.start_time?.slice(0, 5)} - {s.schedule.end_time?.slice(0, 5)}</span>
                      </div>
                    )}
                  </div>
                  {sel && <Check className="w-5 h-5 text-gold-deep shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* غير المتاحات */}
      {unavailable.length > 0 && (
        <div>
          <div className="text-xs font-bold text-ink-soft mb-2 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            غير متاحات ({unavailable.length})
          </div>
          <div className="space-y-2">
            {unavailable.map((s) => {
              let reason = '';
              if (!s.providesAll) reason = 'لا تقدم بعض الخدمات المختارة';
              else if (!s.workingToday) reason = 'إجازة في هذا اليوم';
              else if (!s.notBlocked) reason = 'في إجازة خاصة';

              return (
                <div
                  key={s.id}
                  className="w-full text-right p-3 rounded-xl border border-cream-200 bg-cream-50/60 flex items-center gap-3 opacity-60"
                >
                  <div className="w-10 h-10 rounded-full bg-cream-200 text-ink-soft flex items-center justify-center font-bold shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-ink">{s.name}</div>
                    <div className="text-xs text-ink-soft">{s.job_title}</div>
                    <div className="text-[10px] text-danger mt-1">⚠ {reason}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
