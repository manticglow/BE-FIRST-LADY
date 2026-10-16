/**
 * Admin — إدارة اليوزرات (owner فقط)
 */
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import UsersManager from '@/components/admin/UsersManager';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'owner') {
    return (
      <div className="p-6 md:p-8">
        <div className="bg-danger/10 border border-danger/30 rounded-2xl p-6 text-center">
          <div className="font-ar-display text-xl text-danger font-bold">ممنوع</div>
          <p className="text-sm text-ink-soft mt-2">هذه الصفحة للمالكة فقط</p>
        </div>
      </div>
    );
  }

  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .in('role', ['owner', 'manager', 'staff'])
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">اليوزرات والصلاحيات</h1>
        <p className="text-ink-soft text-sm mt-1">
          أنشئي حسابات لموظفاتكِ وحدّدي صلاحياتهن
        </p>
      </div>
      <UsersManager users={users || []} />
    </div>
  );
}
