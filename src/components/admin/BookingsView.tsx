/**
 * BookingsView — تبديل بين الجدول والتقويم
 */
'use client';

import { useState } from 'react';
import { CalendarDays, LayoutList } from 'lucide-react';
import BookingsTable from './BookingsTable';
import BookingsCalendar from './BookingsCalendar';
import type { Booking, BookingItem } from '@/types/database';

export default function BookingsView({
  bookings, counts, activeStatus,
}: {
  bookings: (Booking & { items?: BookingItem[] })[];
  counts: Record<string, number>;
  activeStatus?: string;
}) {
  const [view, setView] = useState<'table' | 'calendar'>('table');

  return (
    <div>
      {/* زر التبديل */}
      <div className="mb-4 flex items-center justify-end">
        <div className="flex items-center bg-cream-100 rounded-lg p-1 text-xs">
          <button
            onClick={() => setView('table')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              view === 'table' ? 'bg-white text-ink shadow-sm font-bold' : 'text-ink-soft'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            جدول
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              view === 'calendar' ? 'bg-white text-ink shadow-sm font-bold' : 'text-ink-soft'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            تقويم
          </button>
        </div>
      </div>

      {view === 'table'
        ? <BookingsTable bookings={bookings} counts={counts} activeStatus={activeStatus} />
        : <BookingsCalendar bookings={bookings} onToggleView={() => setView('table')} />
      }
    </div>
  );
}
