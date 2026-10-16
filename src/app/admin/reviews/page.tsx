/**
 * Admin — إدارة التقييمات
 */
import { createClient } from '@/lib/supabase/server';
import ReviewsModerator from '@/components/admin/ReviewsModerator';

export const dynamic = 'force-dynamic';

export default async function ReviewsAdminPage() {
  const supabase = await createClient();
  const { data: reviews } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">التقييمات</h1>
        <p className="text-ink-soft text-sm mt-1">موافقة ورد ونشر التقييمات</p>
      </div>
      <ReviewsModerator reviews={reviews || []} />
    </div>
  );
}
