/**
 * Services Page — صفحة الخدمات الكاملة
 * ═══════════════════════════════════════════════════════════
 * - عرض كل الخدمات مجمّعة بالفئات
 * - كل خدمة قابلة للإضافة للسلة
 * - يدعم الـanchor للتنقّل مباشرة لفئة (#massage)
 */
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ServicesListClient from '@/components/services/ServicesListClient';

export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: services }, { data: { user } }] = await Promise.all([
    supabase.from('categories').select('*').eq('is_active', true).order('display_order'),
    supabase.from('services').select('*, category:categories(*)').eq('is_active', true).order('display_order'),
    supabase.auth.getUser(),
  ]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24 pb-28">
        <ServicesListClient categories={categories || []} services={services || []} isLoggedIn={!!user} />
      </main>
      <Footer />
    </>
  );
}
