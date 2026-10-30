/**
 * SmartInsights — رُؤى ذكيّة للمالكة
 * ═══════════════════════════════════════════════════════════
 * - أهم 3 رؤى من بيانات الأسبوع
 * - تحديد اليوم الأكثر ازدحاماً
 * - أعلى عميلة إنفاقاً
 * - الوقت الأكثر طلباً
 * - مؤشّر نمو مرئي
 */
import { Sparkles, Clock, Crown, TrendingUp, Zap } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  customer_name: string;
  total: number;
  status: string;
  payment_status: string;
}

interface Props {
  weekBookings: Booking[];
}

export default function SmartInsights({ weekBookings }: Props) {
  const insights = computeInsights(weekBookings);

  if (!insights || weekBookings.length === 0) {
    return (
      <div className="bg-gradient-to-br from-cream-50 to-white border border-gold-light/20 rounded-3xl p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-light/20 to-gold-light/5 mx-auto flex items-center justify-center mb-3">
          <Sparkles className="w-7 h-7 text-gold-deep" />
        </div>
        <h3 className="font-ar-display font-bold text-ink mb-1">الرؤى الذكيّة</h3>
        <p className="text-xs text-ink-soft">لمّا تتجمّع البيانات لأسبوع · راح تظهر لكِ هنا رؤى مفيدة</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-white via-cream-50 to-white border border-gold-light/30 rounded-3xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gold-light/15 bg-gradient-to-l from-gold-deep/8 to-transparent">
        <div className="flex items-center justify-between">
          <h3 className="font-ar-display text-lg font-bold text-gold-deep flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            رؤى ذكيّة
          </h3>
          <span className="text-[10px] text-ink-soft font-semibold">آخر 7 أيام</span>
        </div>
      </div>

      {/* Insights */}
      <div className="divide-y divide-cream-100">
        <InsightRow
          icon={Zap}
          color="amber"
          title="اليوم الأكثر ازدحاماً"
          value={insights.busiestDay.name}
          detail={`${insights.busiestDay.count} حجز`}
        />
        <InsightRow
          icon={Clock}
          color="violet"
          title="الوقت الأكثر طلباً"
          value={insights.peakHour}
          detail="ركّزي الموظفات في هالوقت"
        />
        <InsightRow
          icon={Crown}
          color="gold"
          title="أعلى عميلة إنفاقاً"
          value={insights.topCustomer.name}
          detail={formatPrice(insights.topCustomer.total)}
        />
        <InsightRow
          icon={TrendingUp}
          color="emerald"
          title="متوسط قيمة الحجز"
          value={formatPrice(insights.avgOrderValue)}
          detail={`${insights.completedCount} حجز مكتمل`}
        />
      </div>
    </div>
  );
}

function InsightRow({
  icon: Icon, color, title, value, detail,
}: {
  icon: any; color: 'amber' | 'violet' | 'gold' | 'emerald';
  title: string; value: string; detail: string;
}) {
  const colors = {
    amber: 'from-amber-100 to-amber-50 text-amber-700',
    violet: 'from-violet-100 to-violet-50 text-violet-700',
    gold: 'from-gold-light/25 to-gold-light/10 text-gold-deep',
    emerald: 'from-emerald-100 to-emerald-50 text-emerald-700',
  }[color];

  return (
    <div className="px-5 py-3.5 flex items-center gap-3 hover:bg-cream-50/50 transition-colors">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors} flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-ink-soft font-semibold">{title}</div>
        <div className="font-ar-display font-bold text-ink text-sm mt-0.5 truncate">{value}</div>
        <div className="text-[10px] text-ink-soft/80 mt-0.5">{detail}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// حسابات الرؤى
// ═══════════════════════════════════════════════════════════

function computeInsights(bookings: Booking[]) {
  if (bookings.length === 0) return null;

  const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  // اليوم الأكثر ازدحاماً
  const dayCount: Record<number, number> = {};
  bookings.forEach((b) => {
    const d = new Date(b.booking_date).getDay();
    dayCount[d] = (dayCount[d] || 0) + 1;
  });
  const busiestDayIdx = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0];
  const busiestDay = {
    name: DAY_NAMES[Number(busiestDayIdx[0])],
    count: busiestDayIdx[1],
  };

  // الوقت الأكثر طلباً (ساعة)
  const hourCount: Record<string, number> = {};
  bookings.forEach((b) => {
    const h = b.booking_time?.slice(0, 2) || '00';
    hourCount[h] = (hourCount[h] || 0) + 1;
  });
  const peakHourStr = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '00';
  const peakHour = `${peakHourStr}:00`;

  // أعلى عميلة
  const customerTotal: Record<string, number> = {};
  bookings
    .filter((b) => b.payment_status === 'paid')
    .forEach((b) => {
      customerTotal[b.customer_name] = (customerTotal[b.customer_name] || 0) + Number(b.total);
    });
  const topCustomerEntry = Object.entries(customerTotal).sort((a, b) => b[1] - a[1])[0];
  const topCustomer = topCustomerEntry
    ? { name: topCustomerEntry[0], total: topCustomerEntry[1] }
    : { name: 'لا يوجد بعد', total: 0 };

  // متوسط قيمة الحجز
  const paidBookings = bookings.filter((b) => b.payment_status === 'paid');
  const totalPaid = paidBookings.reduce((s, b) => s + Number(b.total), 0);
  const avgOrderValue = paidBookings.length > 0 ? totalPaid / paidBookings.length : 0;

  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  return {
    busiestDay,
    peakHour,
    topCustomer,
    avgOrderValue,
    completedCount,
  };
}
