/**
 * /admin/backup — إدارة النسخ الاحتياطيّة
 */
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import BackupManager from '@/components/admin/BackupManager';

export const dynamic = 'force-dynamic';

export default async function BackupPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/backup');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if ((profile as { role: string } | null)?.role !== 'owner') redirect('/admin');

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mb-1">
          CLOUD BACKUP
        </div>
        <h1 className="font-ar-display text-2xl md:text-4xl font-bold text-gold-deep">
          النسخ الاحتياطيّة السحابيّة
        </h1>
        <p className="text-ink-soft text-sm mt-1.5">
          احفظي نسخ من بياناتكِ تلقائياً على Google Drive أو OneDrive · يوميّاً · أسبوعياً · أو شهريّاً
        </p>
      </div>

      <BackupManager />
    </div>
  );
}
