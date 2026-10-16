/**
 * صفحة الحضور والانصراف للموظفة
 * ═══════════════════════════════════════════════════════════
 * - متاحة لـ staff/manager/owner
 */
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import AttendanceCard from '@/components/account/AttendanceCard';

export const dynamic = 'force-dynamic';

export default async function AttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/attendance');

  const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single();
  if (!profile || !['staff', 'manager', 'owner'].includes(profile.role)) {
    redirect('/account');
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24">
        <div className="max-w-xl mx-auto px-4 py-8 md:py-12">
          <div className="text-center mb-6">
            <div className="font-en-label text-[10px] tracking-[0.3em] text-gold mb-2">
              TIME TRACKING
            </div>
            <h1 className="font-ar-display text-3xl font-bold text-gold-deep">
              الحضور والانصراف
            </h1>
            <p className="text-ink-soft text-sm mt-2">
              أهلاً {profile.full_name?.split(' ')[0]} 👋
            </p>
          </div>

          <AttendanceCard />
        </div>
      </main>
      <Footer />
    </>
  );
}
