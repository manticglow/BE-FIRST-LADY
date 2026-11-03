/**
 * StaffBookingsTab — تبويب الحجوزات
 * ═══════════════════════════════════════════════════════════
 * - فلاتر: اليوم · القادمة · المنتهية
 * - بحث بالاسم
 * - بطاقات مفصّلة
 */
'use client';

import { useState, useMemo } from 'react';
import { Search, Phone, Calendar, Timer, Users, MessageCircle } from 'lucide-react';
import type { StaffBooking } from '../types';
import { STATUS_STYLES } from '../types';
import { formatDuration, waLink } from '@/lib/utils';

type Filter = 'today' | 'upcoming' | 'past' | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'today',    label: 'اليوم' },
  { key: 'upcoming', label: 'قادمة' },
  { key: 'past',     label: 'سابقة' },
  { key: 'all',      label: 'الكل' },
];

export default function StaffBookingsTab({ bookings }: { bookings: StaffBooking[] }) {
  const [filter, setFilter] = useState<Filter>('today');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();

    return bookings
      .filter((b) => {
        if (search && !b.customer_name.includes(search) && !b.customer_phone.includes(search)) return false;
        if (filter === 'all') return true;
        if (filter === 'today') return b.booking_date === today;
        const dt = new Date(`${b.booking_date}T${b.booking_time}`);
        if (filter === 'upcoming') return dt > now && !['cancelled', 'no_show'].includes(b.status);
        if (filter === 'past') return dt < now || ['completed', 'cancelled', 'no_show'].includes(b.status);
        return true;
      })
      .sort((a, b) => {
        const dtA = new Date(`${a.booking_date}T${a.booking_time}`).getTime();
        const dtB = new Date(`${b.booking_date}T${b.booking_time}`).getTime();
        return filter === 'past' ? dtB - dtA : dtA - dtB;
      });
  }, [bookings, filter, search]);

  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      {/* Header */}
      <div>
        <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mb-1">
          MY BOOKINGS
        </div>
        <h1 className="font-ar-display text-2xl font-bold text-gold-deep">
          حجوزاتي
        </h1>
      </div>

      {/* البحث */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحثي باسم العميلة أو الجوال"
          className="w-full pr-10 pl-3 py-3 rounded-2xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm"
        />
      </div>

      {/* الفلاتر */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              filter === f.key
                ? 'bg-gold-deep text-cream-50 shadow-md'
                : 'bg-white border border-cream-200 text-ink hover:border-gold-light'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* القائمة */}
      {filtered.length === 0 ? (
        <div className="bg-cream-50 border border-cream-200 rounded-2xl p-8 text-center">
          <Users className="w-10 h-10 text-cream-300 mx-auto mb-2" />
          <div className="text-sm text-ink-soft">
            {search ? 'ما وجدنا نتائج' : 'ما فيه حجوزات في هذا القسم'}
          </div>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((b) => <BookingRow key={b.id} booking={b} />)}
        </ul>
      )}
    </div>
  );
}

function BookingRow({ booking: b }: { booking: StaffBooking }) {
  const style = STATUS_STYLES[b.status] || STATUS_STYLES.pending;
  const dt = new Date(`${b.booking_date}T${b.booking_time}`);
  const dateLabel = new Intl.DateTimeFormat('ar-SA', {
    weekday: 'short', day: 'numeric', month: 'short',
  }).format(dt);

  return (
    <li className="bg-white rounded-2xl border border-cream-200 overflow-hidden hover:shadow-md transition-all">
      <div className="p-3.5">
        {/* Row 1: time + status */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-light/15 to-gold-light/5 flex flex-col items-center justify-center shrink-0">
              <div className="font-en-display font-bold text-xs text-gold-deep leading-none">
                {b.booking_time.slice(0, 5)}
              </div>
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-ink truncate">{b.customer_name}</div>
              <div className="text-[10px] text-ink-soft">{dateLabel}</div>
            </div>
          </div>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${style.bg} shrink-0`}>
            {style.label}
          </span>
        </div>

        {/* Services */}
        {b.items && b.items.length > 0 && (
          <div className="text-[11px] text-ink-soft mb-2 pr-1">
            {b.items.slice(0, 2).map((it, i) => (
              <span key={i}>
                {it.service_name}
                {i < Math.min(b.items!.length, 2) - 1 && ' · '}
              </span>
            ))}
            {b.items.length > 2 && <span className="text-gold-deep font-bold"> +{b.items.length - 2}</span>}
          </div>
        )}

        {/* Row 3: duration + actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-cream-100 text-[11px]">
          <span className="flex items-center gap-1 text-ink-soft">
            <Timer className="w-3 h-3" />
            <span className="font-en-display">{formatDuration(b.duration_min)}</span>
          </span>
          <div className="flex-1" />
          <a
            href={`tel:${b.customer_phone}`}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold"
          >
            <Phone className="w-3 h-3" />
            اتصال
          </a>
          <a
            href={waLink(`السلام عليكم · أؤكّد موعدكِ`, b.customer_phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 text-green-700 font-bold"
          >
            <MessageCircle className="w-3 h-3" />
            واتساب
          </a>
        </div>
      </div>
    </li>
  );
}
