/**
 * Cart Page — صفحة السلة · تجربة متجر إلكتروني
 * ═══════════════════════════════════════════════════════════
 * - تعرض الخدمات المختارة مع صور وأسعار
 * - إمكانية حذف خدمة
 * - الإجمالي والمدة
 * - زر "اختيار الموعد وتأكيد الحجز" → يروح /booking
 */
import { createClient } from '@/lib/supabase/server';
import CartClient from '@/components/cart/CartClient';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const supabase = await createClient();
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  return <CartClient services={services || []} />;
}
