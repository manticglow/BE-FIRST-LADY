/**
 * StaffEarningsTab — تبويب الأرباح
 * ═══════════════════════════════════════════════════════════
 * - 3 فترات: اليوم · الأسبوع · الشهر
 * - عمولة + إجمالي + عدد الجلسات + عميلات
 * - ملاحظة توضيحيّة عن حساب العمولة
 */
'use client';

import { Wallet, TrendingUp, Users, Sparkles, Calendar, Award } from 'lucide-react';
import type { StaffEarnings } from '../types';
import { formatPrice } from '@/lib/utils';

export default function StaffEarningsTab({ earnings }: { earnings: StaffEarnings }) {
  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      {/* Header */}
      <div>
        <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mb-1">
          MY EARNINGS
        </div>
        <h1 className="font-ar-display text-2xl font-bold text-gold-deep">
          أرباحي 💰
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          نسبة العمولة: <strong className="font-en-display text-gold-deep">{Math.round(earnings.commission_rate * 100)}%</strong> من قيمة الخدمات
        </p>
      </div>

      {/* اليوم · البطاقة الكبيرة */}
      <div className="relative bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-500/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="editorial-eyebrow text-white/70 mb-1">TODAY</div>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 opacity-80" />
                <span className="font-ar-display font-bold">عمولة اليوم</span>
              </div>
            </div>
            <div className="text-left">
              <div className="text-[10px] opacity-80">نسبة</div>
              <div className="font-en-display font-bold">{Math.round(earnings.commission_rate * 100)}%</div>
            </div>
          </div>

          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-end justify-between gap-3 mb-2">
              <div>
                <div className="font-en-display font-bold text-4xl md:text-5xl leading-none">
                  {formatPrice(earnings.today_commission, { showFrom: false })}
                </div>
              </div>
              <div className="text-left">
                <div className="text-[10px] opacity-80">من</div>
                <div className="font-en-display font-bold text-sm">
                  {formatPrice(earnings.today_total, { showFrom: false })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-[11px] opacity-90 pt-2 border-t border-white/15">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {earnings.today_count} جلسة
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* الأسبوع + الشهر */}
      <div className="grid grid-cols-2 gap-3">
        <PeriodCard
          icon={Calendar}
          label="هذا الأسبوع"
          commission={earnings.week_commission}
          total={earnings.week_total}
          count={earnings.week_count}
          colorFrom="from-amber-500"
          colorTo="to-amber-700"
        />
        <PeriodCard
          icon={Award}
          label="هذا الشهر"
          commission={earnings.month_commission}
          total={earnings.month_total}
          count={earnings.month_count}
          extra={`${earnings.unique_customers} عميلة`}
          colorFrom="from-gold-deep"
          colorTo="to-ink"
        />
      </div>

      {/* ملاحظة توضيحيّة */}
      <div className="bg-gradient-to-br from-gold-light/10 to-cream-50 border border-gold-light/30 rounded-2xl p-4">
        <div className="flex items-start gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-gold-deep shrink-0 mt-0.5" />
          <div>
            <h4 className="font-ar-display font-bold text-gold-deep text-sm">كيف تُحسب عمولتي؟</h4>
          </div>
        </div>
        <ul className="text-[11px] text-ink-soft space-y-1 leading-relaxed pr-6">
          <li>• كل خدمة تؤدّينها = <strong className="text-gold-deep">{Math.round(earnings.commission_rate * 100)}%</strong> من قيمتها لكِ</li>
          <li>• الحجوزات المكتملة تُحتسب تلقائياً</li>
          <li>• الحجوزات الملغيّة أو اللي لم تحضر العميلة لا تُحسب</li>
          <li>• الراتب النهائي يُراجَع من الإدارة ويُعتمد شهرياً</li>
        </ul>
      </div>

      {/* شريط إحصائيات */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <QuickMetric
          icon={TrendingUp}
          label="متوسّط لكل جلسة"
          value={
            earnings.month_count > 0
              ? formatPrice(earnings.month_commission / earnings.month_count, { showFrom: false })
              : '—'
          }
        />
        <QuickMetric
          icon={Users}
          label="عميلاتي"
          value={`${earnings.unique_customers}`}
          sub="هذا الشهر"
        />
        <QuickMetric
          icon={Sparkles}
          label="جلسات مكتملة"
          value={`${earnings.month_count}`}
          sub="هذا الشهر"
        />
      </div>
    </div>
  );
}

function PeriodCard({
  icon: Icon, label, commission, total, count, extra, colorFrom, colorTo,
}: {
  icon: typeof Wallet;
  label: string;
  commission: number;
  total: number;
  count: number;
  extra?: string;
  colorFrom: string;
  colorTo: string;
}) {
  return (
    <div className={`rounded-2xl p-4 bg-gradient-to-br ${colorFrom} ${colorTo} text-white shadow-md`}>
      <div className="flex items-center gap-1.5 text-[10px] opacity-80 mb-1">
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
      <div className="font-en-display font-bold text-xl leading-none mb-1">
        {formatPrice(commission, { showFrom: false })}
      </div>
      <div className="text-[10px] opacity-70">
        من {formatPrice(total, { showFrom: false })}
      </div>
      <div className="text-[10px] opacity-80 flex items-center gap-1 mt-2 pt-2 border-t border-white/15 flex-wrap">
        <span>{count} جلسة</span>
        {extra && <><span className="opacity-40">·</span><span>{extra}</span></>}
      </div>
    </div>
  );
}

function QuickMetric({
  icon: Icon, label, value, sub,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-cream-200 rounded-xl p-3">
      <Icon className="w-4 h-4 text-gold-deep mx-auto mb-1" />
      <div className="text-[10px] text-ink-soft mb-0.5">{label}</div>
      <div className="font-en-display font-bold text-sm text-ink">{value}</div>
      {sub && <div className="text-[9px] text-ink-soft mt-0.5">{sub}</div>}
    </div>
  );
}
