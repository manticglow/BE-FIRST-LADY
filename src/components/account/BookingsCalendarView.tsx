/**
 * BookingsCalendarView — تقويم مصغّر + قائمة حجوزات اليوم
 * ═══════════════════════════════════════════════════════════
 */
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, Calendar, Clock, User, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

type Booking = {
  id: string;
  booking_number?: string | null;
  booking_date: string;
  booking_time: string;
  status: string;
  total: number;
  payment_status?: string | null;
  items?: Array<{ service_name: string; quantity?: number }>;
  staff_name?: string | null;
};

const DAYS_AR = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function statusInfo(status: string): { label: string; color: string; icon: any } {
  switch (status) {
    case 'confirmed':
    case 'pending':
      return { label: 'مؤكّد', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: CheckCircle2 };
    case 'completed':
      return { label: 'مكتمل', color: 'text-blue-700 bg-blue-50 border-blue-200', icon: CheckCircle2 };
    case 'cancelled':
      return { label: 'ملغي', color: 'text-rose-700 bg-rose-50 border-rose-200', icon: XCircle };
    default:
      return { label: status, color: 'text-ink-soft bg-cream-100 border-cream-200', icon: Clock };
  }
}

export default function BookingsCalendarView({ bookings }: { bookings: Booking[] }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<string>(toDateStr(today));
  const [listView, setListView] = useState(false);

  // تجميع الحجوزات حسب التاريخ
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach((b) => {
      if (!map.has(b.booking_date)) map.set(b.booking_date, []);
      map.get(b.booking_date)!.push(b);
    });
    return map;
  }, [bookings]);

  // توليد أيام الشهر الحالي
  const monthDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startWeekday = firstDay.getDay(); // 0 = الأحد

    const days: Array<{ day: number | null; dateStr?: string; hasBookings?: boolean; isToday?: boolean; isPast?: boolean }> = [];

    // الأيام الفارغة أول الشهر
    for (let i = 0; i < startWeekday; i++) {
      days.push({ day: null });
    }

    // أيام الشهر
    const todayStr = toDateStr(today);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = toDateStr(date);
      days.push({
        day: d,
        dateStr,
        hasBookings: bookingsByDate.has(dateStr),
        isToday: dateStr === todayStr,
        isPast: dateStr < todayStr,
      });
    }
    return days;
  }, [viewDate, bookingsByDate, today]);

  const selectedBookings = (selectedDate ? bookingsByDate.get(selectedDate) : []) || [];
  const sortedSelected = [...selectedBookings].sort((a, b) => a.booking_time.localeCompare(b.booking_time));

  // عد الحجوزات القادمة
  const upcomingCount = bookings.filter(
    (b) => b.booking_date >= toDateStr(today) && b.status !== 'cancelled'
  ).length;

  const changeMonth = (delta: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + delta, 1));
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    const d = new Date(selectedDate);
    return `${DAYS_AR[d.getDay()]} ${d.getDate()} ${MONTHS_AR[d.getMonth()]}`;
  };

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-cream-200">
        <Calendar className="w-12 h-12 text-cream-300 mx-auto mb-4" />
        <div className="text-ink-soft mb-4">ما عندكِ أي حجوزات بعد</div>
        <Link href="/booking" className="btn-primary">احجزي أوّل موعد</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* التبديل بين التقويم والقائمة */}
      <div className="flex items-center justify-between">
        <div className="inline-flex bg-cream-100 rounded-full p-1 text-xs">
          <button
            onClick={() => setListView(false)}
            className={`px-4 py-1.5 rounded-full transition-all font-bold ${
              !listView ? 'bg-white text-gold-deep shadow-sm' : 'text-ink-soft'
            }`}
          >
            التقويم
          </button>
          <button
            onClick={() => setListView(true)}
            className={`px-4 py-1.5 rounded-full transition-all font-bold ${
              listView ? 'bg-white text-gold-deep shadow-sm' : 'text-ink-soft'
            }`}
          >
            الكل · {bookings.length}
          </button>
        </div>
        <div className="text-xs text-ink-soft">
          {upcomingCount} قادم
        </div>
      </div>

      {!listView ? (
        <>
          {/* ═══ Calendar Mini ═══ */}
          <div className="bg-white rounded-2xl p-5 border border-cream-200 shadow-sm">
            {/* عنوان الشهر + التنقّل */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => changeMonth(-1)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-cream-100 transition-colors"
                aria-label="الشهر السابق"
              >
                <ChevronRight className="w-4 h-4 text-gold-deep" />
              </button>
              <div className="text-center">
                <div className="font-ar-display text-lg font-bold text-ink italic">
                  {MONTHS_AR[viewDate.getMonth()]}
                </div>
                <div className="font-en-label text-[9px] tracking-[0.3em] text-gold-light">
                  {viewDate.getFullYear()}
                </div>
              </div>
              <button
                onClick={() => changeMonth(1)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-cream-100 transition-colors"
                aria-label="الشهر التالي"
              >
                <ChevronLeft className="w-4 h-4 text-gold-deep" />
              </button>
            </div>

            {/* أيام الأسبوع */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS_AR.map((d) => (
                <div key={d} className="text-center text-[10px] text-ink-muted font-bold py-1">
                  {d.slice(0, 3)}
                </div>
              ))}
            </div>

            {/* الأيام */}
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((d, i) => {
                if (!d.day) return <div key={`e-${i}`} className="aspect-square" />;

                const isSelected = d.dateStr === selectedDate;
                const base = 'aspect-square flex items-center justify-center text-sm rounded-full transition-all relative';
                let cls = `${base} text-ink-soft`;

                if (isSelected) {
                  cls = `${base} bg-gold-deep text-cream-50 font-bold shadow-md`;
                } else if (d.isToday) {
                  cls = `${base} bg-cream-100 text-gold-deep font-bold ring-2 ring-gold-light`;
                } else if (d.hasBookings) {
                  cls = `${base} bg-cream-100 text-ink font-bold hover:bg-cream-200`;
                } else {
                  cls = `${base} text-ink-muted hover:bg-cream-50`;
                }

                return (
                  <button
                    key={d.dateStr}
                    onClick={() => d.dateStr && setSelectedDate(d.dateStr)}
                    className={cls}
                  >
                    {d.day}
                    {d.hasBookings && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-deep"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ═══ حجوزات اليوم المختار ═══ */}
          <div className="bg-white rounded-2xl p-5 border border-cream-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-cream-200">
              <div>
                <div className="font-en-label text-[9px] tracking-[0.3em] text-gold-light">
                  SELECTED DAY
                </div>
                <div className="font-ar-display text-base font-bold text-ink italic mt-0.5">
                  {formatSelectedDate()}
                </div>
              </div>
              <div className="text-xs text-ink-soft">
                {sortedSelected.length} {sortedSelected.length === 1 ? 'حجز' : 'حجوزات'}
              </div>
            </div>

            {sortedSelected.length === 0 ? (
              <div className="py-6 text-center">
                <div className="text-sm text-ink-muted mb-3">لا حجوزات في هذا اليوم</div>
                <Link
                  href={`/booking?date=${selectedDate}`}
                  className="text-xs text-gold-deep font-bold hover:text-gold inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  احجزي ليومٍ آخر
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedSelected.map((b) => (
                  <BookingRow key={b.id} booking={b} />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        /* ═══ قائمة الكل ═══ */
        <div className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
          {bookings.map((b, i) => (
            <div key={b.id} className={i > 0 ? 'border-t border-cream-100' : ''}>
              <BookingRow booking={b} showDate />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BookingRow({ booking, showDate }: { booking: Booking; showDate?: boolean }) {
  const st = statusInfo(booking.status);
  const StatusIcon = st.icon;
  const serviceName = booking.items?.[0]?.service_name || 'حجز';
  const serviceCount = booking.items?.length || 1;

  return (
    <Link
      href={`/account/bookings/${booking.id}`}
      className="flex items-center gap-3 p-3 hover:bg-cream-50 transition-colors group"
    >
      {/* الوقت أو التاريخ */}
      <div className="w-14 text-center shrink-0 bg-cream-50 rounded-xl py-2 border border-cream-200">
        {showDate ? (
          <>
            <div className="font-ar-display text-sm font-bold text-gold-deep">
              {new Date(booking.booking_date).getDate()}
            </div>
            <div className="text-[9px] text-ink-muted">
              {MONTHS_AR[new Date(booking.booking_date).getMonth()].slice(0, 3)}
            </div>
          </>
        ) : (
          <>
            <div className="font-ar-display text-sm font-bold text-gold-deep">
              {booking.booking_time.slice(0, 5)}
            </div>
            <div className="text-[9px] text-ink-muted">
              {parseInt(booking.booking_time.slice(0, 2)) >= 12 ? 'م' : 'ص'}
            </div>
          </>
        )}
      </div>

      {/* المعلومات */}
      <div className="flex-1 min-w-0">
        <div className="font-ar-display text-sm font-bold text-ink italic truncate">
          {serviceName}
          {serviceCount > 1 && <span className="text-ink-muted text-xs ml-1">+{serviceCount - 1}</span>}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-ink-soft">
          {booking.staff_name && (
            <span className="flex items-center gap-1">
              <User className="w-2.5 h-2.5" />
              {booking.staff_name}
            </span>
          )}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-bold ${st.color}`}>
            <StatusIcon className="w-2.5 h-2.5" />
            {st.label}
          </span>
        </div>
      </div>

      {/* السعر */}
      <div className="text-left shrink-0">
        <div className="font-ar-display text-sm font-bold text-gold-deep">
          {formatPrice(Number(booking.total))}
        </div>
        <div className="text-[9px] text-ink-muted group-hover:text-gold-deep">
          تفاصيل ←
        </div>
      </div>
    </Link>
  );
}
