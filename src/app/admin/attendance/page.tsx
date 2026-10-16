/**
 * Admin — متابعة الحضور والانصراف
 */
import { createClient } from '@/lib/supabase/server';
import AttendanceDashboard from '@/components/admin/AttendanceDashboard';

export const dynamic = 'force-dynamic';

export default async function AttendanceAdminPage() {
  const supabase = await createClient();
  const { data: location } = await supabase
    .from('salon_locations')
    .select('*')
    .eq('is_active', true)
    .single();

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">الحضور والانصراف</h1>
        <p className="text-ink-soft text-sm mt-1">
          متابعة حضور الموظفات + تحديد نطاق الموقع
        </p>
      </div>
      <AttendanceDashboard initialLocation={location} />
    </div>
  );
}
