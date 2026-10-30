/**
 * Skeleton — عناصر تحميل بديلة أنيقة
 * ═══════════════════════════════════════════════════════════
 * تستخدم بدل الـspinners لتجربة أنعم ومحترفة
 */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rounded' | 'circle' | 'card';
  lines?: number;
}

export default function Skeleton({ className = '', variant = 'rounded', lines = 1 }: SkeletonProps) {
  const base = 'animate-pulse bg-gradient-to-r from-cream-100 via-cream-200/60 to-cream-100 bg-[length:200%_100%]';
  const style = { animation: 'shimmer 1.8s ease-in-out infinite' };

  if (variant === 'text') {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${base} h-3 rounded`}
            style={{ ...style, width: i === lines - 1 ? '60%' : '100%' }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return <div className={`${base} rounded-full ${className}`} style={style} />;
  }

  if (variant === 'card') {
    return (
      <div className={`${base} rounded-2xl aspect-[4/3] ${className}`} style={style} />
    );
  }

  return <div className={`${base} rounded-xl ${className}`} style={style} />;
}

export function ServiceCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-cream-200 shadow-sm">
      <Skeleton variant="card" />
      <div className="p-4">
        <Skeleton variant="text" lines={2} />
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-cream-100">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-10 w-full mt-3" />
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-cream-200 shadow-sm">
      <Skeleton className="h-8 w-8 mb-2" variant="rounded" />
      <Skeleton className="h-3 w-20 mb-1" />
      <Skeleton className="h-6 w-24" />
    </div>
  );
}

export function BookingRowSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-cream-200 shadow-sm">
      <div className="flex items-start gap-3">
        <Skeleton variant="circle" className="w-12 h-12 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
