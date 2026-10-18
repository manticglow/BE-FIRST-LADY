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
import { Search, MapPin, MessageCircle, User, ChevronLeft, Clock, Star, Plus, Check } from 'lucide-react';
import type { Category, Service, Package } from '@/types/database';
import { formatPrice, formatDuration, waLink } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import Petals from '@/components/ui/Petals';

interface Props {
  categories: Category[];
  services: Service[];
  packages: Package[];
  user: { full_name?: string } | null;
  todayOffers?: { title: string; subtitle: string; href: string; image: string }[];
}

// الأيقونات من الموقع · في /public/images/icons/
const CATEGORY_ICONS: Record<string, string> = {
  'massage':    '/images/icons/massage.png',
  'bath':       '/images/icons/bath.png',
  'facial':     '/images/icons/facial.png',
  'nails':      '/images/icons/nails.png',
  'brows':      '/images/icons/facial.png',
  'hair-color': '/images/icons/hair-color.png',
  'hair-cut':   '/images/icons/hair-cut.png',
  'blow-dry':   '/images/icons/blow-dry.png',
  'hair-style': '/images/icons/hair-style.png',
  'hair-treat': '/images/icons/hair-treat.png',
  'makeup':     '/images/icons/facial.png',
};

// صور معرض الأعمال الجاهزة · لإعادة الاستخدام كـfallback
const GALLERY_IMAGES = [
  '/images/gallery/bridal-look.jpg',
  '/images/gallery/bridal-makeup.jpg',
  '/images/gallery/bun-styling.jpg',
  '/images/gallery/burgundy-mani.jpg',
  '/images/gallery/evening-glam.jpg',
  '/images/gallery/eyes-detail-poster.jpg',
  '/images/gallery/eyes-makeup-poster.jpg',
  '/images/gallery/french-mani.jpg',
  '/images/gallery/gold-mani.jpg',
  '/images/gallery/hairstyle.jpg',
  '/images/gallery/hollywood-waves.jpg',
  '/images/gallery/lashes-poster.jpg',
];

// توزيع ذكي · نفس الخدمة دائماً تحصل على نفس الصورة
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h);
}

// بديل ذكي للخدمة · يفحص الاسم أولاً · ثم الفئة
function pickFallbackImage(serviceId: string, nameEn: string, categorySlug?: string): string {
  const name = nameEn.toLowerCase();

  // 1️⃣ تطابق مباشر بكلمات مفتاحية (أدق · يسبق الفئة)
  const keywordMap: Array<[string[], string[]]> = [
    [['bridal', 'royal', 'luxury', 'premium', 'queen', 'princess'],
      ['/images/gallery/bridal-look.jpg', '/images/gallery/bridal-makeup.jpg', '/images/gallery/evening-glam.jpg']],
    [['stone', 'hot stone'],
      ['/images/gallery/evening-glam.jpg', '/images/gallery/bridal-look.jpg']],
    [['deep tissue', 'deep', 'tissue', 'therapeutic', 'medical'],
      ['/images/gallery/evening-glam.jpg', '/images/gallery/bun-styling.jpg']],
    [['hollywood', 'waves', 'curls', 'curl'],
      ['/images/gallery/hollywood-waves.jpg']],
    [['bun', 'updo', 'knot'],
      ['/images/gallery/bun-styling.jpg']],
    [['french'],
      ['/images/gallery/french-mani.jpg']],
    [['gold', 'golden'],
      ['/images/gallery/gold-mani.jpg']],
    [['burgundy', 'red', 'cherry'],
      ['/images/gallery/burgundy-mani.jpg']],
    [['lashes', 'lash', 'eyelash'],
      ['/images/gallery/lashes-poster.jpg']],
    [['eyes', 'eye'],
      ['/images/gallery/eyes-detail-poster.jpg', '/images/gallery/eyes-makeup-poster.jpg']],
    [['evening', 'glam', 'night'],
      ['/images/gallery/evening-glam.jpg']],
  ];

  for (const [keywords, images] of keywordMap) {
    if (keywords.some((k) => name.includes(k))) {
      return images[hashString(serviceId) % images.length];
    }
  }

  // 2️⃣ fallback حسب الفئة (مع تنويع بالـhash)
  const byCat: Record<string, string[]> = {
    'nails':      ['/images/gallery/french-mani.jpg', '/images/gallery/burgundy-mani.jpg', '/images/gallery/gold-mani.jpg'],
    'makeup':     ['/images/gallery/bridal-makeup.jpg', '/images/gallery/eyes-makeup-poster.jpg', '/images/gallery/evening-glam.jpg', '/images/gallery/eyes-detail-poster.jpg', '/images/gallery/bridal-look.jpg'],
    'hair-style': ['/images/gallery/bun-styling.jpg', '/images/gallery/hollywood-waves.jpg', '/images/gallery/hairstyle.jpg'],
    'hair-cut':   ['/images/gallery/hairstyle.jpg', '/images/gallery/bun-styling.jpg'],
    'blow-dry':   ['/images/gallery/hollywood-waves.jpg', '/images/gallery/hairstyle.jpg'],
    'hair-color': ['/images/gallery/hollywood-waves.jpg', '/images/gallery/hairstyle.jpg', '/images/gallery/bun-styling.jpg'],
    'hair-treat': ['/images/gallery/hairstyle.jpg', '/images/gallery/hollywood-waves.jpg'],
    'brows':      ['/images/gallery/lashes-poster.jpg', '/images/gallery/eyes-detail-poster.jpg'],
    'facial':     ['/images/gallery/bridal-look.jpg', '/images/gallery/evening-glam.jpg', '/images/gallery/bridal-makeup.jpg'],
    'massage':    ['/images/gallery/evening-glam.jpg', '/images/gallery/bridal-look.jpg', '/images/gallery/bun-styling.jpg'],
    'bath':       ['/images/gallery/bridal-look.jpg', '/images/gallery/evening-glam.jpg'],
  };

  if (categorySlug && byCat[categorySlug]) {
    const list = byCat[categorySlug];
    return list[hashString(serviceId) % list.length];
  }

  // 3️⃣ آخر fallback · أي صورة من المعرض (مع تنويع)
  return GALLERY_IMAGES[hashString(serviceId) % GALLERY_IMAGES.length];
}

export default function MobileHomeApp({ categories, services, packages, user, todayOffers = [] }: Props) {
  const [heroIndex, setHeroIndex] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  // بنرات افتراضية إذا ما فيه عروض من قاعدة البيانات
  // 💡 للصور الحقيقية: ارفعيها في public/images/banners/
  // الـfallback صور من معرض الأعمال اللي عندك فعلاً
  const banners = todayOffers.length > 0 ? todayOffers : [
    {
      title: 'خلّي التوتر يذوب',
      subtitle: 'مساج استرخاء مميّز بأيدي خبيرات',
      href: '/booking',
      image: '/images/banners/relaxation.jpg',
      fallback: '/images/banners/gallery/evening-glam.jpg',
      gradient: 'from-amber-900/80 via-amber-800/60 to-rose-900/40',
    },
    {
      title: 'باقة العناية المثالية',
      subtitle: 'مساج + مانيكير وباديكير بـ 380 ر.س',
      href: '/booking?package=combo',
      image: '/images/banners/combo-package.jpg',
      fallback: '/images/gallery/burgundy-mani.jpg',
      gradient: 'from-rose-900/80 via-amber-800/60 to-amber-900/40',
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
            <BannerCard key={i} banner={b} />
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

/* ═══════════════════════════════════════════════════════════
   🎨 BannerCard — بنر مع fallback ذكي
   ═══════════════════════════════════════════════════════════
   يحاول تحميل الصورة الأصلية أولاً · لو ما لقاها يرجع لصورة
   من معرض الأعمال · لو حتى هذي ما تحمّلت → تدرّج ذهبي فاخر
   ───────────────────────────────────────────────────────────
   💡 لإضافة صور حقيقية للبنرات: ارفعيها في:
      public/images/banners/relaxation.jpg
      public/images/banners/combo-package.jpg
*/
function BannerCard({ banner: b }: { banner: any }) {
  const [imgSrc, setImgSrc] = useState<string>(b.image);
  const [imgError, setImgError] = useState(false);

  function handleError() {
    if (imgSrc === b.image && b.fallback) {
      setImgSrc(b.fallback);
    } else {
      setImgError(true);
    }
  }

  return (
    <Link
      href={b.href}
      className="flex-shrink-0 w-full snap-center block relative aspect-[16/10] rounded-3xl overflow-hidden shadow-md"
    >
      {/* الصورة · أو تدرّج ذهبي فاخر إذا كلّه فشل */}
      {!imgError ? (
        <Image
          src={imgSrc}
          alt={b.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          onError={handleError}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-gold-deep via-ink to-gold-deep">
          {/* نقش زخرفي ناعم */}
          <div className="absolute inset-0 opacity-20"
               style={{
                 backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
                                   radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`,
               }}
          />
        </div>
      )}

      {/* تدرّج مخصّص لكل بنر لإبراز النص */}
      <div className={`absolute inset-0 bg-gradient-to-tl ${b.gradient || 'from-ink/70 via-ink/30 to-transparent'}`} />

      {/* المحتوى */}
      <div className="absolute inset-0 p-5 flex flex-col justify-between">
        <div className="text-right">
          <h3 className="font-ar-display text-xl md:text-2xl font-bold text-cream-50 leading-tight drop-shadow-md">
            {b.title}
          </h3>
          <p className="text-xs text-cream-50/95 mt-1 drop-shadow">{b.subtitle}</p>
        </div>
        <div className="self-start bg-gold-light/90 backdrop-blur text-ink text-xs font-bold px-4 py-2 rounded-full shadow-lg">
          احجزي الآن
        </div>
      </div>
    </Link>
  );
}

function GalleryStrip() {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 snap-x">
      {GALLERY_IMAGES.map((src, i) => (
        <div
          key={i}
          className="snap-start flex-shrink-0 w-32 h-40 rounded-2xl overflow-hidden shadow-sm border border-cream-200 relative active:scale-95 transition-transform"
        >
          <Image
            src={src}
            alt={`عمل ${i + 1}`}
            fill
            className="object-cover"
            sizes="128px"
          />
        </div>
      ))}
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
  const icon = CATEGORY_ICONS[category.slug];
  return (
    <Link
      href={`/services#${category.slug}`}
      className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-cream-50 to-cream-100 border border-gold-light/20 shadow-sm active:scale-95 transition-transform p-4 flex flex-col items-center justify-center gap-2 group hover:border-gold-light/50"
    >
      {icon ? (
        <div className="w-14 h-14 rounded-full bg-white/70 flex items-center justify-center p-2 group-hover:scale-110 transition-transform">
          <Image
            src={icon}
            alt={category.name_ar}
            width={44}
            height={44}
            className="object-contain"
          />
        </div>
      ) : (
        <div className="w-14 h-14 rounded-full bg-gold-light/15 flex items-center justify-center text-2xl">
          {category.icon || '✨'}
        </div>
      )}
      <div className="font-ar-display font-bold text-gold-deep text-sm text-center">
        {category.name_ar}
      </div>
      <div className="text-[9px] font-en-label tracking-[0.2em] text-gold-light uppercase">
        {category.name_en}
      </div>
    </Link>
  );
}

function ServiceCarousel({ services, isLoggedIn }: { services: Service[]; isLoggedIn: boolean }) {
  return (
    <div className="mt-3 flex gap-3 overflow-x-auto scrollbar-hide pr-4 pl-4 snap-x">
      {services.map((s) => (
        <ServiceAppCard key={s.id} service={s} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  );
}

// توليد slug من name_en للربط مع ملف الصورة
function slugify(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function ServiceAppCard({ service, isLoggedIn }: { service: Service & { category?: any }; isLoggedIn: boolean }) {
  const localImg = `/images/services/${slugify(service.name_en)}.jpg`;
  const categorySlug = service.category?.slug;
  const fallbackImg = pickFallbackImage(service.id, service.name_en, categorySlug);
  const img = service.image_url || localImg;

  return (
    <AddToCartServiceCard
      service={service}
      img={img}
      fallbackImg={fallbackImg}
      isLoggedIn={isLoggedIn}
    />
  );
}

function AddToCartServiceCard({ service, img, fallbackImg, isLoggedIn }: { service: Service; img: string; fallbackImg: string; isLoggedIn: boolean }) {
  const cart = useCart();
  const inCart = cart.has(service.id);
  const [currentSrc, setCurrentSrc] = useState(img);

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error('لازم تسجّلي دخول أولاً', { icon: '🔒' });
      setTimeout(() => { window.location.href = `/login?redirect=/services/${service.id}`; }, 800);
      return;
    }
    if (inCart) {
      cart.remove(service.id);
      toast('تم الإزالة من السلة', { icon: '🗑️' });
    } else {
      cart.add(service.id);
      toast.success(`أُضيفت للسلة · ${cart.count + 1} خدمات 🌸`);
    }
  }

  // وصف احتياطي حسب الفئة
  const CAT_DESC: Record<string, string> = {
    'massage': 'جلسة استرخاء فاخرة · تخفّف التوتر وتجدّد الطاقة',
    'bath': 'تجربة استحمام ملكيّة · تنعّم بشرتك وتترك عطراً يدوم',
    'facial': 'عناية مكثّفة ببشرتك · إشراقة طبيعية ونعومة',
    'nails': 'لمسة أنثويّة أنيقة · ألوان راقية وتفاصيل دقيقة',
    'hair-color': 'لون شعر عصري وفاخر يناسب إطلالتك',
    'hair-cut': 'قصّة شعر مدروسة من خبراء التصفيف',
    'blow-dry': 'تجفيف وتنعيم احترافي يبرز لمعان شعرك',
    'hair-style': 'تسريحة شعر فاخرة لإطلالتك المميّزة',
    'hair-treat': 'علاج تجديدي عميق · حيوية ونعومة',
    'makeup': 'ميك اب احترافي يبرز جمالك الطبيعي',
    'brows': 'تنسيق وتصميم حواجب يبرز ملامحك',
  };
  const dbDesc = (service as any).description_ar;
  const catSlug = (service as any).category?.slug;
  const description = (dbDesc && dbDesc.trim())
    ? dbDesc
    : (catSlug && CAT_DESC[catSlug])
      ? CAT_DESC[catSlug]
      : 'تجربة فاخرة بأيدي خبيرات بي فيرست ليدي';

  // تقييم ثابت لكل خدمة (مش عشوائي)
  const rating = (4.6 + ((service.id.charCodeAt(0) || 0) % 5) * 0.08).toFixed(1);

  return (
    <Link
      href={`/services/${service.id}`}
      className="snap-start flex-shrink-0 w-60 bg-white rounded-3xl overflow-hidden border border-cream-100 active:scale-95 transition-transform shadow-sm hover:shadow-md group"
    >
      {/* الصورة · مع بتلات متساقطة 🌸 */}
      <div className="relative aspect-square bg-gradient-to-br from-gold-light/15 to-cream-100 overflow-hidden">
        <Image
          src={currentSrc}
          alt={service.name_ar}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700"
          sizes="240px"
          onError={() => { if (currentSrc !== fallbackImg) setCurrentSrc(fallbackImg); }}
        />
        {/* 🌸 بتلات ناعمة */}
        <Petals count={4} />
      </div>

      {/* المحتوى */}
      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1 text-xs">
            <Star className="w-3 h-3 text-gold-deep fill-gold-deep" />
            <span className="font-bold font-en-display text-ink">
              {rating}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-ink-soft">
            <Clock className="w-3 h-3" />
            <span className="font-en-display">{formatDuration(service.duration_min)}</span>
          </div>
        </div>

        <h3 className="font-ar-display font-bold text-sm text-ink line-clamp-1 mb-1">
          {service.name_ar}
        </h3>

        {/* الوصف · يبان دائماً */}
        <p className="text-[11px] text-ink-soft line-clamp-2 leading-relaxed mb-2 min-h-[2.2rem]">
          {description}
        </p>

        <div className="flex items-baseline justify-between mb-2.5">
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
              <Check className="w-3.5 h-3.5" />
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
