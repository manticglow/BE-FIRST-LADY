/**
 * GlassCard — كرت زجاجي (glass morphism)
 * الاستخدام:
 *   <GlassCard className="p-5 rounded-2xl">...</GlassCard>
 *   <GlassCard dark className="p-5">...</GlassCard>
 */
import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  dark?: boolean;
  className?: string;
}

export default function GlassCard({ children, dark = false, className = '' }: Props) {
  return (
    <div className={`${dark ? 'glass-card-dark' : 'glass-card'} ${className}`}>
      {children}
    </div>
  );
}
