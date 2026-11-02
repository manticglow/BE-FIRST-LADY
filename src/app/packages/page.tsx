/**
 * /packages — صفحة البكجات للعميلات
 * ═══════════════════════════════════════════════════════════
 * - عرض كل البكجات النشطة
 * - رابط حجز مباشر لكل بكج
 */
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';
import { Package, Sparkles, Clock, Tag, ArrowLeft } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'البكجات · Be First Lady',
  description: 'بكجات خدمات مميّزة بأسعار موفّرة · احزمي عدّة خدمات بسعر خاص',
};

export default async function PackagesPage() {
  const supabase = await createClient();
  const { data: packages } = await supabase
    .from('packages')
    .select('*, items:package_items(service_id, services(name, duration_min, price))')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  const pkgs = (packages as any[]) || [];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24 pb-16">
        <div className="max-w-6xl mx-auto px-4">

          {/* Hero */}
          <div className="text-center mb-10 md:mb-14">
            <div className="editorial-eyebrow text-gold-deep mb-2">PACKAGES · بكجات</div>
            <h1 className="font-ar-display text-3xl md:text-5xl font-bold text-ink mb-3">
              بكجات مُختارة بعناية
            </h1>
            <p className="text-ink-soft text-sm md:text-base max-w-xl mx-auto">
              احزمي عدّة خدمات في جلسة واحدة بسعر موفّر · تجربة شاملة بلمسة فاخرة
            </p>
          </div>

          {pkgs.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-cream-200 max-w-md mx-auto">
              <Package className="w-12 h-12 text-stone-300 mx-auto mb-3" />
              <div className="text-ink-soft mb-4">لا يوجد بكجات متاحة حالياً</div>
              <Link href="/booking" className="inline-flex items-center gap-1 text-gold-deep font-bold text-sm hover:underline">
                احجزي خدمة فرديّة
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pkgs.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}

function PackageCard({ pkg }: { pkg: any }) {
  const servicesCount = pkg.items?.length || 0;
  const originalTotal = pkg.items?.reduce(
    (s: number, i: any) => s + Number(i.services?.price || 0),
    0,
  ) || 0;
  const discount = originalTotal - Number(pkg.price);
  const discountPct = originalTotal > 0 ? Math.round((discount / originalTotal) * 100) : 0;

  return (
    <div className="group relative bg-white rounded-3xl border-2 border-cream-200 overflow-hidden hover:border-gold-light hover:shadow-xl transition-all">

      {/* Hero image or gradient */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-amber-100 via-rose-100 to-pink-100 overflow-hidden">
        {pkg.image_url ? (
          <img
            src={pkg.image_url}
            alt={pkg.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Sparkles className="w-16 h-16 text-amber-400/50" />
          </div>
        )}

        {discountPct > 0 && (
          <div className="absolute top-3 right-3 bg-rose-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
            وفّري {discountPct}%
          </div>
        )}
      </div>

      <div className="p-5">
        <div className="editorial-eyebrow text-stone-400 mb-1">
          {servicesCount} خدمات · PACKAGE
        </div>
        <h3 className="font-ar-display text-lg font-bold text-ink mb-2 min-h-[3rem]">
          {pkg.name}
        </h3>
        {pkg.description && (
          <p className="text-xs text-ink-soft line-clamp-2 mb-3 min-h-[2rem]">
            {pkg.description}
          </p>
        )}

        {/* Services list */}
        {pkg.items && pkg.items.length > 0 && (
          <div className="mb-4 space-y-1.5">
            {pkg.items.slice(0, 4).map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-ink-soft">
                <Sparkles className="w-3 h-3 text-gold-light shrink-0" />
                <span className="truncate flex-1">{item.services?.name}</span>
                <span className="font-en-display text-[10px] opacity-60">
                  {item.services?.duration_min}د
                </span>
              </div>
            ))}
            {pkg.items.length > 4 && (
              <div className="text-[10px] text-gold-deep font-bold">
                + {pkg.items.length - 4} خدمات أخرى
              </div>
            )}
          </div>
        )}

        {/* Duration + Price */}
        <div className="flex items-end justify-between pt-3 border-t border-cream-100">
          <div>
            {pkg.duration_min && (
              <div className="flex items-center gap-1 text-[11px] text-ink-soft">
                <Clock className="w-3 h-3" />
                {pkg.duration_min} دقيقة
              </div>
            )}
            {discount > 0 && (
              <div className="text-[11px] text-stone-400 line-through font-en-display">
                {formatPrice(originalTotal, { showFrom: false })}
              </div>
            )}
          </div>
          <div className="text-left">
            <div className="font-en-display font-bold text-xl text-gold-deep">
              {formatPrice(pkg.price, { showFrom: false })}
            </div>
          </div>
        </div>

        <Link
          href={`/booking?package=${pkg.id}`}
          className="mt-4 flex items-center justify-center gap-1.5 py-3 bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50 font-ar-display font-bold text-sm rounded-xl hover:shadow-md transition-all"
        >
          <Tag className="w-4 h-4" />
          احجزي هذا البكج
        </Link>
      </div>
    </div>
  );
}
