/**
 * Admin — إدارة المعرض
 */
import { createClient } from '@/lib/supabase/server';
import GalleryManager from '@/components/admin/GalleryManager';

export const dynamic = 'force-dynamic';

export default async function GalleryAdminPage() {
  const supabase = await createClient();
  const { data: items } = await supabase.from('gallery').select('*').order('display_order');

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">المعرض</h1>
        <p className="text-ink-soft text-sm mt-1">
          {items?.length || 0} صورة · اضغطي ⭐ للتمييز أو 🗑 للحذف
        </p>
      </div>

      <GalleryManager items={items || []} />
    </div>
  );
}
