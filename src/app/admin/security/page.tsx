/**
 * /admin/security — صفحة الأمن والمراقبة
 * ═══════════════════════════════════════════════════════════
 * - سجل العمليّات (audit log)
 * - محاولات تسجيل الدخول
 * - جلسات نشطة
 */
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SecurityDashboard from '@/components/admin/SecurityDashboard';

export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // فقط owner يشوف صفحة الأمن
  if (!profile || (profile as any).role !== 'owner') redirect('/admin');

  // جلب آخر 100 عملية
  const [{ data: audits }, { data: logins }] = await Promise.all([
    supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('login_attempts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  return (
    <SecurityDashboard
      audits={(audits as any[]) || []}
      logins={(logins as any[]) || []}
    />
  );
}
