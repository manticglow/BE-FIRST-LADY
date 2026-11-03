/**
 * MobileHomeApp — واجهة الصفحة الرئيسية بنمط تطبيق حقيقي (موبايل فقط)
 * ═══════════════════════════════════════════════════════════
 * الـshell فقط · كل جزء في ملف منفصل تحت ./home/
 *   - BannerCard
 *   - CategoryTile
 *   - ServiceCarousel
 *   - GalleryStrip
 *   - SectionHeader
 *   - image-picker (helpers + CATEGORY_ICONS)
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, MapPin, MessageCircle, User } from 'lucide-react';
import type { Category, Service, Package } from '@/types/database';
import { waLink } from '@/lib/utils';
import HeaderSearchLazy from '@/components/layout/HeaderSearchLazy';

import BannerCard, { type Banner } from './home/BannerCard';
import CategoryTile from './home/CategoryTile';
import ServiceCarousel from './home/ServiceCarousel';
import GalleryStrip from './home/GalleryStrip';
import SectionHeader from './home/SectionHeader';

interface Props {
  categories: Category[];
  services: Service[];
  packages: Package[];
  user: { full_name?: string } | null;
  todayOffers?: Banner[];
}

const DEFAULT_BANNERS: Banner[] = [
  {
    title: 'خلّي التوتر يذوب',
    subtitle: 'مساج استرخاء مميّز بأيدي خبيرات',
    href: '/services#massage',
    image: '/images/banners/relaxation.jpg',
    fallback: '/images/gallery/evening-glam.jpg',
    gradient: 'from-amber-900/80 via-amber-800/60 to-rose-900/40',
  },
  {
    title: 'باقة العناية المثالية',
    subtitle: 'مساج + مانيكير وباديكير بسعر مميّز',
    href: '/packages',
    image: '/images/banners/combo-package.jpg',
    fallback: '/images/gallery/burgundy-mani.jpg',
    gradient: 'from-rose-900/80 via-amber-800/60 to-amber-900/40',
  },
];

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'صباح الخير ☀️';
  if (h < 17) return 'مساء الخير 🌤️';
  return 'مساء النور 🌙';
}

export default function MobileHomeApp({
  categories, services, packages, user, todayOffers = [],
}: Props) {
  const [heroIndex, setHeroIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  const banners: Banner[] = todayOffers.length > 0 ? todayOffers : DEFAULT_BANNERS;

  const topServices = services.slice(0, 6);
  const nailServices = services.filter((s) => {
    const cat = categories.find((c) => c.id === s.category_id);
    return cat?.slug === 'nails';
  }).slice(0, 6);
  const massageServices = services.filter((s) => {
    const cat = categories.find((c) => c.id === s.category_id);
    return cat?.slug === 'massage';
  }).slice(0, 6);

  // تتبّع التمرير للـhero carousel
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handler = () => {
      const w = el.clientWidth;
      const i = Math.round(el.scrollLeft / w);
      setHeroIndex(i);
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  function openSearch() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('bfl:open-search'));
    }
  }

  return (
    <div className="md:hidden min-h-screen bg-white pb-24">

      {/* البحث · headless · يستجيب للـcustom event */}
      <HeaderSearchLazy headless />

      {/* ═══ Top bar · فاخر + glass ═══ */}
      <header className="sticky top-0 z-30 bg-gradient-to-b from-cream-50 via-white/95 to-white/80 backdrop-blur-xl border-b border-gold-light/15">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-3 relative">
          <div className="absolute top-0 left-1/3 w-40 h-16 bg-gold-light/10 blur-2xl pointer-events-none" />

          <a
            href={waLink()}
            target="_blank"
            className="relative w-11 h-11 rounded-full bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/60 flex items-center justify-center text-emerald-600 active:scale-95 transition-all shadow-sm"
            aria-label="واتساب"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse" />
          </a>

          <div className="flex items-center gap-2.5 min-w-0 relative">
            {user?.full_name ? (
              <div className="text-right min-w-0">
                <div className="text-[9px] text-ink-soft">{timeGreeting()}</div>
                <div className="text-sm font-ar-display font-bold text-gold-deep truncate">
                  {user.full_name.split(' ')[0]}
                </div>
              </div>
            ) : (
              <div className="text-right">
                <div className="text-[9px] text-ink-soft flex items-center gap-1 justify-end">
                  <MapPin className="w-2.5 h-2.5 text-gold-light" />
                  المدينة المنوّرة
                </div>
                <div className="text-xs font-bold text-gold-deep font-ar-display">أهلاً بكِ 🌸</div>
              </div>
            )}
            <Link
              href={user ? '/account' : '/login'}
              className="relative w-11 h-11 rounded-full bg-gradient-to-br from-gold-light/15 to-amber-100/30 border border-gold-light/40 flex items-center justify-center text-gold-deep active:scale-95 transition-all shadow-sm"
              aria-label="الحساب"
            >
              <User className="w-5 h-5" />
              {user && (
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </Link>
          </div>
        </div>

        {/* شريط البحث · يفتح overlay البحث الحقيقي */}
        <div className="px-4 pb-3 relative">
          <button
            type="button"
            onClick={openSearch}
            className="group flex items-center gap-2.5 w-full bg-gradient-to-br from-cream-50 to-amber-50/40 border border-gold-light/25 rounded-full px-4 py-3 text-ink-soft text-sm active:scale-[0.98] transition-all text-right"
          >
            <div className="w-7 h-7 rounded-full bg-gold-light/15 flex items-center justify-center shrink-0">
              <Search className="w-3.5 h-3.5 text-gold-deep" />
            </div>
            <span className="flex-1">ابحثي عن خدمة · بكج · عرض...</span>
          </button>
        </div>
      </header>

      {/* ═══ Hero carousel ═══ */}
      <section className="px-4 pt-4">
        <div
          ref={heroRef}
          className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
        >
          {banners.map((b, i) => (
            <BannerCard key={i} banner={b} />
          ))}
        </div>

        {banners.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {banners.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === heroIndex ? 'w-6 bg-gold-deep' : 'w-1.5 bg-cream-200'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ═══ شبكة الفئات ═══ */}
      <section className="px-4 pt-6">
        <SectionHeader title="التصنيفات" href="/services" />
        <div className="grid grid-cols-2 gap-3 mt-3">
          {categories.slice(0, 6).map((cat) => (
            <CategoryTile key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* ═══ أكثر الخدمات حجزاً ═══ */}
      {topServices.length > 0 && (
        <section className="pt-6">
          <div className="px-4">
            <SectionHeader title="أكثر الخدمات حجزاً" href="/services" />
          </div>
          <ServiceCarousel services={topServices} isLoggedIn={!!user} />
        </section>
      )}

      {/* ═══ العناية بالأظافر ═══ */}
      {nailServices.length > 0 && (
        <section className="pt-6">
          <div className="px-4">
            <SectionHeader title="العناية بالأظافر" href="/services#nails" />
          </div>
          <ServiceCarousel services={nailServices} isLoggedIn={!!user} />
        </section>
      )}

      {/* ═══ مساج للسيدات ═══ */}
      {massageServices.length > 0 && (
        <section className="pt-6">
          <div className="px-4">
            <SectionHeader title="مساج للسيدات" href="/services#massage" />
          </div>
          <ServiceCarousel services={massageServices} isLoggedIn={!!user} />
        </section>
      )}

      {/* ═══ معرض أعمالنا ═══ */}
      <section className="pt-6">
        <div className="px-4 mb-3">
          <h2 className="font-ar-display text-lg font-bold text-gold-deep">معرض أعمالنا</h2>
          <p className="text-[11px] text-ink-soft mt-0.5">لمسات بناتنا الفخيمة ✨</p>
        </div>
        <GalleryStrip />
      </section>
    </div>
  );
}
