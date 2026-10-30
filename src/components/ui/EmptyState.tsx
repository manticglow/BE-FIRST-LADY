/**
 * EmptyState — حالة فاضية بتصميم فاخر
 * ═══════════════════════════════════════════════════════════
 * بدل الشاشات الفاضية البيضاء · أعطيها شخصية
 */
'use client';

import Link from 'next/link';
import { type LucideIcon } from 'lucide-react';

interface Action {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
}

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  actions?: Action[];
  variant?: 'default' | 'inline' | 'compact';
  iconColor?: 'gold' | 'rose' | 'emerald' | 'violet' | 'sky';
}

const COLORS = {
  gold:    { bg: 'bg-gradient-to-br from-gold-light/15 to-cream-100', text: 'text-gold-deep' },
  rose:    { bg: 'bg-gradient-to-br from-rose-50 to-pink-50',           text: 'text-rose-500' },
  emerald: { bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',        text: 'text-emerald-600' },
  violet:  { bg: 'bg-gradient-to-br from-violet-50 to-purple-50',       text: 'text-violet-500' },
  sky:     { bg: 'bg-gradient-to-br from-sky-50 to-blue-50',            text: 'text-sky-500' },
};

export default function EmptyState({
  icon: Icon, title, description, actions = [],
  variant = 'default', iconColor = 'gold',
}: Props) {
  const color = COLORS[iconColor];
  const padding = variant === 'compact' ? 'p-6' : variant === 'inline' ? 'p-4' : 'p-10';
  const iconSize = variant === 'compact' ? 'w-14 h-14' : variant === 'inline' ? 'w-10 h-10' : 'w-20 h-20';
  const iconInner = variant === 'compact' ? 'w-7 h-7' : variant === 'inline' ? 'w-5 h-5' : 'w-10 h-10';
  const titleSize = variant === 'compact' ? 'text-base' : variant === 'inline' ? 'text-sm' : 'text-xl';

  return (
    <div className={`bg-white rounded-3xl border border-cream-200 ${padding} text-center shadow-sm`}>
      <div className={`${iconSize} rounded-full ${color.bg} mx-auto flex items-center justify-center mb-4`}>
        <Icon className={`${iconInner} ${color.text}`} />
      </div>

      <h3 className={`font-ar-display font-bold text-ink mb-2 ${titleSize}`}>
        {title}
      </h3>

      {description && (
        <p className="text-sm text-ink-soft leading-relaxed max-w-sm mx-auto mb-6">
          {description}
        </p>
      )}

      {actions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
          {actions.map((action, i) => {
            const classes = action.variant === 'ghost'
              ? 'bg-cream-50 text-gold-deep border border-gold-light/40 hover:bg-gold-light/10'
              : 'bg-gradient-to-br from-gold-deep to-ink text-cream-50 hover:scale-[1.02]';

            if (action.href) {
              return (
                <Link
                  key={i}
                  href={action.href}
                  className={`${classes} font-bold py-3 px-6 rounded-xl transition-all flex-1 text-sm`}
                >
                  {action.label}
                </Link>
              );
            }
            return (
              <button
                key={i}
                onClick={action.onClick}
                className={`${classes} font-bold py-3 px-6 rounded-xl transition-all flex-1 text-sm`}
              >
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
