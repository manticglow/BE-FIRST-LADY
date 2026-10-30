/**
 * NextAppointmentCountdown — عدّاد تنازلي للموعد القادم
 * ═══════════════════════════════════════════════════════════
 * - يحدّث كل ثانية
 * - يغيّر اللون حسب القرب
 * - يبين نسبة الاستعداد
 */
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Timer, Phone, User, MessageCircle, Calendar, Sparkles } from 'lucide-react';
import { waLink } from '@/lib/utils';

interface Booking {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_phone: string;
  booking_date: string;
  booking_time: string;
  items?: Array<{ service_name: string }>;
  customer_notes?: string | null;
}

interface Props {
  booking: Booking;
}

export default function NextAppointmentCountdown({ booking }: Props) {
  const [now, setNow] = useState<Date>(() => new Date());

  // تحديث كل ثانية
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const target = new Date(`${booking.booking_date}T${booking.booking_time}`);
  const diffMs = target.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);
  const diffHours = Math.floor(diffMins / 60);
  const minsRemainder = diffMins % 60;

  // تحديد الحالة واللون
  let urgency: 'now' | 'soon' | 'upcoming' | 'future';
  let urgencyColor: string;
  let urgencyLabel: string;

  if (diffMs <= 0) {
    urgency = 'now';
    urgencyColor = 'from-rose-500 to-red-600';
    urgencyLabel = '🔥 الموعد الآن!';
  } else if (diffMins <= 15) {
    urgency = 'soon';
    urgencyColor = 'from-amber-500 to-orange-600';
    urgencyLabel = '⏰ قريب جداً · استعدّي';
  } else if (diffMins <= 60) {
    urgency = 'upcoming';
    urgencyColor = 'from-gold-deep to-amber-600';
    urgencyLabel = '✨ خلال ساعة';
  } else {
    urgency = 'future';
    urgencyColor = 'from-ink to-gold-deep';
    urgencyLabel = `📅 بعد ${diffHours}:${String(minsRemainder).padStart(2, '0')} ساعة`;
  }

  const services = (booking.items || []).map((i) => i.service_name).join(' · ');

  // نسبة الاستعداد (كلما قرب الوقت زاد المؤشّر) · من ساعة قبل
  const prepPercent = Math.min(100, Math.max(0, 100 - (diffMins / 60) * 100));

  return (
    <div className={`relative bg-gradient-to-br ${urgencyColor} rounded-3xl p-5 md:p-6 text-cream-50 shadow-xl overflow-hidden`}>

      {/* نقش خلفي */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
        <Sparkles className="absolute top-4 left-4 w-16 h-16" />
        <Timer className="absolute bottom-4 right-4 w-20 h-20" />
      </div>

      {/* شارة الحالة */}
      <div className="relative inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-cream-50 text-[10px] font-bold px-3 py-1 rounded-full mb-3">
        <span className={`w-1.5 h-1.5 rounded-full bg-cream-50 ${urgency === 'now' || urgency === 'soon' ? 'animate-pulse' : ''}`} />
        {urgencyLabel}
      </div>

      {/* العدّاد الكبير */}
      <div className="relative mb-4">
        {urgency === 'now' ? (
          <div className="font-ar-display text-3xl md:text-4xl font-bold leading-none">
            ابدئي الجلسة الآن
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="font-en-display text-5xl md:text-6xl font-bold leading-none tabular-nums">
                {diffHours > 0 && (
                  <>{String(diffHours).padStart(2, '0')}:</>
                )}
                {String(minsRemainder).padStart(2, '0')}
              </span>
              <span className="font-en-display text-2xl opacity-70 tabular-nums">
                :{String(diffSecs).padStart(2, '0')}
              </span>
            </div>
            <div className="text-xs mt-1 opacity-80">
              {diffHours > 0 ? 'ساعات : دقائق : ثواني' : 'دقائق : ثواني'}
            </div>
          </>
        )}
      </div>

      {/* شريط التقدّم */}
      <div className="relative h-1 bg-white/20 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-cream-50 rounded-full transition-all duration-1000"
          style={{ width: `${prepPercent}%` }}
        />
      </div>

      {/* معلومات العميلة */}
      <div className="relative space-y-2.5">
        <InfoRow icon={User} value={booking.customer_name} />
        <InfoRow icon={Sparkles} value={services || 'خدمة واحدة'} />
        {booking.customer_notes && (
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-xs leading-relaxed">
            <div className="opacity-70 text-[10px] mb-1">ملاحظات العميلة:</div>
            {booking.customer_notes}
          </div>
        )}
      </div>

      {/* أزرار الإجراء */}
      <div className="relative flex gap-2 mt-5">
        <a
          href={`tel:${booking.customer_phone}`}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-cream-50 font-bold py-2.5 rounded-xl transition-colors text-sm"
        >
          <Phone className="w-4 h-4" />
          اتصلي
        </a>
        <a
          href={waLink('مرحباً · هذا تذكير لموعدكِ')}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-cream-50 font-bold py-2.5 rounded-xl transition-colors text-sm"
        >
          <MessageCircle className="w-4 h-4" />
          واتساب
        </a>
        <Link
          href={`/admin/bookings?id=${booking.id}`}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-cream-50 text-ink font-bold py-2.5 rounded-xl hover:bg-white transition-colors text-sm"
        >
          <Calendar className="w-4 h-4" />
          التفاصيل
        </Link>
      </div>
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
