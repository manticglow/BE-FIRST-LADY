/**
 * LiveStaffStatus — حالة الموظفات اللحظيّة
 * ═══════════════════════════════════════════════════════════
 * - من يعمل الآن؟
 * - من مع عميلة؟ ومن متاحة؟
 * - من في استراحة؟
 */
import { createClient } from '@/lib/supabase/server';
import { Clock, UserCheck, Coffee, UserX } from 'lucide-react';

interface StaffWithBooking {
  id: string;
  name: string;
  job_title: string;
  avatar_url: string | null;
  current_booking?: {
    customer_name: string;
    booking_time: string;
    end_time: string;
    service_name: string;
  } | null;
  next_booking?: {
    booking_time: string;
    customer_name: string;
  } | null;
  status: 'busy' | 'available' | 'break' | 'off';
}

export default async function LiveStaffStatus() {
  const supabase = await createClient();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().slice(0, 5);
  const dayOfWeek = now.getDay();

  // جلب كل الموظفات النشطات
  const { data: allStaff } = await supabase
    .from('staff')
    .select('id, name, job_title, avatar_url')
    .eq('is_active', true)
    .order('display_order');

  if (!allStaff || allStaff.length === 0) {
    return null;
  }

  // جلب جداول دوام اليوم
  const { data: schedules } = await supabase
    .from('staff_schedule')
    .select('staff_id, start_time, end_time, is_off')
    .eq('day_of_week', dayOfWeek);

  // جلب حجوزات اليوم
  const { data: todayBookings } = await supabase
    .from('bookings')
    .select('staff_id, customer_name, booking_time, duration_min, items:booking_items(service_name)')
    .eq('booking_date', todayStr)
    .not('status', 'in', '(cancelled,no_show)')
    .order('booking_time');

  // جلب الحضور المفتوح (داخلين الآن)
  const { data: openAttendance } = await supabase
    .from('attendance_records')
    .select('user_id, check_in_at')
    .is('check_out_at', null);

  // ربط الموظفات بـprofile_id → user_id للحضور
  const { data: staffProfiles } = await supabase
    .from('staff')
    .select('id, profile_id');
  const profileMap = new Map((staffProfiles || []).map((s) => [s.id, s.profile_id]));

  // بناء الحالة لكل موظفة
  const staffWithStatus: StaffWithBooking[] = allStaff.map((staff) => {
    const schedule = schedules?.find((s) => s.staff_id === staff.id && !s.is_off);
    const profileId = profileMap.get(staff.id);
    const isCheckedIn = profileId && openAttendance?.some((a) => a.user_id === profileId);

    // ما عندها دوام اليوم؟
    if (!schedule) {
      return { ...staff, status: 'off', current_booking: null, next_booking: null };
    }

    // خارج ساعات العمل؟
    const scheduleActive = currentTime >= schedule.start_time.slice(0, 5)
                           && currentTime <= schedule.end_time.slice(0, 5);
    if (!scheduleActive) {
      return { ...staff, status: 'off', current_booking: null, next_booking: null };
    }

    // البحث عن الحجز الحالي
    const staffBookings = (todayBookings || []).filter((b) => b.staff_id === staff.id);

    const current = staffBookings.find((b) => {
      const start = b.booking_time.slice(0, 5);
      const endMinutes = toMinutes(start) + b.duration_min;
      const end = fromMinutes(endMinutes);
      return currentTime >= start && currentTime < end;
    });

    const next = staffBookings.find((b) => b.booking_time.slice(0, 5) > currentTime);

    if (current) {
      const endMinutes = toMinutes(current.booking_time.slice(0, 5)) + current.duration_min;
      return {
        ...staff,
        status: 'busy',
        current_booking: {
          customer_name: current.customer_name,
          booking_time: current.booking_time.slice(0, 5),
          end_time: fromMinutes(endMinutes),
          service_name: (current.items as any)?.[0]?.service_name || 'خدمة',
        },
        next_booking: next ? {
          booking_time: next.booking_time.slice(0, 5),
          customer_name: next.customer_name,
        } : null,
      };
    }

    return {
      ...staff,
      status: isCheckedIn ? 'available' : 'break',
      current_booking: null,
      next_booking: next ? {
        booking_time: next.booking_time.slice(0, 5),
        customer_name: next.customer_name,
      } : null,
    };
  });

  // عدّات حسب الحالة
  const counts = {
    busy: staffWithStatus.filter((s) => s.status === 'busy').length,
    available: staffWithStatus.filter((s) => s.status === 'available').length,
    break: staffWithStatus.filter((s) => s.status === 'break').length,
    off: staffWithStatus.filter((s) => s.status === 'off').length,
  };

  return (
    <div className="bg-white rounded-3xl border border-cream-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-cream-200 bg-gradient-to-l from-gold-light/5 to-transparent">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-ar-display text-lg font-bold text-gold-deep flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            حالة الموظفات الآن
          </h3>
          <span className="text-[10px] text-ink-soft font-en-display">
            {now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* ملخّص عددي */}
        <div className="grid grid-cols-4 gap-2">
          <StatusPill count={counts.busy} label="مشغولة" color="rose" />
          <StatusPill count={counts.available} label="متاحة" color="emerald" />
          <StatusPill count={counts.break} label="استراحة" color="amber" />
          <StatusPill count={counts.off} label="خارج الدوام" color="slate" />
        </div>
      </div>

      {/* قائمة الموظفات */}
      <ul className="divide-y divide-cream-100 max-h-[480px] overflow-y-auto">
        {staffWithStatus.map((staff) => (
          <StaffRow key={staff.id} staff={staff} />
        ))}
      </ul>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

function StaffRow({ staff }: { staff: StaffWithBooking }) {
  const statusConfig = {
    busy: { icon: UserCheck, color: 'bg-rose-500', textColor: 'text-rose-600', label: 'مشغولة' },
    available: { icon: UserCheck, color: 'bg-emerald-500', textColor: 'text-emerald-600', label: 'متاحة' },
    break: { icon: Coffee, color: 'bg-amber-500', textColor: 'text-amber-600', label: 'استراحة' },
    off: { icon: UserX, color: 'bg-slate-300', textColor: 'text-slate-500', label: 'خارج الدوام' },
  }[staff.status];

  const Icon = statusConfig.icon;

  return (
    <li className="px-4 py-3 flex items-center gap-3 hover:bg-cream-50/50 transition-colors">

      {/* Avatar مع status dot */}
      <div className="relative shrink-0">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold-light/30 to-cream-100 flex items-center justify-center text-sm font-bold text-gold-deep">
          {staff.name.charAt(0)}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${statusConfig.color} border-2 border-white`} />
      </div>

      {/* الاسم والحالة */}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-ink truncate">{staff.name}</div>

        {staff.current_booking ? (
          <div className="text-[11px] text-ink-soft flex items-center gap-1 mt-0.5">
            <span className="truncate">
              مع <strong className="text-ink">{staff.current_booking.customer_name}</strong> ·
              <span className="font-en-display"> {staff.current_booking.booking_time} - {staff.current_booking.end_time}</span>
            </span>
          </div>
        ) : staff.next_booking ? (
          <div className="text-[11px] text-ink-soft flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 shrink-0" />
            <span>التالي: <span className="font-en-display">{staff.next_booking.booking_time}</span> · {staff.next_booking.customer_name}</span>
          </div>
        ) : (
          <div className={`text-[11px] mt-0.5 ${statusConfig.textColor} font-semibold`}>
            {statusConfig.label}
          </div>
        )}
      </div>

      {/* شارة الحالة · أيقونة */}
      <div className={`${statusConfig.textColor} shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
    </li>
  );
}

function StatusPill({ count, label, color }: { count: number; label: string; color: 'rose' | 'emerald' | 'amber' | 'slate' }) {
  const colors = {
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  }[color];

  return (
    <div className={`${colors} rounded-xl border p-2 text-center`}>
      <div className="font-en-display font-bold text-lg leading-none">{count}</div>
      <div className="text-[9px] font-semibold mt-1">{label}</div>
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
