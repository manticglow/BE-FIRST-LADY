/**
 * KenBurns — غلاف صورة بزوم بطيء جداً
 * لـHero وأهم الصور
 */
import { type ReactNode } from 'react';

export default function KenBurns({
  children, className = '',
}: {
  children: ReactNode; className?: string;
}) {
  return (
    <div className={`ken-burns ${className}`} style={{ willChange: 'transform' }}>
      {children}
    </div>
  );
}
