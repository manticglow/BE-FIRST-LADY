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
import { Search, MessageCircle } from 'lucide-react';
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

      {/* ═══ Top bar · ناعم حديث ═══ */}
      <header
        className="sticky top-0 z-30 bg-cream-50/95 backdrop-blur-xl"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="px-4 pt-3 pb-2 flex items-center justify-between gap-3">
          {/* يمين · الترحيب */}
          <Link href={user ? '/account' : '/login'} className="flex items-center gap-3 min-w-0 flex-1" aria-label="الحساب">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-blush to-gold-light flex items-center justify-center text-white font-en-display font-semibold text-base shrink-0 shadow-gold-soft">
              {user?.full_name ? user.full_name.charAt(0) : '👋'}
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-ink-soft leading-none mb-1">
                {timeGreeting().replace(/[☀️🌤️🌙]/g, '').trim()}
              </div>
              <div className="font-en-display text-base font-medium text-ink truncate leading-none">
                {user?.full_name ? user.full_name.split(' ')[0] : 'أهلاً بكِ'}
              </div>
            </div>
          </Link>

          {/* يسار · أيقونات */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={waLink()}
              target="_blank"
              className="w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center text-success-deep active:scale-95 transition-transform relative"
              aria-label="واتساب"
            >
              <MessageCircle className="w-[18px] h-[18px]" strokeWidth={2} />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-success animate-pulse ring-2 ring-cream-50" />
            </a>
          </div>
        </div>

        {/* شريط البحث · ناعم بدون حدود ثقيلة */}
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={openSearch}
            className="flex items-center gap-3 w-full bg-white rounded-2xl px-4 py-3 text-ink-soft text-sm active:scale-[0.98] transition-transform text-right shadow-card"
          >
            <Search className="w-4 h-4 text-gold" strokeWidth={2} />
            <span className="flex-1 text-[13px]">ابحثي عن خدمة · باقة...</span>
            <div className="text-[9px] text-gold-light font-en-label tracking-wider">SEARCH</div>
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

      {/* ═══ شريط الفئات أفقي ═══ */}
      <section className="pt-5">
        <div className="px-4">
          <SectionHeader title="التصنيفات" href="/services" />
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide px-4 pt-3 pb-1">
          {categories.slice(0, 8).map((cat) => (
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
