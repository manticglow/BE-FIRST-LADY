/**
 * Reveal — غلاف يُظهر العنصر عند السكرول
 * ═══════════════════════════════════════════════════════════
 * الاستخدام:
 *   <Reveal> <div>محتوى</div> </Reveal>
 *   <Reveal direction="up" delay={100}>...</Reveal>
 */
'use client';

import { type ReactNode } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface Props {
  children: ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade';
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'span';
}

export default function Reveal({
  children, direction = 'up', delay = 0, className = '', as = 'div',
}: Props) {
  const ref = useScrollReveal<HTMLDivElement>();
  const Tag = as as any;

  return (
    <Tag
      ref={ref}
      className={`reveal reveal-${direction} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}
