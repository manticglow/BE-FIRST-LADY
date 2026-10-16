/**
 * صفحة طلبات الإجازة للموظفة
 */
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LeavesManager from '@/components/account/LeavesManager';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function LeavesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/leaves');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['staff', 'manager', 'owner'].includes(profile.role)) {
    redirect('/account');
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24">
        <div className="max-w-xl mx-auto px-4 py-8 md:py-12">
          <Link href="/account" className="text-sm text-ink-soft hover:text-gold-deep mb-4 inline-block">
            ← الحساب
          </Link>
          <div className="mb-8">
            <h1 className="font-ar-display text-3xl font-bold text-gold-deep">
              طلبات الإجازة
            </h1>
            <p className="text-ink-soft text-sm mt-1">قدّمي طلب جديد أو تابعي طلباتكِ السابقة</p>
          </div>
          <LeavesManager />
        </div>
      </main>
      <Footer />
    </>
  );
}
