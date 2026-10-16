import { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  label: string;
  value: string;
  color?: 'gold' | 'success' | 'danger';
  trend?: { value: number; isUp: boolean };
}

export default function StatCard({ icon: Icon, label, value, color = 'gold', trend }: Props) {
  const colors = {
    gold:    { bg: 'bg-gold-light/10',  text: 'text-gold-deep',  border: 'border-gold-light' },
    success: { bg: 'bg-success/10',     text: 'text-success',    border: 'border-success/40' },
    danger:  { bg: 'bg-danger/10',      text: 'text-danger',     border: 'border-danger/40' },
  }[color];

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-cream-200 relative overflow-hidden">
      {/* الخط العلوي الملوّن */}
      <div className={`absolute top-0 inset-x-0 h-1 ${color === 'gold' ? 'bg-gold-gradient' : 'bg-success'}`} />

      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-ink-soft font-semibold">{label}</p>
          <p className={`font-en-display text-3xl font-bold ${colors.text} mt-2`}>{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${trend.isUp ? 'text-success' : 'text-danger'}`}>
              {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}% عن الشهر الماضي
            </p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
