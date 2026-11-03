/**
 * StaffHomeTab — تبويب الرئيسية للموظّفة
 * ═══════════════════════════════════════════════════════════
 * - ترحيب حسب الوقت
 * - زر الحضور (CheckInButton)
 * - الموعد القادم (مع عدّاد تنازلي)
 * - جدول اليوم (timeline)
 * - إحصائيات سريعة
 */
'use client';

import { useMemo } from 'react';
import { Calendar, Phone, Sparkles, Clock, Users, TrendingUp, Timer } from 'lucide-react';
import type { StaffBooking, StaffUser, AttendanceState, StaffEarnings } from '../types';
import { STATUS_STYLES } from '../types';
import { formatPrice, formatDuration } from '@/lib/utils';
import CheckInButton from '../CheckInButton';

interface Props {
  user: StaffUser;
  attendance: AttendanceState;
  locationName: string | null;
  todayBookings: StaffBooking[];
  earnings: StaffEarnings;
  onRefresh?: () => void;
}

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return { ar: 'صباح الخير', emoji: '☀️' };
  if (h < 17) return { ar: 'مساء الخير', emoji: '🌤️' };
  if (h < 20) return { ar: 'مساء النور', emoji: '🌅' };
  return { ar: 'مساء الورد', emoji: '🌙' };
}

function minutesUntil(dateStr: string, timeStr: string): number {
  const target = new Date(`${dateStr}T${timeStr}`);
  return Math.round((target.getTime() - Date.now()) / 60000);
}

function fmtCountdown(mins: number): string {
  if (mins < 60) return `${mins} دقيقة`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h} ساعة` : `${h}س ${m}د`;
}

export default function StaffHomeTab({
  user, attendance, locationName, todayBookings, earnings, onRefresh,
}: Props) {
  const greeting = timeGreeting();
  const now = new Date();

  const nextBooking = useMemo(
    () => todayBookings.find((b) => {
      const t = new Date(`${b.booking_date}T${b.booking_time}`);
      return t > now && !['cancelled', 'no_show'].includes(b.status);
    }),
    [todayBookings, now],
  );

  const minsToNext = nextBooking ? minutesUntil(nextBooking.booking_date, nextBooking.booking_time) : null;
  const completedCount = todayBookings.filter((b) => b.status === 'completed').length;

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      {/* ─── ترحيب ─── */}
      <div>
        <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mb-1">
          STAFF HOME
        </div>
        <h1 className="font-ar-display text-2xl font-bold text-gold-deep">
          {greeting.ar}، {user.firstName} {greeting.emoji}
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          {new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)}
          {todayBookings.length > 0 && (
            <> · عندكِ <strong className="text-gold-deep font-en-display">{todayBookings.length}</strong> حجوزات اليوم</>
          )}
        </p>
      </div>

      {/* ─── زر الحضور الكبير ─── */}
      <CheckInButton
        initialCheckedIn={attendance.isCheckedIn}
        initialCheckInAt={attendance.checkInAt}
        locationName={locationName}
        onChange={onRefresh}
      />

      {/* ─── الموعد القادم ─── */}
      {nextBooking && minsToNext !== null && minsToNext >= 0 && (
        <div className="relative bg-gradient-to-br from-gold-deep via-amber-700 to-ink text-cream-50 rounded-3xl p-5 shadow-xl overflow-hidden">
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gold-light/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="font-en-label text-[10px] tracking-[0.25em] text-gold-light/80 mb-1">
                NEXT APPOINTMENT
              </div>
              <div className="font-ar-display text-lg font-bold">
                {nextBooking.customer_name}
              </div>
              <div className="text-xs opacity-80 mt-0.5">
                {nextBooking.items?.[0]?.service_name || 'جلسة'}
                {nextBooking.items && nextBooking.items.length > 1 && (
                  <span> +{nextBooking.items.length - 1}</span>
                )}
              </div>
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1 text-[10px] opacity-80 justify-end">
                <Timer className="w-3 h-3" />
                <span>باقي</span>
              </div>
              <div className="font-en-display font-bold text-xl leading-tight">
                {minsToNext === 0 ? 'الآن!' : fmtCountdown(minsToNext)}
              </div>
            </div>
          </div>

          <div className="relative flex items-center gap-2 pt-3 border-t border-white/15">
            <div className="flex items-center gap-1.5 text-xs opacity-90">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-en-display">{nextBooking.booking_time.slice(0, 5)}</span>
            </div>
            <span className="opacity-40">·</span>
            <div className="flex items-center gap-1.5 text-xs opacity-90">
              <Timer className="w-3.5 h-3.5" />
              <span>{formatDuration(nextBooking.duration_min)}</span>
            </div>
            <div className="flex-1" />
            <a
              href={`tel:${nextBooking.customer_phone}`}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              aria-label="اتصال"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* ─── Mini stats ─── */}
      <div className="grid grid-cols-3 gap-2">
        <MiniStat
          icon={Users}
          label="اليوم"
          value={`${todayBookings.length}`}
          sub="حجز"
          color="from-emerald-50 to-teal-50 text-emerald-700 border-emerald-200"
        />
        <MiniStat
          icon={Sparkles}
          label="أنجزت"
          value={`${completedCount}`}
          sub="جلسة"
          color="from-amber-50 to-rose-50 text-amber-700 border-amber-200"
        />
        <MiniStat
          icon={TrendingUp}
          label="عمولة اليوم"
          value={formatPrice(earnings.today_commission, { showFrom: false })}
          sub=""
          color="from-gold-light/20 to-gold-light/5 text-gold-deep border-gold-light/40"
        />
      </div>

      {/* ─── Timeline اليوم ─── */}
      {todayBookings.length > 0 && (
        <div>
          <h3 className="font-ar-display font-bold text-gold-deep mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            جدول اليوم
          </h3>
          <ul className="relative space-y-2 pr-5">
            {/* الخط الرأسي */}
            <div className="absolute right-[7px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-gold-light via-gold-light/40 to-transparent" />
            {todayBookings.map((b) => <TimelineRow key={b.id} booking={b} />)}
          </ul>
        </div>
      )}

      {/* ─── حالة فارغة ─── */}
      {todayBookings.length === 0 && (
        <div className="bg-cream-50 border border-cream-200 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-2">🌸</div>
          <div className="font-ar-display font-bold text-ink mb-1">يوم هادئ</div>
          <p className="text-xs text-ink-soft">
            ما عندك حجوزات اليوم · استغلّي الوقت للتجهيز والاستراحة
          </p>
        </div>
      )}
    </div>
  );
}

function MiniStat({
  icon: Icon, label, value, sub, color,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className={`rounded-2xl p-3 bg-gradient-to-br border ${color}`}>
      <div className="flex items-center gap-1 text-[10px] opacity-75 mb-1">
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
      <div className="font-en-display font-bold text-lg leading-none">{value}</div>
      {sub && <div className="text-[9px] opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
}

function TimelineRow({ booking }: { booking: StaffBooking }) {
  const style = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;
  return (
    <li className="relative pr-6">
      <div className={`absolute right-0 top-3 w-3.5 h-3.5 rounded-full border-2 border-white ${style.dot.split(' ')[0]}`} />
      <div className="bg-white rounded-2xl border border-cream-200 p-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="font-en-display font-bold text-gold-deep text-sm">
            {booking.booking_time.slice(0, 5)}
          </div>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${style.bg}`}>
            {style.label}
          </span>
        </div>
        <div className="font-bold text-sm text-ink truncate">{booking.customer_name}</div>
        {booking.items?.[0] && (
          <div className="text-[11px] text-ink-soft truncate">
            {booking.items[0].service_name}
            {booking.items.length > 1 && <> +{booking.items.length - 1}</>}
          </div>
        )}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-cream-100 text-[11px] text-ink-soft">
          <span className="flex items-center gap-1">
            <Timer className="w-3 h-3" />
            <span className="font-en-display">{formatDuration(booking.duration_min)}</span>
          </span>
          <span className="opacity-30">·</span>
          <a href={`tel:${booking.customer_phone}`} className="flex items-center gap-1 text-emerald-600 font-bold">
            <Phone className="w-3 h-3" />
            اتصال
          </a>
        </div>
      </div>
    </li>
  );
}
