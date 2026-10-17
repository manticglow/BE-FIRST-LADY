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
    <div className="bg-white dark:bg-white/5 rounded-2xl p-4 md:p-5 shadow-sm border border-cream-200 dark:border-white/10 relative overflow-hidden">
      {/* الخط العلوي الملوّن */}
      <div className={`absolute top-0 inset-x-0 h-1 ${color === 'gold' ? 'bg-gold-gradient' : 'bg-success'}`} />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] md:text-xs text-ink-soft dark:text-cream-100/60 font-semibold truncate">{label}</p>
          <p className={`font-en-display text-xl md:text-3xl font-bold ${colors.text} mt-1 md:mt-2 truncate`}>{value}</p>
          {trend && (
            <p className={`text-[10px] md:text-xs mt-1 ${trend.isUp ? 'text-success' : 'text-danger'}`}>
              {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
            </p>
          )}
        </div>
        <div className={`w-9 h-9 md:w-11 md:h-11 rounded-full ${colors.bg} ${colors.text} flex items-center justify-center shrink-0`}>
          <Icon className="w-4 h-4 md:w-5 md:h-5" />
        </div>
      </div>
    </div>
  );
}
