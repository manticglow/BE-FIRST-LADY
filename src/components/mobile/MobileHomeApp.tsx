/**
 * MobileHomeApp — واجهة الصفحة الرئيسية بنمط تطبيق حقيقي (موبايل فقط)
 * ═══════════════════════════════════════════════════════════
 * - شريط علوي: الموقع + دخول العميلة + واتساب
 * - بحث فوق
 * - Hero carousel بالعروض (مع نقاط)
 * - شبكة الفئات (2×2)
 * - كاروسيلات الخدمات الأفقية
 * تُستبدَل بـ <MobileHomeApp /> على الموبايل · والصفحة الكاملة تبقى على الديسكتوب
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { Search, MapPin, MessageCircle, User, ChevronLeft, Clock, Star, Plus } from 'lucide-react';
import type { Category, Service, Package } from '@/types/database';
import { formatPrice, formatDuration, waLink } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';

interface Props {
  categories: Category[];
  services: Service[];
  packages: Package[];
  user: { full_name?: string } | null;
  todayOffers?: { title: string; subtitle: string; href: string; image: string }[];
}

const CATEGORY_IMAGES: Record<string, string> = {
  'massage':    '/images/categories/massage.jpg',
  'bath':       '/images/categories/bath.jpg',
  'facial':     '/images/categories/facial.jpg',
  'nails':      '/images/categories/nails.jpg',
  'brows':      '/images/categories/facial.jpg',
  'hair-color': '/images/categories/hair.jpg',
  'hair-cut':   '/images/categories/hair.jpg',
  'blow-dry':   '/images/categories/hair.jpg',
  'hair-style': '/images/categories/hair.jpg',
  'hair-treat': '/images/categories/hair.jpg',
  'makeup':     '/images/categories/facial.jpg',
};

export default function MobileHomeApp({ categories, services, packages, user, todayOffers = [] }: Props) {
  const [heroIndex, setHeroIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  // بنرات افتراضية إذا ما فيه عروض من قاعدة البيانات
  const banners = todayOffers.length > 0 ? todayOffers : [
    {
      title: 'خلّي التوتر يذوب',
      subtitle: 'مساج استرخاء في بيتك',
      href: '/booking',
      image: '/images/banners/relaxation.jpg',
    },
    {
      title: 'باقة العناية المثالية',
      subtitle: 'مساج + مانيكير وباديكير بـ 380 ر.س',
      href: '/booking?package=combo',
      image: '/images/banners/combo-package.jpg',
    },
  ];

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

  return (
    <div className="md:hidden min-h-screen bg-white pb-24">

      {/* ═══ Top bar · شبيه Olivéa ═══ */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-cream-100">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <a
            href={waLink()}
            target="_blank"
            className="w-10 h-10 rounded-full border border-gold-light/40 flex items-center justify-center text-gold-deep hover:bg-cream-50 transition-colors"
            aria-label="واتساب"
          >
            <MessageCircle className="w-5 h-5" />
          </a>

          <div className="flex items-center gap-2 min-w-0">
            {user?.full_name ? (
              <>
                <div className="text-right min-w-0">
                  <div className="text-[10px] text-ink-soft">أهلاً بكِ</div>
                  <div className="text-xs font-bold text-gold-deep truncate">
                    {user.full_name.split(' ')[0]}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-right">
                <div className="text-[10px] text-ink-soft flex items-center gap-1 justify-end">
                  <MapPin className="w-3 h-3" />
                  المدينة المنوّرة
                </div>
                <div className="text-xs font-bold text-gold-deep">دخول كضيفة</div>
              </div>
            )}
            <Link
              href={user ? '/account' : '/login'}
              className="w-10 h-10 rounded-full border border-gold-light/40 flex items-center justify-center text-gold-deep hover:bg-cream-50 transition-colors"
              aria-label="الحساب"
            >
              <User className="w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* شريط البحث */}
        <div className="px-4 pb-3">
          <Link
            href="/booking"
            className="flex items-center gap-2 w-full bg-cream-50 border border-cream-200 rounded-2xl px-4 py-3 text-ink-soft text-sm hover:border-gold-light transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>ابحثي عن خدمة...</span>
          </Link>
        </div>
      </header>

      {/* ═══ Hero carousel ═══ */}
      <section className="px-4 pt-4">
        <div
          ref={heroRef}
          className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide -mx-4 px-4"
        >
          {banners.map((b, i) => (
            <Link
              key={i}
              href={b.href}
              className="flex-shrink-0 w-full snap-center block relative aspect-[16/10] rounded-3xl overflow-hidden shadow-md"
            >
              <Image
                src={b.image}
                alt={b.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-tl from-ink/60 via-ink/20 to-transparent" />
              <div className="absolute inset-0 p-5 flex flex-col justify-between">
                <div className="text-right">
                  <h3 className="font-ar-display text-xl md:text-2xl font-bold text-cream-50 leading-tight">
                    {b.title}
                  </h3>
                  <p className="text-xs text-cream-50/90 mt-1">{b.subtitle}</p>
                </div>
                <div className="self-start bg-gold-light/90 backdrop-blur text-ink text-xs font-bold px-4 py-2 rounded-full">
                  احجزي الآن
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* نقاط الـcarousel */}
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
          <ServiceCarousel services={topServices} />
        </section>
      )}

      {/* ═══ العناية بالأظافر ═══ */}
      {nailServices.length > 0 && (
        <section className="pt-6">
          <div className="px-4">
            <SectionHeader title="العناية بالأظافر" href="/services#nails" />
          </div>
          <ServiceCarousel services={nailServices} />
        </section>
      )}

      {/* ═══ مساج للسيدات ═══ */}
      {massageServices.length > 0 && (
        <section className="pt-6">
          <div className="px-4">
            <SectionHeader title="مساج للسيدات" href="/services#massage" />
          </div>
          <ServiceCarousel services={massageServices} />
        </section>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-ar-display text-lg font-bold text-gold-deep">{title}</h2>
      <Link href={href} className="text-xs text-ink-soft hover:text-gold-deep font-semibold flex items-center gap-1">
        عرض الكل
        <ChevronLeft className="w-3 h-3" />
      </Link>
    </div>
  );
}

function CategoryTile({ category }: { category: Category }) {
  const img = CATEGORY_IMAGES[category.slug] || '/images/categories/default.jpg';
  return (
    <Link
      href={`/services#${category.slug}`}
      className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-sm active:scale-95 transition-transform"
    >
      <Image
        src={img}
        alt={category.name_ar}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 50vw, 25vw"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 via-ink/40 to-transparent p-3">
        <div className="font-ar-display font-bold text-cream-50 text-sm">
          {category.name_ar}
        </div>
      </div>
    </Link>
  );
}

function ServiceCarousel({ services }: { services: Service[] }) {
  return (
    <div className="mt-3 flex gap-3 overflow-x-auto scrollbar-hide pr-4 pl-4 snap-x">
      {services.map((s) => (
        <ServiceAppCard key={s.id} service={s} />
      ))}
    </div>
  );
}

function ServiceAppCard({ service }: { service: Service }) {
  const img = service.image_url || `/images/services/${(service as any).slug || 'default'}.jpg`;
  const hasImage = !!service.image_url;

  return (
    <AddToCartServiceCard service={service} img={img} hasImage={hasImage} />
  );
}

function AddToCartServiceCard({ service, img, hasImage }: { service: Service; img: string; hasImage: boolean }) {
  const cart = useCart();
  const inCart = cart.has(service.id);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) {
      cart.remove(service.id);
      toast('تم الإزالة من السلة', { icon: '🗑️' });
    } else {
      cart.add(service.id);
      toast.success(`أُضيفت للسلة · ${cart.count + 1} خدمات 🌸`);
    }
  }

  return (
    <Link
      href={`/booking?service=${service.id}`}
      className="snap-start flex-shrink-0 w-56 bg-white rounded-3xl overflow-hidden border border-cream-100 active:scale-95 transition-transform shadow-sm"
    >
      {/* الصورة */}
      <div className="relative aspect-square bg-gradient-to-br from-gold-light/15 to-cream-100">
        {hasImage ? (
          <Image
            src={img}
            alt={service.name_ar}
            fill
            className="object-cover"
            sizes="224px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Star className="w-10 h-10 text-gold-deep/30" />
          </div>
        )}
      </div>

      {/* المحتوى */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1 text-xs">
            <Star className="w-3 h-3 text-gold-deep fill-gold-deep" />
            <span className="font-bold font-en-display text-ink">
              {(4.5 + Math.random() * 0.5).toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-ink-soft">
            <Clock className="w-3 h-3" />
            <span className="font-en-display">{formatDuration(service.duration_min)}</span>
          </div>
        </div>

        <h3 className="font-ar-display font-bold text-sm text-ink line-clamp-2 min-h-[2.5rem] mb-2">
          {service.name_ar}
        </h3>

        <div className="flex items-baseline justify-between mb-3">
          <div className="text-[10px] text-ink-soft">تبدأ من</div>
          <div className="font-en-display font-bold text-base text-gold-deep">
            {formatPrice(service.price, { showFrom: service.price_from })}
          </div>
        </div>

        <button
          onClick={handleAdd}
          className={`w-full flex items-center justify-center gap-1 text-xs font-bold py-2 rounded-xl transition-colors ${
            inCart
              ? 'bg-gold-deep text-cream-50'
              : 'bg-gold-light/80 text-ink hover:bg-gold-light'
          }`}
        >
          {inCart ? (
            <>
              <Star className="w-3.5 h-3.5 fill-current" />
              في السلة
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              أضيفي للسلة
            </>
          )}
        </button>
      </div>
    </Link>
  );
}
