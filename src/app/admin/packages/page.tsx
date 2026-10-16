/**
 * Admin — إدارة البكجات (CRUD كامل + ربط خدمات)
 */
import { createClient } from '@/lib/supabase/server';
import PackagesManager from '@/components/admin/PackagesManager';

export const dynamic = 'force-dynamic';

export default async function PackagesAdminPage() {
  const supabase = await createClient();
  const [{ data: packages }, { data: categories }, { data: services }] = await Promise.all([
    supabase.from('packages').select('*').order('display_order'),
    supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
    supabase.from('services').select('*').eq('is_active', true).order('display_order'),
  ]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">البكجات</h1>
      </div>
      <PackagesManager
        packages={packages || []}
        categories={categories || []}
        services={services || []}
      />
    </div>
  );
}
