/**
 * Admin — إدارة المخزون
 */
import { createClient } from '@/lib/supabase/server';
import InventoryManager from '@/components/admin/InventoryManager';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const supabase = await createClient();
  const { data: items } = await supabase.from('inventory_items').select('*').order('created_at', { ascending: false });

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">المخزون</h1>
        <p className="text-ink-soft text-sm mt-1">المنتجات التي تبيعينها (شامبو، كريمات، أدوات...)</p>
      </div>
      <InventoryManager items={items || []} />
    </div>
  );
}
