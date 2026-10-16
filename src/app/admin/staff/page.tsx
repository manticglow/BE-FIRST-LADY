/**
 * Admin — إدارة الموظفات (مع خدماتهن وجدولهن)
 */
import { createClient } from '@/lib/supabase/server';
import StaffManager from '@/components/admin/StaffManager';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const supabase = await createClient();
  const [{ data: staff }, { data: categories }, { data: services }] = await Promise.all([
    supabase.from('staff').select('*').order('display_order'),
    supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
    supabase.from('services').select('*').eq('is_active', true).order('display_order'),
  ]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">الموظفات</h1>
        <p className="text-ink-soft text-sm mt-1">
          {staff?.length || 0} موظفة · لكل وحدة: خدمات + جدول دوام
        </p>
      </div>
      <StaffManager
        staff={staff || []}
        categories={categories || []}
        services={services || []}
      />
    </div>
  );
}
