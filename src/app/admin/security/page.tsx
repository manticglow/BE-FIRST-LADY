/**
 * /admin/security — صفحة الأمن والمراقبة
 * ═══════════════════════════════════════════════════════════
 * - سجل العمليّات (audit log)
 * - محاولات تسجيل الدخول
 * - جلسات نشطة
 */
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import SecurityDashboard, { type AuditLog, type LoginAttempt } from '@/components/admin/SecurityDashboard';

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
  const profileRow = profile as { role: string } | null;
  if (!profileRow || profileRow.role !== 'owner') redirect('/admin');

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
      audits={(audits as AuditLog[] | null) || []}
      logins={(logins as LoginAttempt[] | null) || []}
    />
  );
}
