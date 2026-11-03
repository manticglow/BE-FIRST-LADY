/**
 * StaffScheduleTab — جدول العمل الأسبوعي للموظّفة
 * ═══════════════════════════════════════════════════════════
 * - 7 أيّام قادمة
 * - ساعات العمل · عدد الحجوزات · حالة الإجازة لكل يوم
 */
'use client';

import { useEffect, useState } from 'react';
import { Loader2, Calendar, Clock, Users, Umbrella } from 'lucide-react';
import { toast } from 'sonner';

interface Day {
  date: string;
  day_name: string;
  day_of_week: number;
  is_off: boolean;
  start_time: string | null;
  end_time: string | null;
  bookings_count: number;
  leave_status: string | null;
}

interface LeaveItem {
  start_date: string;
  end_date: string;
  leave_type: string;
  status: string;
}

export default function StaffScheduleTab() {
  const [days, setDays] = useState<Day[]>([]);
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [totalBookings, setTotalBookings] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/account/my-schedule')
      .then((r) => r.json())
      .then((d) => {
        setDays(d.days || []);
        setLeaves(d.upcoming_leaves || []);
        setTotalBookings(d.week_bookings_count || 0);
      })
      .catch(() => toast.error('تعذّر تحميل الجدول'))
      .finally(() => setLoading(false));
  }, []);

  const totalHours = days.reduce((s, d) => {
    if (d.is_off || !d.start_time || !d.end_time) return s;
    const start = parseTime(d.start_time);
    const end = parseTime(d.end_time);
    return s + Math.max(0, end - start);
  }, 0);

  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      {/* Header */}
      <div>
        <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mb-1">
          MY SCHEDULE
        </div>
        <h1 className="font-ar-display text-2xl font-bold text-gold-deep">
          جدولي الأسبوعي
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          الأسبوع القادم · من اليوم لمدّة 7 أيّام
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" />
        </div>
      ) : (
        <>
          {/* ملخّص */}
          <div className="grid grid-cols-3 gap-2">
            <SummaryCard icon={Clock}    label="ساعات العمل" value={`${Math.round(totalHours)}س`} />
            <SummaryCard icon={Users}    label="حجوزات متوقّعة" value={`${totalBookings}`} />
            <SummaryCard icon={Umbrella} label="أيّام إجازة"  value={`${leaves.length}`} />
          </div>

          {/* الأيّام */}
          <ul className="space-y-2">
            {days.map((d) => <DayRow key={d.date} day={d} />)}
          </ul>

          {/* الإجازات القادمة */}
          {leaves.length > 0 && (
            <div>
              <h3 className="font-ar-display font-bold text-gold-deep mb-2 mt-4 flex items-center gap-2">
                <Umbrella className="w-4 h-4" />
                الإجازات القادمة
              </h3>
              <ul className="space-y-2">
                {leaves.map((l, i) => (
                  <li key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-amber-800">
                        {l.leave_type === 'annual' ? 'سنوية' :
                         l.leave_type === 'sick' ? 'مرضية' :
                         l.leave_type === 'emergency' ? 'طارئة' : l.leave_type}
                      </div>
                      <div className="text-xs text-amber-700 font-en-display">
                        {l.start_date} ← {l.end_date}
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      l.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}>
                      {l.status === 'approved' ? 'مقبولة ✓' : 'بانتظار'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h + (m || 0) / 60;
}

function SummaryCard({
  icon: Icon, label, value,
}: {
  icon: typeof Clock; label: string; value: string;
}) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-3 text-center">
      <Icon className="w-4 h-4 text-gold-deep mx-auto mb-1" />
      <div className="font-en-display font-bold text-lg text-ink leading-none">{value}</div>
      <div className="text-[10px] text-ink-soft mt-0.5">{label}</div>
    </div>
  );
}

function DayRow({ day: d }: { day: Day }) {
  const today = new Date().toISOString().split('T')[0];
  const isToday = d.date === today;
  const hasLeave = d.leave_status !== null;

  return (
    <li className={`rounded-2xl border p-3.5 flex items-center justify-between gap-3 ${
      isToday ? 'border-gold-deep bg-gradient-to-l from-gold-light/10 to-cream-50 shadow-md'
      : hasLeave ? 'border-amber-200 bg-amber-50/50'
      : d.is_off ? 'border-cream-200 bg-cream-50/50'
      : 'border-cream-200 bg-white'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 ${
          isToday ? 'bg-gold-deep text-cream-50'
          : hasLeave ? 'bg-amber-100 text-amber-700'
          : d.is_off ? 'bg-cream-100 text-ink-soft'
          : 'bg-gold-light/15 text-gold-deep'
        }`}>
          <div className="text-[10px] opacity-80">{d.day_name}</div>
          <div className="font-en-display font-bold text-sm leading-none">
            {d.date.slice(-2)}
          </div>
        </div>
        <div className="min-w-0">
          {hasLeave ? (
            <div>
              <div className="font-bold text-sm text-amber-800">إجازة {d.leave_status === 'approved' ? '✓' : '(بانتظار)'}</div>
              <div className="text-[11px] text-amber-700">لا دوام</div>
            </div>
          ) : d.is_off ? (
            <div>
              <div className="font-bold text-sm text-ink-soft">يوم راحة</div>
              <div className="text-[11px] text-ink-soft">خارج الجدول</div>
            </div>
          ) : d.start_time && d.end_time ? (
            <div>
              <div className="font-bold text-sm text-ink flex items-center gap-1">
                <Clock className="w-3 h-3 text-gold-deep" />
                <span className="font-en-display">{d.start_time.slice(0, 5)}</span>
                <span className="text-ink-soft">—</span>
                <span className="font-en-display">{d.end_time.slice(0, 5)}</span>
              </div>
              <div className="text-[11px] text-ink-soft">دوام عادي</div>
            </div>
          ) : (
            <div>
              <div className="font-bold text-sm text-ink-soft">ما فيه دوام مُحدّد</div>
              <div className="text-[11px] text-ink-soft">راجعي الإدارة</div>
            </div>
          )}
        </div>
      </div>

      {d.bookings_count > 0 && (
        <div className="flex flex-col items-center shrink-0 bg-gold-light/15 text-gold-deep rounded-xl px-2.5 py-1.5">
          <div className="font-en-display font-bold text-lg leading-none">{d.bookings_count}</div>
          <div className="text-[9px]">حجز</div>
        </div>
      )}
    </li>
  );
}
