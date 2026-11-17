/**
 * /admin/analytics — لوحة تحليلات متقدّمة للمالكة
 */
'use client';

import { useState, useEffect } from 'react';
import { Loader2, TrendingUp, TrendingDown, Users, DollarSign, Receipt, Award, Clock, UserX, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?period=${period}`)
      .then((r) => r.json())
      .then((d) => d.ok && setData(d))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading || !data) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold-deep" /></div>;
  }

  const { kpis, topCustomers, serviceRevenue, staffPerformance, monthlyRevenue, lostCustomers } = data;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-ar-display text-3xl font-bold text-gold-deep flex items-center gap-2">
            <BarChart3 className="w-7 h-7" />
            لوحة التحليلات
          </h1>
          <p className="text-ink-soft text-sm mt-1">ذكاء الأعمال · القرارات المبنيّة على الأرقام</p>
        </div>

        {/* Period selector */}
        <div className="inline-flex bg-white rounded-xl border border-cream-200 p-1">
          {(['7d', '30d', '90d'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${period === p ? 'bg-gold-deep text-white' : 'text-ink-soft hover:bg-cream-50'}`}
            >
              {p === '7d' ? 'أسبوع' : p === '30d' ? '30 يوم' : '3 شهور'}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={DollarSign}
          title="الإيراد"
          value={`${kpis.revenue.current.toLocaleString('ar-SA')} ريال`}
          growth={kpis.revenue.growth}
        />
        <KpiCard
          icon={Receipt}
          title="الحجوزات"
          value={kpis.bookings.current}
          growth={kpis.bookings.previous > 0 ? ((kpis.bookings.current - kpis.bookings.previous) / kpis.bookings.previous) * 100 : 0}
        />
        <KpiCard
          icon={Users}
          title="عميلات مختلفات"
          value={kpis.customers.current}
          growth={kpis.customers.previous > 0 ? ((kpis.customers.current - kpis.customers.previous) / kpis.customers.previous) * 100 : 0}
        />
        <KpiCard
          icon={Award}
          title="متوسّط الفاتورة"
          value={`${kpis.avgTicket.current.toFixed(0)} ريال`}
          growth={kpis.avgTicket.previous > 0 ? ((kpis.avgTicket.current - kpis.avgTicket.previous) / kpis.avgTicket.previous) * 100 : 0}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* أفضل العملاء */}
        <Card title="أعلى العميلات إنفاقاً" icon={Award}>
          <ul className="divide-y divide-cream-100">
            {topCustomers.slice(0, 7).map((c: any, i: number) => (
              <li key={c.id} className="py-2.5 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-light/30 to-cream-100 flex items-center justify-center text-xs font-bold text-gold-deep shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-ink truncate">{c.full_name || c.phone}</div>
                  <div className="text-[10px] text-ink-soft">{c.total_bookings} زيارة · {c.loyalty_tier}</div>
                </div>
                <div className="font-en-display text-sm font-bold text-gold-deep shrink-0">
                  {Number(c.total_spent).toLocaleString('ar-SA')}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* أفضل الخدمات */}
        <Card title="الخدمات الأكثر ربحيّة" icon={TrendingUp}>
          <ul className="divide-y divide-cream-100">
            {serviceRevenue.slice(0, 7).map((s: any, i: number) => (
              <li key={s.service_id} className="py-2.5 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-100 to-cream-100 flex items-center justify-center text-xs font-bold text-rose-700 shrink-0">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-ink truncate">{s.name_ar}</div>
                  <div className="text-[10px] text-ink-soft">{s.times_booked} حجز · متوسّط {Number(s.avg_price).toFixed(0)} ريال</div>
                </div>
                <div className="font-en-display text-sm font-bold text-emerald-700 shrink-0">
                  {Number(s.total_revenue).toLocaleString('ar-SA')}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* أداء الموظّفات */}
        <Card title="أداء الموظّفات" icon={Users}>
          <ul className="divide-y divide-cream-100">
            {staffPerformance.slice(0, 7).map((st: any) => (
              <li key={st.id} className="py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-ink">{st.name}</span>
                  <span className="text-[10px] text-ink-soft">· {st.job_title}</span>
                </div>
                <div className="flex items-center gap-4 text-[10px] text-ink-soft">
                  <span>{st.total_bookings} حجز</span>
                  <span className="font-en-display font-bold text-gold-deep">
                    {Number(st.total_revenue).toLocaleString('ar-SA')} ريال
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        {/* العميلات المفقودات */}
        <Card title="عميلات لم يعدن · فرصة لحملة" icon={UserX}>
          <ul className="divide-y divide-cream-100">
            {lostCustomers.slice(0, 7).map((c: any) => (
              <li key={c.id} className="py-2.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-ink truncate">{c.full_name || c.phone}</div>
                  <div className="text-[10px] text-ink-soft">
                    آخر زيارة قبل {Number(c.days_since)} يوم · {c.total_visits} زيارة سابقة
                  </div>
                </div>
                <div className="font-en-display text-xs font-bold text-amber-700 shrink-0">
                  {Number(c.lifetime_value).toLocaleString('ar-SA')}
                </div>
              </li>
            ))}
          </ul>
          <a href="/admin/campaigns" className="block mt-3 text-center text-xs font-bold text-gold-deep hover:underline">
            → أرسلي لهنّ حملة ترويجيّة
          </a>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, title, value, growth }: { icon: any; title: string; value: string | number; growth: number }) {
  const isPos = growth >= 0;
  return (
    <div className="bg-white rounded-3xl p-5 border border-cream-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 text-gold-deep" />
        <span className={`text-[10px] font-bold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${isPos ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {isPos ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
          {Math.abs(growth).toFixed(0)}%
        </span>
      </div>
      <div className="text-[11px] text-ink-soft mb-1">{title}</div>
      <div className="font-en-display text-xl font-bold text-ink">{value}</div>
    </div>
  );
}

function Card({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-cream-200 shadow-sm">
      <h3 className="font-ar-display text-lg font-bold text-gold-deep flex items-center gap-2 mb-3">
        <Icon className="w-5 h-5" />
        {title}
      </h3>
      {children}
    </div>
  );
}
