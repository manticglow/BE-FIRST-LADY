'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function RevenueChart({ data }: { data: { booking_date: string; total: number }[] }) {
  // تجميع الإيرادات حسب التاريخ
  const chartData = useMemo(() => {
    const byDate: Record<string, number> = {};
    data.forEach((b) => {
      byDate[b.booking_date] = (byDate[b.booking_date] || 0) + Number(b.total);
    });
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({
        date: new Date(date).getDate().toString(),
        total
      }));
  }, [data]);

  if (chartData.length === 0) {
    return <div className="h-64 flex items-center justify-center text-ink-soft text-sm">لا توجد بيانات بعد</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c9a96e" stopOpacity={0.5} />
            <stop offset="100%" stopColor="#c9a96e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ece1cc" vertical={false} />
        <XAxis dataKey="date" stroke="#6b5a42" tick={{ fontSize: 11 }} tickLine={false} />
        <YAxis stroke="#6b5a42" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: '#fff',
            border: '1px solid #c9a96e',
            borderRadius: '12px',
            fontFamily: 'Cairo',
            fontSize: '12px',
          }}
          formatter={(value: any) => [`${value} ر.س`, 'الإيرادات']}
          labelFormatter={(label) => `يوم ${label}`}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#7d613b"
          strokeWidth={2.5}
          fill="url(#goldArea)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
