/**
 * GET /api/admin/notifications
 * - آخر الحجوزات الجديدة + طلبات إجازة معلّقة + تقييمات بانتظار
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ notifications: [] });

  const dayAgo = new Date();
  dayAgo.setDate(dayAgo.getDate() - 1);
  const dayAgoStr = dayAgo.toISOString();

  const [
    { data: pendingBookings },
    { data: pendingLeaves },
    { data: pendingReviews },
    { data: openAttendance },
  ] = await Promise.all([
    supabase.from('bookings').select('id, customer_name, booking_date, booking_time, created_at, is_gift').eq('status', 'pending').gte('created_at', dayAgoStr).order('created_at', { ascending: false }).limit(10),
    supabase.from('leave_requests').select('id, user_id, leave_type, start_date, created_at, user:profiles!leave_requests_user_id_fkey(full_name)').eq('status', 'pending').order('created_at', { ascending: false }).limit(10),
    supabase.from('reviews').select('id, customer_name, rating, created_at').eq('is_approved', false).order('created_at', { ascending: false }).limit(10),
    supabase.from('attendance_records').select('id, user_id, check_in_at, user:profiles!attendance_records_user_id_fkey(full_name)').is('check_out_at', null).order('check_in_at', { ascending: false }).limit(10),
  ]);

  const notifications = [
    ...(pendingBookings || []).map((b) => ({
      id: `b-${b.id}`,
      type: 'booking',
      icon: '📅',
      title: `حجز جديد — ${b.customer_name}${b.is_gift ? ' 🎁' : ''}`,
      subtitle: `${b.booking_date} الساعة ${b.booking_time.slice(0, 5)}`,
      href: '/admin/bookings?status=pending',
      time: b.created_at,
    })),
    ...(pendingLeaves || []).map((l: any) => ({
      id: `l-${l.id}`,
      type: 'leave',
      icon: '🏖',
      title: `طلب إجازة — ${l.user?.full_name || 'موظفة'}`,
      subtitle: `${l.leave_type} · من ${l.start_date}`,
      href: '/admin/leaves',
      time: l.created_at,
    })),
    ...(pendingReviews || []).map((r) => ({
      id: `r-${r.id}`,
      type: 'review',
      icon: '⭐',
      title: `تقييم جديد — ${r.customer_name}`,
      subtitle: `${r.rating} نجوم · بانتظار الاعتماد`,
      href: '/admin/reviews',
      time: r.created_at,
    })),
    ...(openAttendance || []).map((a: any) => ({
      id: `a-${a.id}`,
      type: 'attendance',
      icon: '⏱',
      title: `${a.user?.full_name || 'موظفة'} في العمل`,
      subtitle: `دخلت ${new Date(a.check_in_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
      href: '/admin/attendance',
      time: a.check_in_at,
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return NextResponse.json({
    notifications: notifications.slice(0, 20),
    count: notifications.length,
  });
}
