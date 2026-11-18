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
        <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light uppercase mb-1">
          People · Staff
        </div>
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">
          الموظّفات
        </h1>
        <div className="w-10 h-[1px] bg-gold-deep/40 mt-3 mb-3" />
        <p className="text-ink-soft text-sm">
          <span className="font-en-display font-bold text-gold-deep tabular-nums">
            {staff?.length || 0}
          </span>
          {' '}موظّفة · لكل منهنّ خدماتها وجدول دوامها
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
