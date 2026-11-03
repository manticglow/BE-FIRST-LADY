/**
 * GET /api/account/my-ratings
 * - تقييمات العميلات لي كموظّفة
 * - متوسّط النجوم + العدد + آخر 20 تقييم
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  customer_name: string;
  is_approved: boolean;
  created_at: string;
  booking_id: string | null;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  // staff record
  const { data: staffRaw } = await supabase
    .from('staff')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle();
  const staffId = (staffRaw as { id: string } | null)?.id;

  if (!staffId) {
    return NextResponse.json({
      ok: true,
      average: 0,
      total: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      items: [],
    });
  }

  // جلب الحجوزات اللي اشتغلتُ عليها
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id')
    .eq('staff_id', staffId);
  const bookingIds = (bookings as { id: string }[] | null)?.map((b) => b.id) || [];

  if (bookingIds.length === 0) {
    return NextResponse.json({
      ok: true,
      average: 0,
      total: 0,
      distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      items: [],
    });
  }

  // جلب التقييمات (المعتمدة فقط)
  const { data: reviewsRaw } = await supabase
    .from('reviews')
    .select('id, rating, comment, customer_name, is_approved, created_at, booking_id')
    .in('booking_id', bookingIds)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(30);

  const reviews = (reviewsRaw as ReviewRow[] | null) || [];
  const total = reviews.length;
  const sum = reviews.reduce((s, r) => s + r.rating, 0);
  const average = total > 0 ? Math.round((sum / total) * 10) / 10 : 0;

  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      distribution[Math.round(r.rating)]++;
    }
  });

  return NextResponse.json({
    ok: true,
    average,
    total,
    distribution,
    items: reviews.slice(0, 20),
  });
}
