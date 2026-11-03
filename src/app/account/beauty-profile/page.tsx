/**
 * /account/beauty-profile — صفحة ملف الجمال
 */
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import BeautyProfileForm from '@/components/account/BeautyProfileForm';
import Link from 'next/link';
import { ChevronRight, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'ملف الجمال · Be First Lady',
};

export default async function BeautyProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/account/beauty-profile');

  // جلب الملف · resilient لو العمود لم يُضَف بعد
  let beautyProfile: any = {};
  let migrationPending = false;
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('beauty_profile')
      .eq('id', user.id)
      .single();
    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('beauty_profile') || msg.includes('schema cache')) {
        migrationPending = true;
      }
    } else {
      beautyProfile = (profile as any)?.beauty_profile || {};
    }
  } catch {
    migrationPending = true;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4">

          <Link
            href="/account"
            className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 mb-4"
          >
            <ChevronRight className="w-4 h-4" />
            عودة للحساب
          </Link>

          {/* Hero */}
          <div className="bg-gradient-to-br from-rose-100 via-amber-50 to-cream-50 rounded-3xl p-6 mb-6 border border-rose-100">
            <div className="editorial-eyebrow text-rose-700/80 mb-1">BEAUTY PROFILE</div>
            <h1 className="font-ar-display text-2xl md:text-3xl font-bold text-ink mb-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-rose-500" />
              ملف الجمال الخاص بكِ
            </h1>
            <p className="text-xs md:text-sm text-ink-soft leading-relaxed">
              هذه المعلومات تساعد موظّفاتنا على تقديم أفضل تجربة لكِ · نحافظ على خصوصيّتها
              <strong className="text-rose-700"> ولا تظهر لأي عميلة أخرى</strong>.
            </p>
          </div>

          {migrationPending && (
            <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="font-bold text-amber-900 text-sm mb-1 flex items-center gap-2">
                ⚠️ ملف الجمال في طور التفعيل
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                قاعدة البيانات تحتاج تحديث بسيط من المدير · حتى ذلك الحين تقدرين تملين النموذج ·
                وراح نحفظ البيانات بمجرّد اكتمال التحديث.
              </p>
            </div>
          )}

          <BeautyProfileForm initial={beautyProfile} />

        </div>
      </main>
      <Footer />
    </>
  );
}
