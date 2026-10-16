/**
 * Admin Dashboard — الصفحة الرئيسية للوحة التحكم
 * ═══════════════════════════════════════════════════════════
 * تعرض:
 *   - إحصائيات اليوم (الحجوزات، الإيرادات، العميلات)
 *   - الحجوزات القادمة
 *   - أعلى الخدمات مبيعاً
 */
import { createClient } from '@/lib/supabase/server';
import StatCard from '@/components/admin/StatCard';
import RecentBookings from '@/components/admin/RecentBookings';
import RevenueChart from '@/components/admin/RevenueChart';
import StaffDashboard from '@/components/admin/StaffDashboard';
import { CalendarCheck, DollarSign, Users, TrendingUp } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  const monthStart = new Date();
  monthStart.setDate(1);
  const monthStartStr = monthStart.toISOString().split('T')[0];

  // المستخدمة الحالية
  const { data: { user } } = await supabase.auth.getUser();
  const { data: me } = user
    ? await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
    : { data: null };
  const myFirstName = me?.full_name?.split(' ')[0] || 'عزيزتي';
  const roleLabel = me?.role === 'owner' ? 'المالكة' : me?.role === 'manager' ? 'المديرة' : 'الموظفة';

  // الموظفة تحصل على لوحة مُركّزة خاصة بها
  if (me?.role === 'staff' && user) {
    return <StaffDashboard userId={user.id} firstName={myFirstName} />;
  }

  // ═══ جلب الإحصائيات بالتوازي ═══
  const [
    { count: todayBookings },
    { data: todayRevenue },
    { count: totalCustomers },
    { count: pendingBookings },
    { data: monthRevenue },
    { data: upcomingBookings },
  ] = await Promise.all([
    // حجوزات اليوم
    supabase.from('bookings').select('id', { count: 'exact', head: true })
      .eq('booking_date', today),
    // إيرادات اليوم (مدفوعة)
    supabase.from('bookings').select('total')
      .eq('booking_date', today).eq('payment_status', 'paid'),
    // إجمالي العميلات
    supabase.from('profiles').select('id', { count: 'exact', head: true })
      .eq('role', 'customer'),
    // الحجوزات المعلّقة
    supabase.from('bookings').select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    // إيرادات الشهر (للرسم البياني)
    supabase.from('bookings').select('booking_date, total')
      .gte('booking_date', monthStartStr).eq('payment_status', 'paid'),
    // الحجوزات القادمة
    supabase.from('bookings').select('*, items:booking_items(*)')
      .gte('booking_date', today).neq('status', 'cancelled')
      .order('booking_date').order('booking_time').limit(5),
  ]);

  const todayTotal = (todayRevenue || []).reduce((sum, b) => sum + Number(b.total), 0);
  const monthTotal = (monthRevenue || []).reduce((sum, b) => sum + Number(b.total), 0);

  return (
    <div className="p-6 md:p-8">
      {/* الترحيب */}
      <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-ar-display text-3xl font-bold text-gold-deep">
            أهلاً، {myFirstName} 🌸
          </h1>
          <p className="text-ink-soft mt-1">
            <span className="text-gold-deep font-bold">{roleLabel}</span> · {new Intl.DateTimeFormat('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}
          </p>
        </div>
        <a
          href="/account/attendance"
          className="inline-flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-xl border border-success/30 text-sm font-bold hover:bg-success/20"
        >
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          تسجيل حضور/انصراف
        </a>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={CalendarCheck}
          label="حجوزات اليوم"
          value={String(todayBookings || 0)}
          color="gold"
        />
        <StatCard
          icon={DollarSign}
          label="إيرادات اليوم"
          value={formatPrice(todayTotal)}
          color="success"
        />
        <StatCard
          icon={Users}
          label="إجمالي العميلات"
          value={String(totalCustomers || 0)}
          color="gold"
        />
        <StatCard
          icon={TrendingUp}
          label="إيرادات الشهر"
          value={formatPrice(monthTotal)}
          color="success"
        />
      </div>

      {/* الحجوزات المعلّقة */}
      {pendingBookings! > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div>
            <div className="font-bold text-warning">⚠ عندك {pendingBookings} حجز معلّق</div>
            <div className="text-xs text-ink-soft mt-1">يحتاج تأكيد منك</div>
          </div>
          <a href="/admin/bookings?status=pending" className="btn-primary text-sm !py-2">
            عرض الآن
          </a>
        </div>
      )}

      {/* الرسم البياني + الحجوزات */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-ar-display text-lg font-bold text-gold-deep mb-4">
            إيرادات الشهر
          </h3>
          <RevenueChart data={monthRevenue || []} />
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="font-ar-display text-lg font-bold text-gold-deep mb-4">
            الحجوزات القادمة
          </h3>
          <RecentBookings bookings={upcomingBookings || []} />
        </div>
      </div>
    </div>
  );
}
