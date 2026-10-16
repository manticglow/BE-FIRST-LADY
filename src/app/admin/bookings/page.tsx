/**
 * Admin — إدارة الحجوزات
 * ═══════════════════════════════════════════════════════════
 * - جدول بكل الحجوزات
 * - فلترة حسب الحالة
 * - تحديث الحالة سريعاً
 */
import { createClient } from '@/lib/supabase/server';
import BookingsView from '@/components/admin/BookingsView';

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function AdminBookingsPage({ searchParams }: Props) {
  const { status, search } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from('bookings').select('*, items:booking_items(*)').order('booking_date', { ascending: false });
  if (status) query = query.eq('status', status);
  if (search) query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%,booking_number.ilike.%${search}%`);

  const { data: bookings } = await query.limit(100);

  const counts: Record<string, number> = {};
  const { data: allStatuses } = await supabase.from('bookings').select('status');
  (allStatuses || []).forEach((b) => {
    counts[b.status] = (counts[b.status] || 0) + 1;
  });

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">
          إدارة الحجوزات
        </h1>
        <p className="text-ink-soft text-sm mt-1">
          {bookings?.length || 0} حجز معروض
        </p>
      </div>

      <BookingsView bookings={bookings || []} counts={counts} activeStatus={status} />
    </div>
  );
}
