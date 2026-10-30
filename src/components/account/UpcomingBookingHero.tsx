/**
 * UpcomingBookingHero — بطاقة الموعد القادم البارزة
 * ═══════════════════════════════════════════════════════════
 * - عدّاد تنازلي لحظي
 * - أزرار إجراء سريعة (إعادة جدولة · إلغاء · مشاركة · خريطة)
 * - تدرّج اللون حسب القرب
 * - يبين الموظفة والخدمات
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar, Clock, MapPin, User, Sparkles, Phone,
  RotateCcw, Share2, MessageCircle, X, ChevronLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { waLink } from '@/lib/utils';

interface Booking {
  id: string;
  booking_number: string;
  booking_date: string;
  booking_time: string;
  duration_min: number;
  total: number;
  status: string;
  staff?: { name: string } | null;
  items?: Array<{ service_name: string }>;
}

interface Props {
  booking: Booking;
  salonAddress?: string;
}

export default function UpcomingBookingHero({ booking, salonAddress = 'المدينة المنوّرة' }: Props) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = new Date(`${booking.booking_date}T${booking.booking_time}`);
  const diffMs = target.getTime() - now.getTime();
  const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSecs / 86400);
  const hours = Math.floor((totalSecs % 86400) / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  // تدرّج اللون حسب القرب
  const isNow = diffMs <= 0 && diffMs > -3600000;      // خلال الساعة الأخيرة
  const isSoon = diffMs > 0 && diffMs <= 3600000;      // خلال ساعة
  const isToday = diffMs > 3600000 && diffMs < 86400000; // اليوم

  const gradient = isNow
    ? 'from-rose-500 via-red-600 to-rose-700'
    : isSoon
      ? 'from-amber-500 via-orange-500 to-amber-600'
      : isToday
        ? 'from-gold-deep via-ink to-gold-deep'
        : 'from-ink via-gold-deep to-ink';

  const services = (booking.items || []).map((i) => i.service_name).join(' · ');

  // رابط Google Calendar
  function addToCalendar() {
    const start = target.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const end = new Date(target.getTime() + booking.duration_min * 60000)
      .toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const title = encodeURIComponent(`Be First Lady · ${services || 'موعدي'}`);
    const details = encodeURIComponent(`رقم الحجز: ${booking.booking_number}\nالموظفة: ${booking.staff?.name || 'سيتم التعيين'}`);
    const location = encodeURIComponent(salonAddress);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
    window.open(url, '_blank');
  }

  function shareBooking() {
    const text = `موعدي في Be First Lady · ${target.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })} الساعة ${booking.booking_time.slice(0, 5)}`;
    if (navigator.share) {
      navigator.share({ title: 'موعدي', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      toast.success('نُسخ النص للحافظة');
    }
  }

  return (
    <div className={`relative bg-gradient-to-br ${gradient} rounded-3xl text-cream-50 shadow-2xl overflow-hidden`}>

      {/* زخرفة خلفيّة */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
        <Sparkles className="absolute top-6 right-6 w-24 h-24" />
        <Calendar className="absolute bottom-6 left-6 w-28 h-28" />
      </div>

      <div className="relative p-6 md:p-8">

        {/* شريط علوي · شارة الحالة */}
        <div className="flex items-center justify-between mb-5">
          <div className="inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-sm text-[11px] font-bold px-3 py-1.5 rounded-full">
            <span className={`w-1.5 h-1.5 rounded-full bg-cream-50 ${isNow || isSoon ? 'animate-pulse' : ''}`} />
            {isNow ? '🔥 الموعد الآن' : isSoon ? '⏰ موعدك قريب' : isToday ? '✨ موعدك اليوم' : '📅 موعدك القادم'}
          </div>
          <span className="font-en-display text-xs opacity-80">
            #{booking.booking_number}
          </span>
        </div>

        {/* ═══ العدّاد التنازلي الكبير ═══ */}
        {diffMs > 0 ? (
          <div className="mb-6">
            <div className="editorial-eyebrow text-cream-100/70 mb-2">COUNTDOWN</div>
            <div className="flex items-end gap-3 flex-wrap">
              {days > 0 && <CountUnit value={days} label="يوم" big />}
              <CountUnit value={hours} label="ساعة" big />
              <CountUnit value={mins} label="دقيقة" big />
              {!days && <CountUnit value={secs} label="ثانية" />}
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <div className="font-ar-display text-3xl md:text-4xl font-bold mb-1">
              موعدك الآن!
            </div>
            <div className="text-xs opacity-80">نرحّب بكِ في Be First Lady</div>
          </div>
        )}

        {/* ═══ تفاصيل الموعد ═══ */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 mb-5 space-y-2.5">
          <InfoRow
            icon={Calendar}
            value={target.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}
          />
          <InfoRow
            icon={Clock}
            value={`${booking.booking_time.slice(0, 5)} · ${booking.duration_min} دقيقة`}
          />
          {booking.staff?.name && (
            <InfoRow icon={User} value={`مع ${booking.staff.name}`} />
          )}
          {services && <InfoRow icon={Sparkles} value={services} />}
          <InfoRow icon={MapPin} value={salonAddress} />
        </div>

        {/* ═══ أزرار الإجراء ═══ */}
        <div className="grid grid-cols-4 gap-2">
          <ActionBtn icon={Calendar} label="للتقويم" onClick={addToCalendar} />
          <ActionBtn icon={Share2} label="مشاركة" onClick={shareBooking} />
          <ActionBtn
            icon={MessageCircle}
            label="واتساب"
            href={waLink(`السلام عليكم · عندي حجز رقم ${booking.booking_number}`)}
            external
          />
          <ActionBtn
            icon={RotateCcw}
            label="تعديل"
            href={`/account/bookings?reschedule=${booking.id}`}
          />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

function CountUnit({ value, label, big = false }: { value: number; label: string; big?: boolean }) {
  const size = big ? 'text-5xl md:text-6xl' : 'text-3xl md:text-4xl';
  return (
    <div className="flex flex-col items-center">
      <div className={`font-en-display font-bold ${size} leading-none tabular-nums bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 min-w-[70px] text-center`}>
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-[10px] mt-1 opacity-80 font-bold">{label}</div>
    </div>
  );
}

function InfoRow({ icon: Icon, value }: { icon: any; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-4 h-4 opacity-70 shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  );
}

function ActionBtn({
  icon: Icon, label, href, onClick, external = false,
}: {
  icon: any; label: string;
  href?: string; onClick?: () => void; external?: boolean;
}) {
  const className = "flex flex-col items-center justify-center gap-1 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl transition-colors text-cream-50 text-[10px] font-bold";

  if (href) {
    const props = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
    return (
      <Link href={href} {...props} className={className}>
        <Icon className="w-4 h-4" />
        {label}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
