/**
 * StaffDashboard — لوحة الموظفة (view مُركّز)
 * - جدولها اليوم
 * - حجوزاتها الأسبوعية
 * - ساعاتها الشهرية
 * - زر الحضور والانصراف
 */
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Calendar, Clock, TrendingUp, LogIn, Users, Phone } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default async function StaffDashboard({ userId, firstName }: { userId: string; firstName: string }) {
  const supabase = await createClient();
  const todayStr = new Date().toISOString().split('T')[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date();
  monthStart.setDate(1);

  // جلب الموظفة من ملفها الشخصي → ثم staff.id
  const { data: staffRecord } = await supabase.from('staff').select('id').eq('profile_id', userId).maybeSingle();
  const staffId = staffRecord?.id;

  const [
    { data: todayBookings },
    { data: weekBookings },
    { data: openAttendance },
    { data: monthAttendance },
    { data: pendingLeaves },
  ] = await Promise.all([
    // حجوزات اليوم للموظفة
    staffId
      ? supabase.from('bookings').select('*, items:booking_items(service_name)')
          .eq('staff_id', staffId).eq('booking_date', todayStr)
          .not('status', 'in', '(cancelled,no_show)')
          .order('booking_time')
      : Promise.resolve({ data: [] }),

    // حجوزات الأسبوع
    staffId
      ? supabase.from('bookings').select('id, booking_date, total, payment_status')
          .eq('staff_id', staffId).gte('booking_date', weekStart.toISOString().split('T')[0])
          .not('status', 'in', '(cancelled,no_show)')
      : Promise.resolve({ data: [] }),

    // حضور مفتوح
    supabase.from('attendance_records').select('check_in_at')
      .eq('user_id', userId).is('check_out_at', null).maybeSingle(),

    // ساعات الشهر
    supabase.from('attendance_records').select('total_minutes')
      .eq('user_id', userId).gte('check_in_at', monthStart.toISOString())
      .not('total_minutes', 'is', null),

    // طلبات إجازة معلّقة
    supabase.from('leave_requests').select('id, start_date, end_date, leave_type')
      .eq('user_id', userId).eq('status', 'pending'),
  ]);

  const monthMinutes = (monthAttendance || []).reduce((s: number, r: any) => s + (r.total_minutes || 0), 0);
  const monthHours = Math.floor(monthMinutes / 60);
  const weekBookingsCount = weekBookings?.length || 0;
  const isCheckedIn = !!openAttendance;

  return (
    <div className="p-6 md:p-8">
      {/* ترحيب */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-ar-display text-3xl font-bold text-gold-deep">
            أهلاً، {firstName} 💼
          </h1>
          <p className="text-ink-soft text-sm mt-1">
            {new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
          </p>
        </div>

        {/* زر الحضور — بارز */}
        <Link
          href="/account/attendance"
          className={`inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold shadow-sm ${
            isCheckedIn
              ? 'bg-success text-white hover:bg-success/90'
              : 'bg-gold-deep text-cream-50 hover:bg-ink'
          }`}
        >
          <LogIn className="w-4 h-4" />
          {isCheckedIn ? '✓ أنتِ في العمل الآن' : 'تسجيل حضور'}
        </Link>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatBox icon={Calendar} label="حجوزاتكِ اليوم" value={String(todayBookings?.length || 0)} />
        <StatBox icon={Users} label="هذا الأسبوع" value={String(weekBookingsCount)} />
        <StatBox icon={Clock} label="ساعات الشهر" value={`${monthHours}س`} />
        <StatBox icon={TrendingUp} label="طلبات إجازتكِ" value={String(pendingLeaves?.length || 0)} />
      </div>

      {/* روابط سريعة */}
      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        <Link
          href="/account/leaves"
          className="bg-white border border-cream-200 rounded-2xl p-4 flex items-center justify-between hover:shadow-md"
        >
          <div>
            <div className="font-ar-display font-bold text-ink">طلبات الإجازة</div>
            <div className="text-xs text-ink-soft mt-0.5">قدّمي أو تابعي طلباتكِ</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gold-light/15 flex items-center justify-center text-gold-deep">
            🏖
          </div>
        </Link>
        <Link
          href="/account/attendance"
          className="bg-white border border-cream-200 rounded-2xl p-4 flex items-center justify-between hover:shadow-md"
        >
          <div>
            <div className="font-ar-display font-bold text-ink">سجل حضوركِ</div>
            <div className="text-xs text-ink-soft mt-0.5">آخر 14 يوم من الحضور</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gold-light/15 flex items-center justify-center text-gold-deep">
            ⏱
          </div>
        </Link>
      </div>

      {/* جدول اليوم */}
      <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-cream-200 bg-cream-50 flex items-center justify-between">
          <h3 className="font-ar-display font-bold text-gold-deep">جدولكِ اليوم</h3>
          <span className="text-xs text-ink-soft">{todayBookings?.length || 0} حجز</span>
        </div>
        {!staffId ? (
          <div className="p-8 text-center text-sm text-ink-soft">
            لم يتم ربط حسابكِ ببروفايل موظفة بعد — تواصلي مع المالكة
          </div>
        ) : !todayBookings || todayBookings.length === 0 ? (
          <div className="p-8 text-center text-sm text-ink-soft">
            لا توجد حجوزات لكِ اليوم — استريحي 💛
          </div>
        ) : (
          <ul className="divide-y divide-cream-100">
            {todayBookings.map((b: any) => (
              <li key={b.id} className="p-4 flex items-center gap-4">
                <div className="text-center w-16 shrink-0">
                  <div className="font-en-display font-bold text-gold-deep text-xl">
                    {b.booking_time.slice(0, 5)}
                  </div>
                  <div className="text-[10px] text-ink-soft">{b.duration_min}د</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-ink">{b.customer_name}</div>
                  <a href={`tel:${b.customer_phone}`} className="text-xs text-ink-soft hover:text-gold-deep flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" />
                    <span className="font-en-display">{b.customer_phone}</span>
                  </a>
                  <div className="text-xs text-ink-soft mt-1">
                    {b.items?.map((i: any) => i.service_name).join('، ')}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  b.status === 'confirmed' ? 'bg-success/15 text-success'
                    : b.status === 'in_progress' ? 'bg-blue-100 text-blue-700'
                    : 'bg-warning/15 text-warning'
                }`}>
                  {b.status === 'confirmed' ? 'مؤكّد' : b.status === 'in_progress' ? 'جاري' : 'معلّق'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatBox({ icon: Icon, label, value }: any) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-cream-200 shadow-sm">
      <Icon className="w-5 h-5 text-gold-deep mb-2" />
      <div className="font-en-display text-2xl font-bold text-ink">{value}</div>
      <div className="text-xs text-ink-soft mt-1">{label}</div>
    </div>
  );
}
