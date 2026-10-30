/**
 * TodayFocusView — عرض اليوم فقط · للموظفة
 * ═══════════════════════════════════════════════════════════
 * - الموعد الحالي في مركز الشاشة
 * - timer للجلسة النشطة
 * - الموعد التالي أسفله
 * - إحصائيّات اليوم
 */
'use client';

import { useState, useEffect } from 'react';
import {
  User, Clock, Sparkles, Phone, MessageCircle,
  CheckCircle2, PlayCircle, Timer, Coffee, TrendingUp,
} from 'lucide-react';
import { waLink } from '@/lib/utils';

interface Booking {
  id: string;
  booking_number: string;
  customer_name: string;
  customer_phone: string;
  booking_time: string;
  duration_min: number;
  status: string;
  items?: Array<{ service_name: string }>;
}

interface Props {
  todayBookings: Booking[];
}

export default function TodayFocusView({ todayBookings }: Props) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const currentTime = now.toTimeString().slice(0, 5);

  // الحجز الحالي (اللي الوقت الحالي بداخله)
  const current = todayBookings.find((b) => {
    const start = b.booking_time.slice(0, 5);
    const endMinutes = toMinutes(start) + b.duration_min;
    const end = fromMinutes(endMinutes);
    return currentTime >= start && currentTime < end && b.status !== 'cancelled';
  });

  // الحجز التالي
  const upcoming = todayBookings
    .filter((b) => b.booking_time.slice(0, 5) > currentTime && b.status !== 'cancelled')
    .sort((a, b) => a.booking_time.localeCompare(b.booking_time));
  const next = upcoming[0];

  // المكتملة
  const completed = todayBookings.filter((b) => b.status === 'completed').length;
  const remaining = todayBookings.filter((b) => ['confirmed', 'pending'].includes(b.status)
    && b.booking_time.slice(0, 5) >= currentTime).length;

  return (
    <div className="space-y-5">

      {/* ═══ 1. الموعد الحالي · البطاقة الكبيرة ═══ */}
      {current ? (
        <CurrentSessionCard booking={current} now={now} />
      ) : upcoming.length === 0 ? (
        <QuietDayCard completed={completed} />
      ) : (
        <WaitingCard nextBooking={next} now={now} />
      )}

      {/* ═══ 2. إحصائيّات اليوم ═══ */}
      <div className="grid grid-cols-3 gap-2.5">
        <MiniStatCard
          icon={CheckCircle2}
          value={String(completed)}
          label="أكملتِها"
          color="emerald"
        />
        <MiniStatCard
          icon={Clock}
          value={String(remaining)}
          label="المتبقّية"
          color="gold"
        />
        <MiniStatCard
          icon={TrendingUp}
          value={String(todayBookings.length)}
          label="اليوم كامل"
          color="violet"
        />
      </div>

      {/* ═══ 3. الحجوزات التالية ═══ */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-3xl border border-cream-200 overflow-hidden shadow-sm">
          <div className="px-5 py-3 border-b border-cream-200 bg-gradient-to-l from-gold-light/5 to-transparent">
            <h3 className="font-ar-display text-base font-bold text-gold-deep flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {current ? 'بعد الموعد الحالي' : 'المواعيد القادمة'}
            </h3>
          </div>
          <ul className="divide-y divide-cream-100 max-h-80 overflow-y-auto">
            {upcoming.slice(0, 6).map((b) => <UpcomingRow key={b.id} booking={b} />)}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

function CurrentSessionCard({ booking, now }: { booking: Booking; now: Date }) {
  const start = new Date(`${new Date().toISOString().split('T')[0]}T${booking.booking_time}`);
  const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000);
  const totalSec = booking.duration_min * 60;
  const remaining = Math.max(0, totalSec - elapsed);
  const percent = Math.min(100, (elapsed / totalSec) * 100);

  const elapsedMin = Math.floor(elapsed / 60);
  const elapsedSec = elapsed % 60;
  const remainingMin = Math.floor(remaining / 60);
  const remainingSec = remaining % 60;

  const services = (booking.items || []).map((i) => i.service_name).join(' · ');

  return (
    <div className="relative bg-gradient-to-br from-rose-500 via-pink-600 to-rose-700 rounded-3xl p-6 text-white shadow-2xl overflow-hidden">

      {/* زخرفة خلفيّة */}
      <div className="absolute inset-0 opacity-15 pointer-events-none" aria-hidden="true">
        <PlayCircle className="absolute top-6 right-6 w-24 h-24" />
      </div>

      {/* شارة الحالة */}
      <div className="relative inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-sm text-[11px] font-bold px-3 py-1.5 rounded-full mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        🔥 جلسة نشطة الآن
      </div>

      {/* اسم العميلة · كبير */}
      <h2 className="relative font-ar-display text-3xl md:text-4xl font-bold mb-1">
        {booking.customer_name}
      </h2>
      <p className="relative text-sm opacity-90 mb-5">{services}</p>

      {/* Timer */}
      <div className="relative bg-white/15 backdrop-blur-sm rounded-2xl p-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] opacity-80 font-bold mb-1">مرّ من الجلسة</div>
            <div className="font-en-display font-bold text-3xl tabular-nums">
              {String(elapsedMin).padStart(2, '0')}:{String(elapsedSec).padStart(2, '0')}
            </div>
          </div>
          <div>
            <div className="text-[10px] opacity-80 font-bold mb-1">المتبقّي</div>
            <div className="font-en-display font-bold text-3xl tabular-nums">
              {String(remainingMin).padStart(2, '0')}:{String(remainingSec).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* شريط التقدّم */}
        <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-1000"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="text-[10px] opacity-70 mt-1 text-center">
          {Math.round(percent)}% مكتمل
        </div>
      </div>

      {/* الأزرار */}
      <div className="relative grid grid-cols-2 gap-2">
        <a
          href={`tel:${booking.customer_phone}`}
          className="inline-flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm font-bold py-2.5 rounded-xl text-sm"
        >
          <Phone className="w-4 h-4" />
          اتصلي
        </a>
        <a
          href={waLink(`مرحباً ${booking.customer_name}`)}
          target="_blank"
          className="inline-flex items-center justify-center gap-2 bg-white text-ink font-bold py-2.5 rounded-xl text-sm hover:bg-cream-50"
        >
          <CheckCircle2 className="w-4 h-4" />
          إنهاء الجلسة
        </a>
      </div>
    </div>
  );
}

function WaitingCard({ nextBooking, now }: { nextBooking: Booking | undefined; now: Date }) {
  if (!nextBooking) return null;

  const target = new Date(`${new Date().toISOString().split('T')[0]}T${nextBooking.booking_time}`);
  const diffMs = target.getTime() - now.getTime();
  const totalMin = Math.max(0, Math.floor(diffMs / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;

  return (
    <div className="relative bg-gradient-to-br from-gold-deep via-ink to-gold-deep rounded-3xl p-6 text-cream-50 shadow-xl overflow-hidden">

      <div className="relative inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-sm text-[11px] font-bold px-3 py-1.5 rounded-full mb-4">
        <Coffee className="w-3 h-3" />
        استراحة · في انتظار الموعد القادم
      </div>

      <h2 className="relative font-ar-display text-2xl md:text-3xl font-bold mb-1">
        موعدكِ القادم بعد
      </h2>

      <div className="relative flex items-end gap-2 my-4">
        {h > 0 && (
          <div className="font-en-display font-bold text-6xl tabular-nums leading-none">
            {String(h).padStart(2, '0')}
            <span className="text-2xl opacity-70">:</span>
          </div>
        )}
        <div className="font-en-display font-bold text-6xl tabular-nums leading-none">
          {String(m).padStart(2, '0')}
        </div>
        <div className="text-xs opacity-70 mb-2 mr-1">
          {h > 0 ? 'ساعة : دقيقة' : 'دقيقة'}
        </div>
      </div>

      <div className="relative bg-white/15 backdrop-blur-sm rounded-xl p-3 text-sm">
        <div className="opacity-80 text-[10px] mb-1">القادمة:</div>
        <div className="font-bold">
          {nextBooking.customer_name} · <span className="font-en-display">{nextBooking.booking_time.slice(0, 5)}</span>
        </div>
      </div>
    </div>
  );
}

function QuietDayCard({ completed }: { completed: number }) {
  return (
    <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl text-center">
      <div className="text-5xl mb-3">
        {completed > 0 ? '✨' : '☕'}
      </div>
      <h2 className="font-ar-display text-2xl font-bold mb-2">
        {completed > 0 ? 'يوم رائع · أحسنتِ!' : 'يوم هادئ'}
      </h2>
      <p className="text-sm opacity-90 mb-4">
        {completed > 0
          ? `أكملتِ ${completed} جلسة · استريحي الآن`
          : 'استمتعي بوقتكِ · لا توجد مواعيد اليوم'}
      </p>
    </div>
  );
}

function UpcomingRow({ booking }: { booking: Booking }) {
  const services = (booking.items || []).map((i) => i.service_name).join(' · ');
  return (
    <li className="px-5 py-3 flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-light/20 to-cream-100 flex flex-col items-center justify-center shrink-0">
        <span className="font-en-display font-bold text-sm text-gold-deep leading-none">
          {booking.booking_time.slice(0, 5)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-ink truncate">{booking.customer_name}</div>
        <div className="text-[11px] text-ink-soft truncate">{services || 'خدمة'}</div>
      </div>
      <span className="text-[10px] bg-cream-100 px-2 py-0.5 rounded-full text-ink-soft">
        {booking.duration_min}د
      </span>
    </li>
  );
}

function MiniStatCard({
  icon: Icon, value, label, color,
}: {
  icon: any; value: string; label: string;
  color: 'emerald' | 'gold' | 'violet';
}) {
  const colors = {
    emerald: 'from-emerald-500/15 to-emerald-500/5 text-emerald-600',
    gold: 'from-gold-light/20 to-gold-light/5 text-gold-deep',
    violet: 'from-violet-500/15 to-violet-500/5 text-violet-600',
  }[color];

  return (
    <div className={`bg-gradient-to-br ${colors} rounded-2xl p-3 text-center border border-cream-200`}>
      <Icon className="w-5 h-5 mx-auto mb-1" />
      <div className="font-en-display font-bold text-2xl text-ink leading-none">{value}</div>
      <div className="text-[10px] font-bold mt-1 opacity-80">{label}</div>
    </div>
  );
}

/* ═══ Helpers ═══ */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function fromMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
