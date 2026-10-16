/**
 * BookingCard — بطاقة حجز للعميلة (مع إجراءات الإلغاء/التعديل)
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Calendar, Clock, Hash, X, Edit2, Loader2 } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import type { Booking, BookingItem } from '@/types/database';

const STATUS_STYLES: Record<string, { label: string; class: string }> = {
  pending:     { label: 'بانتظار التأكيد', class: 'bg-warning/15 text-warning' },
  confirmed:   { label: 'مؤكّد',           class: 'bg-success/15 text-success' },
  in_progress: { label: 'جاري الآن',       class: 'bg-blue-100 text-blue-700' },
  completed:   { label: 'مكتمل',           class: 'bg-cream-200 text-ink-soft' },
  cancelled:   { label: 'ملغي',            class: 'bg-danger/15 text-danger' },
  no_show:     { label: 'لم تحضري',        class: 'bg-danger/15 text-danger' },
};

export default function BookingCard({ booking }: { booking: Booking & { items?: BookingItem[] } }) {
  const router = useRouter();
  const status = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;
  const [busy, setBusy] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState(booking.booking_date);
  const [newTime, setNewTime] = useState(booking.booking_time.slice(0, 5));

  // قابل للتعديل؟ (قبل 24 ساعة + حالة مناسبة)
  const bookingDT = new Date(`${booking.booking_date}T${booking.booking_time}`);
  const hoursUntil = (bookingDT.getTime() - Date.now()) / (1000 * 60 * 60);
  const canModify = hoursUntil >= 24 && ['pending', 'confirmed'].includes(booking.status);

  async function cancel() {
    if (!confirm(`متأكدة من إلغاء الحجز رقم ${booking.booking_number}؟`)) return;
    setBusy(true);
    const res = await fetch(`/api/account/bookings/${booking.id}`, { method: 'DELETE' });
    setBusy(false);
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || 'فشل'); return; }
    toast.success('تم إلغاء الحجز');
    router.refresh();
  }

  async function reschedule() {
    if (!newDate || !newTime) { toast.error('حدّدي التاريخ والوقت'); return; }
    setBusy(true);
    const res = await fetch(`/api/account/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ booking_date: newDate, booking_time: newTime }),
    });
    setBusy(false);
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || 'فشل'); return; }
    toast.success(data.message || 'تم التعديل');
    setRescheduling(false);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl border border-cream-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-1 text-xs text-ink-soft">
          <Hash className="w-3 h-3" />
          <span className="font-en-display">{booking.booking_number || booking.id.slice(0, 8)}</span>
        </div>
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${status.class}`}>
          {status.label}
        </span>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-ink">
          <Calendar className="w-3.5 h-3.5 text-gold-deep" />
          <span className="font-en-display">{formatDate(booking.booking_date)}</span>
        </div>
        <div className="flex items-center gap-2 text-ink">
          <Clock className="w-3.5 h-3.5 text-gold-deep" />
          <span className="font-en-display">{booking.booking_time.slice(0, 5)}</span>
        </div>
      </div>

      {booking.items && booking.items.length > 0 && (
        <div className="mt-3 pt-3 border-t border-cream-200">
          <ul className="text-xs text-ink-soft space-y-0.5">
            {booking.items.slice(0, 3).map((item) => (
              <li key={item.id}>• {item.service_name}</li>
            ))}
            {booking.items.length > 3 && (
              <li className="text-gold-deep font-bold">+ {booking.items.length - 3} أخرى</li>
            )}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-cream-200">
        <span className="text-xs text-ink-soft">الإجمالي</span>
        <span className="font-en-display font-bold text-gold-deep">
          {formatPrice(booking.total)}
        </span>
      </div>

      {/* إجراءات */}
      {canModify && (
        <div className="mt-3 pt-3 border-t border-cream-100">
          {rescheduling ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-cream-200 bg-cream-50 text-xs font-en-display"
                />
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-cream-200 bg-cream-50 text-xs font-en-display"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setRescheduling(false)}
                  className="flex-1 text-xs text-ink-soft py-1.5"
                >
                  إلغاء
                </button>
                <button
                  onClick={reschedule}
                  disabled={busy}
                  className="flex-1 bg-gold-deep text-cream-50 text-xs font-bold py-1.5 rounded-lg disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'تأكيد'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRescheduling(true)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-cream-100 text-gold-deep rounded-lg hover:bg-cream-200 font-bold"
              >
                <Edit2 className="w-3 h-3" />
                تعديل
              </button>
              <button
                onClick={cancel}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs bg-danger/10 text-danger rounded-lg hover:bg-danger/20 font-bold disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                إلغاء الحجز
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
