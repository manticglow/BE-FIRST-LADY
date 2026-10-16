/**
 * صفحة بيانات العميلة الشخصية
 */
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProfileEditor from '@/components/account/ProfileEditor';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/profile');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) redirect('/');

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
              بياناتي الشخصية
            </h1>
            <p className="text-ink-soft text-sm mt-1">عدّلي معلوماتكِ متى تحبّين</p>
          </div>
          <ProfileEditor profile={profile} />
        </div>
      </main>
      <Footer />
    </>
  );
}
