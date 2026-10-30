/**
 * SectionHeader — عنوان قسم أنيق
 * ═══════════════════════════════════════════════════════════
 * متناسق في كل الصفحات
 */
import Link from 'next/link';
import { ChevronLeft, type LucideIcon } from 'lucide-react';

interface Props {
  icon?: LucideIcon;
  eyebrow?: string;        // عنوان صغير أعلى العنوان الرئيسي
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    href: string;
  };
  align?: 'start' | 'center';
  size?: 'sm' | 'md' | 'lg';
}

export default function SectionHeader({
  icon: Icon, eyebrow, title, subtitle, action,
  align = 'start', size = 'md',
}: Props) {
  const titleSize = {
    sm: 'text-lg md:text-xl',
    md: 'text-xl md:text-2xl',
    lg: 'text-2xl md:text-3xl',
  }[size];

  const alignClass = align === 'center' ? 'text-center' : 'text-right';

  return (
    <div className={`flex items-end justify-between mb-5 gap-4 ${align === 'center' ? 'justify-center' : ''}`}>
      <div className={`flex-1 ${alignClass}`}>
        {eyebrow && (
          <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mb-1 uppercase">
            {eyebrow}
          </div>
        )}
        <div className={`flex items-center gap-2.5 ${align === 'center' ? 'justify-center' : ''}`}>
          {Icon && (
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-light/15 to-cream-100 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-gold-deep" />
            </span>
          )}
          <div>
            <h2 className={`font-ar-display font-bold text-gold-deep ${titleSize} leading-tight`}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-ink-soft mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
      </div>

      {action && (
        <Link
          href={action.href}
          className="text-xs text-gold-deep hover:text-ink font-bold flex items-center gap-1 shrink-0 pb-1 transition-colors"
        >
          {action.label}
          <ChevronLeft className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
