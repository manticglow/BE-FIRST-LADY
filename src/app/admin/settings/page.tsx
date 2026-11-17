/**
 * Admin — الإعدادات
 * ═══════════════════════════════════════════════════════════
 * - بيانات المنشأة · التواصل · السوشيال ميديا · الضريبة
 * - ساعات العمل + أيام العطل
 */
import { createClient } from '@/lib/supabase/server';
import SettingsManager from '@/components/admin/SettingsManager';
import BusinessInfoEditor from '@/components/admin/BusinessInfoEditor';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const supabase = await createClient();
  const [{ data: hours }, { data: blocked }] = await Promise.all([
    supabase.from('hours').select('*'),
    supabase.from('blocked_dates').select('*').order('date', { ascending: false }),
  ]);

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">الإعدادات</h1>
        <p className="text-ink-soft text-sm mt-1">
          بيانات المنشأة · السوشيال ميديا · ساعات العمل · الضريبة والفواتير
        </p>
      </div>

      <div className="space-y-6">
        <BusinessInfoEditor />
        <SettingsManager initialHours={hours || []} initialBlocked={blocked || []} />
      </div>
    </div>
  );
}
