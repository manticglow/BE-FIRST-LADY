/**
 * MyEarningsCard — بطاقة أرباحي اللحظيّة للموظفة
 * ═══════════════════════════════════════════════════════════
 * - اليوم · الأسبوع · الشهر
 * - عمولة محتسبة (نسبة من قيمة الحجوزات)
 * - عدد الجلسات
 * - عميلات مميّزات
 */
import { createClient } from '@/lib/supabase/server';
import {
  Wallet, TrendingUp, Users, Sparkles, Calendar, Award,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Props {
  staffProfileId: string;
  commissionRate?: number; // النسبة من قيمة الخدمة (default 20%)
}

type BookingLite = { total: number; status: string; customer_name?: string; customer_id?: string | null };

export default async function MyEarningsCard({
  staffProfileId,
  commissionRate = 0.20,
}: Props) {
  const supabase = await createClient();

  // جلب staff.id من profile_id
  const { data: staffRecord } = await supabase
    .from('staff')
    .select('id')
    .eq('profile_id', staffProfileId)
    .maybeSingle();

  const staffId = (staffRecord as { id: string } | null)?.id;
  if (!staffId) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date();
  monthStart.setDate(1);

  const [
    { data: todayBookings },
    { data: weekBookings },
    { data: monthBookings },
  ] = await Promise.all([
    supabase.from('bookings')
      .select('total, status, customer_name')
      .eq('staff_id', staffId)
      .eq('booking_date', todayStr)
      .in('status', ['confirmed', 'in_progress', 'completed']),
    supabase.from('bookings')
      .select('total, status')
      .eq('staff_id', staffId)
      .gte('booking_date', weekStart.toISOString().split('T')[0])
      .in('status', ['confirmed', 'in_progress', 'completed']),
    supabase.from('bookings')
      .select('total, status, customer_id')
      .eq('staff_id', staffId)
      .gte('booking_date', monthStart.toISOString().split('T')[0])
      .in('status', ['confirmed', 'in_progress', 'completed']),
  ]);

  const today = (todayBookings as BookingLite[] | null) ?? [];
  const week = (weekBookings as BookingLite[] | null) ?? [];
  const month = (monthBookings as BookingLite[] | null) ?? [];

  // حسابات اليوم
  const todayTotal = today.reduce((s, b) => s + Number(b.total), 0);
  const todayCommission = todayTotal * commissionRate;
  const todayCount = today.length;
  const todayCompleted = today.filter((b) => b.status === 'completed').length;

  // حسابات الأسبوع
  const weekTotal = week.reduce((s, b) => s + Number(b.total), 0);
  const weekCommission = weekTotal * commissionRate;
  const weekCount = week.length;

  // حسابات الشهر
  const monthTotal = month.reduce((s, b) => s + Number(b.total), 0);
  const monthCommission = monthTotal * commissionRate;
  const monthCount = month.length;
  const uniqueCustomers = new Set(month.filter((b) => b.customer_id).map((b) => b.customer_id)).size;

  return (
    <div className="relative bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 rounded-3xl p-5 md:p-6 text-white shadow-xl overflow-hidden">

      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="editorial-eyebrow text-white/70 mb-1">MY EARNINGS</div>
            <h3 className="font-ar-display text-xl font-bold flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              أرباحي اللحظيّة
            </h3>
          </div>
          <div className="text-right">
            <div className="text-[10px] opacity-80">عمولة</div>
            <div className="font-en-display font-bold text-lg">{Math.round(commissionRate * 100)}%</div>
          </div>
        </div>

        {/* Today · الكبيرة */}
        <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 mb-3">
          <div className="flex items-end justify-between gap-3 mb-2">
            <div>
              <div className="text-[11px] opacity-80 mb-1">اليوم</div>
              <div className="font-en-display font-bold text-4xl md:text-5xl leading-none">
                {formatPrice(todayCommission, { showFrom: false })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] opacity-80">من</div>
              <div className="font-en-display font-bold text-sm">
                {formatPrice(todayTotal, { showFrom: false })}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] opacity-90 pt-2 border-t border-white/15">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {todayCount} جلسة
            </span>
            {todayCompleted > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {todayCompleted} مكتملة
                </span>
              </>
            )}
          </div>
        </div>

        {/* Week + Month */}
        <div className="grid grid-cols-2 gap-2.5">
          <PeriodStat
            icon={Calendar}
            label="الأسبوع"
            commission={weekCommission}
            total={weekTotal}
            count={weekCount}
          />
          <PeriodStat
            icon={Award}
            label="الشهر"
            commission={monthCommission}
            total={monthTotal}
            count={monthCount}
            extra={`${uniqueCustomers} عميلة`}
          />
        </div>
      </div>
    </div>
  );
}

function PeriodStat({
  icon: Icon, label, commission, total, count, extra,
}: {
  icon: LucideIcon; label: string;
  commission: number; total: number; count: number;
  extra?: string;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/15">
      <div className="flex items-center gap-1.5 text-[10px] opacity-80 mb-1">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="font-en-display font-bold text-xl leading-none mb-1">
        {formatPrice(commission, { showFrom: false })}
      </div>
      <div className="text-[9px] opacity-70 flex items-center gap-1 flex-wrap">
        <span>{count} جلسة</span>
        {extra && <><span>·</span><span>{extra}</span></>}
      </div>
    </div>
  );
}
