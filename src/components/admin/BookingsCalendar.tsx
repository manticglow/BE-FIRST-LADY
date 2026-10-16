/**
 * BookingsCalendar — عرض تقويمي للحجوزات (شهر/أسبوع/يوم)
 */
'use client';

import { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Calendar as CalIcon, LayoutList } from 'lucide-react';
import type { Booking, BookingItem } from '@/types/database';

type ViewMode = 'month' | 'week' | 'day';

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-warning text-white',
  confirmed:   'bg-success text-white',
  in_progress: 'bg-blue-500 text-white',
  completed:   'bg-cream-300 text-ink',
  cancelled:   'bg-danger/70 text-white',
  no_show:     'bg-danger text-white',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'معلّق',
  confirmed: 'مؤكّد',
  in_progress: 'جاري',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  no_show: 'لم تحضر',
};

export default function BookingsCalendar({
  bookings, onToggleView,
}: {
  bookings: (Booking & { items?: BookingItem[] })[];
  onToggleView?: () => void;
}) {
  const [view, setView] = useState<ViewMode>('month');
  const [cursor, setCursor] = useState(new Date());

  const monthDays = useMemo(() => buildMonth(cursor), [cursor]);
  const weekDays = useMemo(() => buildWeek(cursor), [cursor]);

  // تجميع الحجوزات حسب التاريخ
  const bookingsByDate = useMemo(() => {
    const map: Record<string, typeof bookings> = {};
    bookings.forEach((b) => {
      if (!map[b.booking_date]) map[b.booking_date] = [];
      map[b.booking_date].push(b);
    });
    return map;
  }, [bookings]);

  function navPrev() {
    const d = new Date(cursor);
    if (view === 'month') d.setMonth(d.getMonth() - 1);
    else if (view === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCursor(d);
  }
  function navNext() {
    const d = new Date(cursor);
    if (view === 'month') d.setMonth(d.getMonth() + 1);
    else if (view === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCursor(d);
  }
  function today() { setCursor(new Date()); }

  const title = view === 'month'
    ? new Intl.DateTimeFormat('ar-SA', { month: 'long', year: 'numeric' }).format(cursor)
    : view === 'week'
      ? `أسبوع ${weekDays[0].toLocaleDateString('en-GB')}`
      : new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' }).format(cursor);

  return (
    <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
      {/* شريط التحكّم */}
      <div className="p-4 border-b border-cream-200 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={navPrev} className="p-1.5 hover:bg-cream-100 rounded-md"><ChevronRight className="w-4 h-4" /></button>
          <button onClick={today} className="text-xs font-bold px-3 py-1.5 bg-cream-100 rounded-md hover:bg-cream-200">اليوم</button>
          <button onClick={navNext} className="p-1.5 hover:bg-cream-100 rounded-md"><ChevronLeft className="w-4 h-4" /></button>
          <div className="font-ar-display text-lg font-bold text-gold-deep mr-2">{title}</div>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center bg-cream-100 rounded-lg p-1 text-xs">
            {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md transition-colors ${view === v ? 'bg-gold-deep text-cream-50 font-bold' : 'text-ink-soft'}`}
              >
                {v === 'month' ? 'شهر' : v === 'week' ? 'أسبوع' : 'يوم'}
              </button>
            ))}
          </div>
          {onToggleView && (
            <button onClick={onToggleView} className="p-2 hover:bg-cream-100 rounded-md text-ink-soft" title="عرض كجدول">
              <LayoutList className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* المحتوى */}
      {view === 'month' && (
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-bold text-ink-soft">
            {['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((day, i) => {
              const dateStr = day.date.toISOString().split('T')[0];
              const dayBookings = bookingsByDate[dateStr] || [];
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              const isOtherMonth = !day.isCurrentMonth;
              return (
                <div
                  key={i}
                  className={`min-h-[80px] p-1 rounded-lg border ${
                    isToday ? 'border-gold-deep bg-gold-light/5' : 'border-cream-100'
                  } ${isOtherMonth ? 'opacity-30' : ''} ${dayBookings.length > 0 ? 'bg-cream-50/40' : ''}`}
                >
                  <div className={`text-xs font-bold mb-1 ${isToday ? 'text-gold-deep' : 'text-ink'}`}>
                    {day.date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 3).map((b) => (
                      <div
                        key={b.id}
                        className={`text-[9px] px-1 py-0.5 rounded truncate ${STATUS_COLORS[b.status] || 'bg-cream-200'}`}
                        title={`${b.customer_name} - ${b.booking_time.slice(0, 5)}`}
                      >
                        {b.booking_time.slice(0, 5)} {b.customer_name.split(' ')[0]}
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-[9px] text-gold-deep font-bold">+ {dayBookings.length - 3}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'week' && (
        <div className="p-4 overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[700px]">
            {weekDays.map((day, i) => {
              const dateStr = day.toISOString().split('T')[0];
              const dayBookings = (bookingsByDate[dateStr] || []).sort((a, b) => a.booking_time.localeCompare(b.booking_time));
              const isToday = dateStr === new Date().toISOString().split('T')[0];
              return (
                <div key={i} className={`rounded-xl border p-2 min-h-[300px] ${isToday ? 'border-gold-deep bg-gold-light/5' : 'border-cream-200 bg-cream-50/30'}`}>
                  <div className="text-center mb-2 pb-2 border-b border-cream-200">
                    <div className="text-[10px] text-ink-soft">{['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'][day.getDay()]}</div>
                    <div className={`font-bold ${isToday ? 'text-gold-deep' : 'text-ink'}`}>{day.getDate()}</div>
                  </div>
                  <div className="space-y-1.5">
                    {dayBookings.map((b) => (
                      <div key={b.id} className={`text-[10px] p-1.5 rounded ${STATUS_COLORS[b.status]}`}>
                        <div className="font-bold">{b.booking_time.slice(0, 5)}</div>
                        <div className="truncate opacity-90">{b.customer_name}</div>
                      </div>
                    ))}
                    {dayBookings.length === 0 && (
                      <div className="text-[10px] text-ink-soft/60 text-center py-2">—</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'day' && (
        <div className="p-4">
          {(() => {
            const dateStr = cursor.toISOString().split('T')[0];
            const dayBookings = (bookingsByDate[dateStr] || []).sort((a, b) => a.booking_time.localeCompare(b.booking_time));
            if (dayBookings.length === 0) {
              return <div className="text-center py-12 text-sm text-ink-soft">لا توجد حجوزات في هذا اليوم</div>;
            }
            return (
              <ul className="space-y-2">
                {dayBookings.map((b) => (
                  <li key={b.id} className="flex items-start gap-3 p-3 rounded-xl border border-cream-200 hover:bg-cream-50/50">
                    <div className="text-center w-16 shrink-0">
                      <div className="font-en-display font-bold text-gold-deep text-lg">{b.booking_time.slice(0, 5)}</div>
                      <div className="text-[10px] text-ink-soft">{b.duration_min}د</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-ink">{b.customer_name}</span>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[b.status]}`}>
                          {STATUS_LABEL[b.status]}
                        </span>
                      </div>
                      <div className="text-xs text-ink-soft">
                        {b.items?.map((i) => i.service_name).join('، ') || '—'}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            );
          })()}
        </div>
      )}

      {/* مفتاح الألوان */}
      <div className="p-4 border-t border-cream-200 flex items-center gap-3 flex-wrap text-[10px]">
        {Object.entries(STATUS_LABEL).map(([k, l]) => (
          <div key={k} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded ${STATUS_COLORS[k]}`}></span>
            <span className="text-ink-soft">{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildMonth(cursor: Date): { date: Date; isCurrentMonth: boolean }[] {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());

  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push({ date: d, isCurrentMonth: d.getMonth() === month });
  }
  return days;
}

function buildWeek(cursor: Date): Date[] {
  const start = new Date(cursor);
  start.setDate(cursor.getDate() - cursor.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}
