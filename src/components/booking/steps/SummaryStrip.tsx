/**
 * SummaryStrip — شريط ملخّص مصغّر
 * عدد الخدمات · المدة الكلّية · السعر
 */
import { formatPrice, formatDuration } from '@/lib/utils';

export default function SummaryStrip({
  subtotal, duration, count,
}: {
  subtotal: number;
  duration: number;
  count: number;
}) {
  return (
    <div className="mt-6 bg-gold-deep/5 border border-gold-light/40 rounded-xl p-3 flex items-center justify-between text-sm">
      <div className="text-ink-soft">
        <span className="font-en-display font-bold text-gold-deep">{count}</span>{' '}
        {count === 1 ? 'خدمة' : 'خدمات'} · {formatDuration(duration)}
      </div>
      <div className="font-en-display font-bold text-gold-deep text-lg">
        {formatPrice(subtotal)}
      </div>
    </div>
  );
}
