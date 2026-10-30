/**
 * CapacityMeter — مؤشّر الطاقة الاستيعابيّة لليوم
 * ═══════════════════════════════════════════════════════════
 * - يحسب الدقائق المحجوزة ÷ الدقائق المتاحة
 * - يبين نسبة الاستغلال بشكل مرئي
 * - توصية ذكيّة
 */
import { Users, TrendingUp, Clock, Gauge } from 'lucide-react';

interface Props {
  bookedMinutes: number;
  availableMinutes: number;
  totalBookings: number;
  activeStaffCount: number;
}

export default function CapacityMeter({
  bookedMinutes, availableMinutes, totalBookings, activeStaffCount,
}: Props) {
  const utilization = availableMinutes > 0
    ? Math.min(100, Math.round((bookedMinutes / availableMinutes) * 100))
    : 0;

  // التصنيف
  let status: 'low' | 'moderate' | 'busy' | 'full';
  let color: string;
  let recommendation: string;
  let emoji: string;

  if (utilization >= 85) {
    status = 'full';
    color = 'from-rose-500 to-red-600';
    recommendation = '✨ ممتاز! اليوم شبه ممتلئ · فكّري بزيادة الأسعار في هذا اليوم';
    emoji = '🔥';
  } else if (utilization >= 60) {
    status = 'busy';
    color = 'from-amber-500 to-orange-500';
    recommendation = '👍 إشغال جيّد · حافظي على نفس الأداء';
    emoji = '⚡';
  } else if (utilization >= 30) {
    status = 'moderate';
    color = 'from-blue-500 to-sky-500';
    recommendation = '💡 فيه مكان لحجوزات إضافيّة · ممكن ترسلي عرض لعميلات VIP';
    emoji = '📈';
  } else {
    status = 'low';
    color = 'from-slate-400 to-slate-500';
    recommendation = '📣 يوم هادئ · فرصة لحملة ترويجيّة أو عرض خاص';
    emoji = '☕';
  }

  const statusLabel = {
    low: 'هادئ',
    moderate: 'متوسّط',
    busy: 'مزدحم',
    full: 'ممتلئ',
  }[status];

  const bookedHours = Math.floor(bookedMinutes / 60);
  const availableHours = Math.floor(availableMinutes / 60);

  return (
    <div className="bg-white rounded-3xl border border-cream-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-cream-200 bg-gradient-to-l from-gold-light/5 to-transparent">
        <div className="flex items-center justify-between">
          <h3 className="font-ar-display text-lg font-bold text-gold-deep flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            الطاقة الاستيعابيّة اليوم
          </h3>
          <span className="text-xl">{emoji}</span>
        </div>
        <p className="text-[11px] text-ink-soft mt-0.5">نسبة إشغال الموظفات اليوم</p>
      </div>

      {/* Body */}
      <div className="p-5">

        {/* الدائرة المرئيّة */}
        <div className="flex items-center gap-5 mb-5">
          <div className="relative shrink-0">
            <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90">
              {/* الخلفيّة */}
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="#f6eee0"
                strokeWidth="8"
              />
              {/* التقدّم */}
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="url(#capGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${utilization * 2.64} ${264 - utilization * 2.64}`}
                className="transition-all duration-700"
              />
              <defs>
                <linearGradient id="capGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={status === 'full' ? '#f43f5e' : status === 'busy' ? '#f59e0b' : status === 'moderate' ? '#3b82f6' : '#64748b'} />
                  <stop offset="100%" stopColor={status === 'full' ? '#dc2626' : status === 'busy' ? '#ea580c' : status === 'moderate' ? '#0284c7' : '#475569'} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="font-en-display font-bold text-3xl text-ink leading-none">
                {utilization}%
              </div>
              <div className="text-[9px] text-ink-soft font-bold mt-0.5">{statusLabel}</div>
            </div>
          </div>

          {/* الأرقام */}
          <div className="flex-1 space-y-2.5">
            <MeterStat icon={Clock} label="ساعات محجوزة" value={`${bookedHours}h`} />
            <MeterStat icon={TrendingUp} label="ساعات متاحة" value={`${availableHours}h`} />
            <MeterStat icon={Users} label="موظفات نشطات" value={String(activeStaffCount)} />
          </div>
        </div>

        {/* التوصية الذكيّة */}
        <div className={`relative overflow-hidden rounded-2xl p-3.5 bg-gradient-to-l ${color}`}>
          <p className="relative text-sm text-white font-semibold leading-relaxed">
            {recommendation}
          </p>
        </div>

        {/* الحجوزات */}
        <div className="mt-4 text-center text-xs text-ink-soft">
          <span className="font-en-display font-bold text-gold-deep text-base">{totalBookings}</span>
          {' '}حجز مجدول اليوم
        </div>
      </div>
    </div>
  );
}

function MeterStat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="w-3.5 h-3.5 text-gold-light shrink-0" />
      <span className="text-ink-soft">{label}</span>
      <span className="font-en-display font-bold text-ink mr-auto">{value}</span>
    </div>
  );
}
