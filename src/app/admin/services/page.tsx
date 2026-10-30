/**
 * Admin — إدارة الخدمات
 * ═══════════════════════════════════════════════════════════
 * - عرض كل الفئات والخدمات
 * - إضافة/تعديل/حذف/تفعيل عبر ServicesManager (Client Component)
 */
import { createClient } from '@/lib/supabase/server';
import ServicesManager from '@/components/admin/ServicesManager';

export const dynamic = 'force-dynamic';

export default async function ServicesAdminPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: services }] = await Promise.all([
    supabase.from('categories').select('*').order('display_order'),
    supabase.from('services').select('*').order('display_order'),
  ]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">الخدمات</h1>
        <p className="text-ink-soft text-sm mt-1">
          {services?.length || 0} خدمة في {categories?.length || 0} فئة · اضغطي ✏️ للتعديل، أو زر "إضافة" في كل فئة
        </p>
      </div>

      <ServicesManager categories={categories || []} services={services || []} />
    </div>
  );
}
