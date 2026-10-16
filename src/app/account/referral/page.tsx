/**
 * صفحة برنامج الإحالة
 */
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ReferralCard from '@/components/account/ReferralCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ReferralPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/referral');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) redirect('/');

  // عد الإحالات
  const { data: referrals } = await supabase.from('profiles')
    .select('full_name, created_at')
    .eq('referred_by', user.id)
    .order('created_at', { ascending: false });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24">
        <div className="max-w-xl mx-auto px-4 py-8 md:py-12">
          <Link href="/account" className="text-sm text-ink-soft hover:text-gold-deep mb-4 inline-block">
            ← الحساب
          </Link>
          <div className="mb-8 text-center">
            <div className="text-4xl mb-3">👯‍♀️</div>
            <h1 className="font-ar-display text-3xl font-bold text-gold-deep">
              ادعي صديقاتكِ
            </h1>
            <p className="text-ink-soft text-sm mt-2 leading-relaxed">
              شاركي كودكِ معهن — لكِ 50 ر.س ولها 50 ر.س عند أول حجز 💛
            </p>
          </div>

          <ReferralCard
            code={profile.referral_code || ''}
            credit={Number(profile.referral_credit || 0)}
            referrals={referrals || []}
            siteUrl={process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
