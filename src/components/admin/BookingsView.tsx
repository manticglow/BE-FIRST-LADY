/**
 * BookingsView — تبديل بين الجدول والتقويم + زر حجز يدوي
 */
'use client';

import { useState, useEffect } from 'react';
import { CalendarDays, LayoutList, Plus } from 'lucide-react';
import BookingsTable from './BookingsTable';
import BookingsCalendar from './BookingsCalendar';
import ManualBookingModal from './ManualBookingModal';
import type { Booking, BookingItem } from '@/types/database';

export default function BookingsView({
  bookings, counts, activeStatus,
}: {
  bookings: (Booking & { items?: BookingItem[] })[];
  counts: Record<string, number>;
  activeStatus?: string;
}) {
  const [view, setView] = useState<'table' | 'calendar'>('table');
  const [manualOpen, setManualOpen] = useState(false);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  // جلب الخدمات والموظفات لمرّة واحدة عند فتح الـmodal
  useEffect(() => {
    if (!manualOpen || loaded) return;
    (async () => {
      try {
        const [sr, str] = await Promise.all([
          fetch('/api/admin/services'),
          fetch('/api/admin/staff'),
        ]);
        const sd = await sr.json();
        const td = await str.json();
        setServices(sd.services || sd || []);
        setStaff(td.staff || td || []);
        setLoaded(true);
      } catch {}
    })();
  }, [manualOpen, loaded]);

  return (
    <div>
      {/* ═══ شريط الأزرار ═══ */}
      <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">

        {/* زر الحجز اليدوي */}
        <button
          onClick={() => setManualOpen(true)}
          className="inline-flex items-center gap-2 bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50 font-ar-display font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-gold-deep/20 hover:scale-[1.03] transition-transform"
        >
          <Plus className="w-4 h-4" />
          حجز يدوي · عميلة في المحل
        </button>

        {/* تبديل العرض */}
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

      {/* ═══ Modal الحجز اليدوي ═══ */}
      {manualOpen && (
        <ManualBookingModal
          services={services}
          staff={staff}
          onClose={() => setManualOpen(false)}
        />
      )}
    </div>
  );
}
