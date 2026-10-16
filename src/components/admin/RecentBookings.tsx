import Link from 'next/link';
import { Clock } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import type { Booking } from '@/types/database';

const STATUS_STYLES = {
  pending:     { label: 'معلّق',    class: 'bg-warning/15 text-warning' },
  confirmed:   { label: 'مؤكّد',    class: 'bg-success/15 text-success' },
  in_progress: { label: 'جاري',     class: 'bg-blue-100 text-blue-700' },
  completed:   { label: 'مكتمل',    class: 'bg-cream-200 text-ink-soft' },
  cancelled:   { label: 'ملغي',     class: 'bg-danger/15 text-danger' },
  no_show:     { label: 'لم تحضر',  class: 'bg-danger/15 text-danger' },
};

export default function RecentBookings({ bookings }: { bookings: Booking[] }) {
  if (!bookings.length) {
    return (
      <div className="text-center py-8 text-ink-soft text-sm">
        ما فيه حجوزات قادمة
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {bookings.map((b) => {
        const status = STATUS_STYLES[b.status] || STATUS_STYLES.pending;
        return (
          <li key={b.id} className="border border-cream-200 rounded-xl p-3 hover:bg-cream-50 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-ink truncate">{b.customer_name}</div>
                <div className="inline-flex items-center gap-1 text-xs text-ink-soft mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{b.booking_date} · {b.booking_time.slice(0, 5)}</span>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.class}`}>
                {status.label}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-cream-200">
              <span className="text-xs text-ink-soft">
                {b.items?.length || 0} خدمة
              </span>
              <span className="font-en-display font-bold text-gold-deep">
                {formatPrice(b.total)}
              </span>
            </div>
          </li>
        );
      })}
      <li>
        <Link href="/admin/bookings" className="block text-center text-xs font-semibold text-gold-deep hover:text-gold py-2">
          عرض كل الحجوزات ←
        </Link>
      </li>
    </ul>
  );
}
