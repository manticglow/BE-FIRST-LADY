/**
 * Admin — إدارة الكوبونات
 */
import { createClient } from '@/lib/supabase/server';
import CouponsManager from '@/components/admin/CouponsManager';

export const dynamic = 'force-dynamic';

export default async function CouponsPage() {
  const supabase = await createClient();
  const { data: coupons } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">الكوبونات</h1>
        <p className="text-ink-soft text-sm mt-1">
          كوبونات الخصم للعميلات
        </p>
      </div>
      <CouponsManager coupons={coupons || []} />
    </div>
  );
}
