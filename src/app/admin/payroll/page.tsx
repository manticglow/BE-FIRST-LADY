/**
 * Admin — الرواتب
 */
import PayrollManager from '@/components/admin/PayrollManager';

export const dynamic = 'force-dynamic';

export default function PayrollPage() {
  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">الرواتب</h1>
        <p className="text-ink-soft text-sm mt-1">
          يحسبها النظام تلقائياً من ساعات الحضور · حدّدي سعر الساعة أو الراتب الشهري لكل موظفة من <strong>اليوزرات</strong>
        </p>
      </div>
      <PayrollManager />
    </div>
  );
}
