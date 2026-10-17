/**
 * BookingCard — بطاقة حجز للعميلة · تصميم فاخر
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Calendar, Clock, Hash, X, Edit2, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import type { Booking, BookingItem } from '@/types/database';

const STATUS_STYLES: Record<string, { label: string; class: string; dot: string }> = {
  pending:     { label: 'بانتظار التأكيد', class: 'bg-warning/15 text-warning border-warning/30', dot: 'bg-warning' },
  confirmed:   { label: 'مؤكّد',           class: 'bg-success/15 text-success border-success/30', dot: 'bg-success' },
  in_progress: { label: 'جاري الآن',       class: 'bg-blue-100 text-blue-700 border-blue-300', dot: 'bg-blue-500 animate-pulse' },
  completed:   { label: 'مكتمل',           class: 'bg-cream-200 text-ink-soft border-cream-300', dot: 'bg-ink-soft' },
  cancelled:   { label: 'ملغي',            class: 'bg-danger/15 text-danger border-danger/30', dot: 'bg-danger' },
  no_show:     { label: 'لم تحضري',        class: 'bg-danger/15 text-danger border-danger/30', dot: 'bg-danger' },
};

export default function BookingCard({ booking }: { booking: Booking & { items?: BookingItem[] } }) {
  const router = useRouter();
  const status = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;
  const [busy, setBusy] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [newDate, setNewDate] = useState(booking.booking_date);
  const [newTime, setNewTime] = useState(booking.booking_time.slice(0, 5));

  const bookingDT = new Date(`${booking.booking_date}T${booking.booking_time}`);
  const hoursUntil = (bookingDT.getTime() - Date.now()) / (1000 * 60 * 60);
  const canModify = hoursUntil >= 24 && ['pending', 'confirmed'].includes(booking.status);
  const isCompleted = booking.status === 'completed';
  const isUpcoming = hoursUntil > 0 && !['cancelled', 'no_show', 'completed'].includes(booking.status);

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
    <div className={`
      bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all relative
      ${isUpcoming ? 'border-gold-light/40 shadow-sm' : 'border-cream-200'}
      ${isCompleted ? 'opacity-80' : ''}
    `}>
      {/* شريط علوي ملوّن حسب الحالة */}
      <div className={`absolute top-0 inset-x-0 h-1 ${status.dot}`} />

      <div className="p-4">
        {/* الهيدر: رقم + حالة */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1 text-[11px] text-ink-soft">
            <Hash className="w-3 h-3" />
            <span className="font-en-display">{booking.booking_number || booking.id.slice(0, 8)}</span>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${status.class}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        {/* التاريخ والوقت · بارز */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-light/15 to-gold-light/5 flex flex-col items-center justify-center text-gold-deep shrink-0">
            <div className="font-en-display font-bold text-lg leading-none">
              {booking.booking_time.slice(0, 5)}
            </div>
            <div className="text-[8px] opacity-70 mt-0.5">{booking.duration_min || 60}د</div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-ink-soft font-en-display">{formatDate(booking.booking_date)}</div>
            {booking.items && booking.items.length > 0 && (
              <div className="font-ar-display font-bold text-sm text-ink truncate mt-0.5">
                {booking.items[0].service_name}
                {booking.items.length > 1 && (
                  <span className="text-gold-deep text-xs mr-1 font-en-display">
                    +{booking.items.length - 1}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* قائمة الخدمات (لو أكثر من واحدة) */}
        {booking.items && booking.items.length > 1 && (
          <div className="mb-3 pb-3 border-b border-cream-100">
            <ul className="text-[11px] text-ink-soft space-y-1">
              {booking.items.slice(0, 3).map((item) => (
                <li key={item.id} className="flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-gold-light shrink-0" />
                  <span className="truncate">{item.service_name}</span>
                </li>
              ))}
              {booking.items.length > 3 && (
                <li className="text-gold-deep font-bold text-[10px]">+ {booking.items.length - 3} خدمات أخرى</li>
              )}
            </ul>
          </div>
        )}

        {/* الإجمالي + التقييم */}
        <div className="flex items-center justify-between pt-3 border-t border-cream-100">
          <span className="text-[11px] text-ink-soft">الإجمالي</span>
          <span className="font-en-display font-bold text-base text-gold-deep">
            {formatPrice(booking.total)}
          </span>
        </div>

        {/* رابط تقييم للحجوزات المكتملة */}
        {isCompleted && (
          <a
            href={`/review/${booking.booking_number}`}
            className="mt-3 flex items-center justify-center gap-1.5 py-2 bg-gradient-to-br from-gold-light/15 to-gold-light/5 text-gold-deep text-xs font-bold rounded-lg hover:bg-gold-light/20 transition-colors border border-gold-light/30"
          >
            <Sparkles className="w-3.5 h-3.5" />
            قيّمي زيارتكِ
          </a>
        )}

        {/* إجراءات · فقط للحجوزات القابلة للتعديل */}
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
                    className="px-2 py-1.5 rounded-lg border border-cream-200 bg-cream-50 text-xs font-en-display focus:border-gold-deep outline-none"
                  />
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-cream-200 bg-cream-50 text-xs font-en-display focus:border-gold-deep outline-none"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRescheduling(false)}
                    className="flex-1 text-xs text-ink-soft py-1.5 hover:text-ink transition-colors"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={reschedule}
                    disabled={busy}
                    className="flex-1 bg-gold-deep text-cream-50 text-xs font-bold py-1.5 rounded-lg disabled:opacity-50 hover:bg-ink transition-colors flex items-center justify-center gap-1"
                  >
                    {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <><CheckCircle2 className="w-3 h-3" /> حفظ</>}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRescheduling(true)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-[11px] bg-cream-100 text-gold-deep rounded-lg hover:bg-cream-200 font-bold transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  تعديل الموعد
                </button>
                <button
                  onClick={cancel}
                  disabled={busy}
                  className="flex items-center justify-center gap-1 py-2 px-3 text-[11px] bg-danger/10 text-danger rounded-lg hover:bg-danger/20 font-bold disabled:opacity-50 transition-colors"
                  title="إلغاء الحجز"
                >
                  {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
