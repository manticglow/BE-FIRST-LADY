/**
 * Admin Reminders — إرسال تذكيرات الموعد
 * ═══════════════════════════════════════════════════════════
 * - يعرض كل الحجوزات المؤكّدة في اليومين الجايين
 * - زر واتساب لكل حجز (رسالة تذكير جاهزة)
 * - زر "أرسلي الكل" يفتح واتساب لكل العميلات بتوقيت متباعد
 */
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import RemindersClient from '@/components/admin/RemindersClient';

export const dynamic = 'force-dynamic';

export default async function RemindersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/reminders');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    redirect('/admin');
  }

  // اليوم وبكرا وبعده
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select('*, items:booking_items(service_name)')
    .in('booking_date', [today, tomorrow, dayAfter])
    .eq('status', 'confirmed')
    .order('booking_date', { ascending: true })
    .order('booking_time', { ascending: true });

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">
          🔔 تذكيرات الموعد
        </h1>
        <p className="text-ink-soft mt-1 text-sm">
          أرسلي تذكير واتساب للعميلات قبل مواعيدهن
        </p>
      </div>

      <RemindersClient
        bookings={upcomingBookings || []}
        today={today}
        tomorrow={tomorrow}
        dayAfter={dayAfter}
      />
    </div>
  );
}
