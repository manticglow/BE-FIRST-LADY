/**
 * RescheduleModal — نافذة إعادة جدولة الحجز
 * ═══════════════════════════════════════════════════════════
 * - اختيار تاريخ ووقت جديد
 * - عرض الموعد الحالي
 * - زرّ طلب الإلغاء كبديل
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { X, Calendar, Clock, AlertTriangle, Loader2, MessageCircle } from 'lucide-react';
import { waLink } from '@/lib/utils';

interface Props {
  booking: {
    id: string;
    booking_number: string;
    booking_date: string;
    booking_time: string;
  };
  onClose: () => void;
}

export default function RescheduleModal({ booking, onClose }: Props) {
  const router = useRouter();
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<'reschedule' | 'cancel'>('reschedule');

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  async function handleSubmit() {
    if (mode === 'reschedule' && (!newDate || !newTime)) {
      toast.error('اختاري التاريخ والوقت الجديد');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/account/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          new_date: newDate || undefined,
          new_time: newTime || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        // الـAPI غير موجودة بعد · نرشّد العميلة للواتساب
        const message = mode === 'reschedule'
          ? `السلام عليكم · أريد إعادة جدولة حجز رقم ${booking.booking_number}\nالموعد الحالي: ${booking.booking_date} الساعة ${booking.booking_time.slice(0, 5)}\nالموعد الجديد المقترح: ${newDate} الساعة ${newTime}\n${notes ? 'ملاحظات: ' + notes : ''}`
          : `السلام عليكم · أريد إلغاء حجز رقم ${booking.booking_number}\nالموعد: ${booking.booking_date} الساعة ${booking.booking_time.slice(0, 5)}\n${notes ? 'السبب: ' + notes : ''}`;

        window.open(waLink(message), '_blank');
        toast.success('تحويلكِ لواتساب لتأكيد الطلب');
        onClose();
        return;
      }

      toast.success(mode === 'reschedule' ? '✅ تم طلب إعادة الجدولة' : '✅ تم طلب الإلغاء');
      router.refresh();
      onClose();
    } catch {
      toast.error('حدث خطأ · حاولي مجدداً');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-gold-deep to-ink text-cream-50 p-5 pb-6">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            aria-label="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="editorial-eyebrow text-gold-light/80 mb-1">BOOKING #{booking.booking_number}</div>
          <h2 className="font-ar-display text-xl font-bold">
            {mode === 'reschedule' ? 'إعادة جدولة الموعد' : 'طلب إلغاء الموعد'}
          </h2>

          <div className="mt-3 bg-white/15 backdrop-blur-sm rounded-xl p-2.5 text-xs">
            <div className="opacity-80 mb-0.5">الموعد الحالي:</div>
            <div className="font-bold">
              {new Date(booking.booking_date).toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}
              {' · '}
              <span className="font-en-display">{booking.booking_time.slice(0, 5)}</span>
            </div>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="p-4 pb-0">
          <div className="grid grid-cols-2 gap-2 bg-cream-100 p-1 rounded-xl">
            <button
              onClick={() => setMode('reschedule')}
              className={`py-2 text-sm font-bold rounded-lg transition-colors ${
                mode === 'reschedule' ? 'bg-white text-gold-deep shadow-sm' : 'text-ink-soft'
              }`}
            >
              📅 إعادة جدولة
            </button>
            <button
              onClick={() => setMode('cancel')}
              className={`py-2 text-sm font-bold rounded-lg transition-colors ${
                mode === 'cancel' ? 'bg-white text-rose-600 shadow-sm' : 'text-ink-soft'
              }`}
            >
              ❌ إلغاء الحجز
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">

          {mode === 'reschedule' ? (
            <>
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-2">
                  <Calendar className="w-3 h-3 inline ml-1" />
                  التاريخ الجديد
                </label>
                <input
                  type="date"
                  value={newDate}
                  min={minDateStr}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-cream-200 focus:border-gold-deep outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-2">
                  <Clock className="w-3 h-3 inline ml-1" />
                  الوقت الجديد
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-cream-200 focus:border-gold-deep outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-2">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="أي ملاحظة لنا..."
                  className="w-full px-3 py-2 rounded-xl border border-cream-200 focus:border-gold-deep outline-none resize-none bg-white text-sm"
                />
              </div>
            </>
          ) : (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  الإلغاء مجاني إذا كان قبل 24 ساعة من الموعد.
                  <br />
                  بعد ذلك قد يُحتسب رسم إداري بسيط.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-soft mb-2">
                  سبب الإلغاء (اختياري)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="شاركينا السبب..."
                  className="w-full px-3 py-2 rounded-xl border border-cream-200 focus:border-gold-deep outline-none resize-none bg-white text-sm"
                />
              </div>
            </>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full py-3 font-ar-display font-bold rounded-xl transition-colors ${
              mode === 'reschedule'
                ? 'bg-gradient-to-br from-gold-deep to-ink text-cream-50 hover:scale-[1.02]'
                : 'bg-rose-500 text-white hover:bg-rose-600'
            } disabled:opacity-50 flex items-center justify-center gap-2`}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
            {mode === 'reschedule' ? 'أرسلي طلب إعادة الجدولة' : 'أرسلي طلب الإلغاء'}
          </button>

          <p className="text-[10px] text-center text-ink-soft">
            سيصلكِ تأكيد خلال دقائق · أو تواصلي معنا مباشرة على واتساب
          </p>
        </div>
      </div>
    </div>
  );
}
