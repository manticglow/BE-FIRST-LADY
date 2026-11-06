/**
 * AdminModeGuard — Server wrapper that shows banner only for admin roles
 * ═══════════════════════════════════════════════════════════
 * Fetches current user role on the server and renders the
 * AdminModeBanner only when the viewer is owner/manager/staff.
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import AdminModeBanner from './AdminModeBanner';

export default async function AdminModeGuard() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    const p = profile as { role?: string; full_name?: string } | null;
    const role = p?.role;

    if (role === 'owner' || role === 'manager' || role === 'staff') {
      return <AdminModeBanner role={role} name={p?.full_name} />;
    }
  } catch {
    // لا تفشلي الصفحة لو حدث خطأ في التحقّق
  }
  return null;
}
