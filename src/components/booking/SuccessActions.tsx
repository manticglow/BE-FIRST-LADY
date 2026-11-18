/**
 * SuccessActions — أزرار الإجراءات على صفحة نجاح الحجز
 * ═══════════════════════════════════════════════════════════
 * - إضافة للتقويم (.ics)
 * - مشاركة
 * - واتساب
 */
'use client';

import { Calendar, Share2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SuccessActions({ booking }: { booking: any }) {
  function downloadIcs() {
    const start = new Date(`${booking.booking_date}T${booking.booking_time}`);
    const end = new Date(start.getTime() + (booking.duration_min || 60) * 60000);
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const servicesList = (booking.items || [])
      .map((i: any) => i.service_name)
      .join(' · ') || 'جلسة';

    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//The First Lady//Booking//AR',
      'BEGIN:VEVENT',
      `UID:${booking.id}@thefirstlady.sa`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:جلستكِ · ${servicesList}`,
      `DESCRIPTION:رقم الحجز: ${booking.booking_number}\\nالخدمات: ${servicesList}\\nصالون السيّدة الأولى`,
      'LOCATION:صالون السيّدة الأولى · شارع يزيد بن الحكم الثقفي · حي الراية · المدينة المنوّرة',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:جلستكِ بعد ساعتين 🌸',
      'TRIGGER:-PT2H',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `booking-${booking.booking_number}.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('أضفناها لتقويمكِ · لا تنسيها 💛');
  }

  async function share() {
    const text = `✨ حجزت موعدي في صالون السيّدة الأولى\n${booking.booking_date} الساعة ${booking.booking_time}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'حجزي', text, url: window.location.origin });
      } catch {
        // cancelled
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success('نسخناها لكِ');
    }
  }

  function whatsapp() {
    const text = encodeURIComponent(
      `✨ تم حجز موعدي في صالون السيّدة الأولى\n📅 ${booking.booking_date}\n🕐 ${booking.booking_time}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      <button
        onClick={downloadIcs}
        className="flex flex-col items-center gap-1.5 bg-cream-50 hover:bg-cream-100 rounded-2xl py-3 px-2 transition-colors"
        style={{ minHeight: '68px' }}
      >
        <Calendar className="w-4 h-4 text-gold-deep" />
        <span className="text-[10px] font-bold text-ink">للتقويم</span>
      </button>

      <button
        onClick={whatsapp}
        className="flex flex-col items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-2xl py-3 px-2 transition-colors"
        style={{ minHeight: '68px' }}
      >
        <MessageCircle className="w-4 h-4 text-emerald-700" />
        <span className="text-[10px] font-bold text-ink">واتساب</span>
      </button>

      <button
        onClick={share}
        className="flex flex-col items-center gap-1.5 bg-cream-50 hover:bg-cream-100 rounded-2xl py-3 px-2 transition-colors"
        style={{ minHeight: '68px' }}
      >
        <Share2 className="w-4 h-4 text-gold-deep" />
        <span className="text-[10px] font-bold text-ink">مشاركة</span>
      </button>
    </div>
  );
}
