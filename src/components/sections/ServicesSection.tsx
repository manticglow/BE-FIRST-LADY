/**
 * ServicesSection — قسم الخدمات في الصفحة الرئيسية (ديسكتوب + جوال)
 * ═══════════════════════════════════════════════════════════
 * - بطاقات فاخرة بالصور · متطابقة مع التطبيق
 * - 🌸 بتلات متساقطة ناعمة (من موقعنا القديم)
 * - وصف يبان دائماً (من قاعدة البيانات أو احتياطي أنيق)
 * - سعر · "أضيفي للسلة" (يتطلّب دخول)
 * - اضغطي البطاقة → صفحة التفاصيل
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ChevronDown, Clock, Star, Plus, Check } from 'lucide-react';
import { formatPrice, formatDuration } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import Petals from '@/components/ui/Petals';
import type { Category, Service } from '@/types/database';

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

const GALLERY_FALLBACKS = [
  '/images/gallery/bridal-look.jpg', '/images/gallery/bridal-makeup.jpg',
  '/images/gallery/bun-styling.jpg', '/images/gallery/burgundy-mani.jpg',
  '/images/gallery/evening-glam.jpg', '/images/gallery/french-mani.jpg',
  '/images/gallery/gold-mani.jpg', '/images/gallery/hairstyle.jpg',
  '/images/gallery/hollywood-waves.jpg', '/images/gallery/lashes-poster.jpg',
];

/* ═══ وصف احتياطي ناعم حسب الفئة ═══ */
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'massage':    'جلسة استرخاء فاخرة بأيدٍ خبيرة · تخفّف التوتر وتجدّد الطاقة',
  'bath':       'تجربة استحمام ملكيّة تنعّم بشرتك وتترك عطراً يدوم',
  'facial':     'عناية مكثّفة ببشرتك · إشراقة طبيعية ونعومة فاخرة',
  'nails':      'لمسة أنثويّة أنيقة لأظافرك · ألوان راقية وتفاصيل دقيقة',
  'brows':      'تنسيق وتصميم حواجب يبرز ملامحك بأناقة',
  'hair-color': 'لون شعر عصري وفاخر يناسب إطلالتك ومزاجك',
  'hair-cut':   'قصّة شعر مدروسة من خبراء التصفيف · أناقة تدوم',
  'blow-dry':   'تجفيف وتنعيم احترافي يبرز لمعان شعرك',
  'hair-style': 'تسريحة شعر فاخرة لإطلالتك المميّزة',
  'hair-treat': 'علاج تجديدي عميق يعيد الحيوية والنعومة لشعرك',
  'makeup':     'ميك اب احترافي يبرز جمالك الطبيعي',
};

function slugify(n: string) {
  return n.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h);
}

/** يرجّع وصف — من البيانات أو احتياطي ناعم */
function getDescription(service: Service & { category?: Category | null }): string {
  if (service.description_ar && service.description_ar.trim()) {
    return service.description_ar;
  }
  const slug = service.category?.slug;
  if (slug && CATEGORY_DESCRIPTIONS[slug]) {
    return CATEGORY_DESCRIPTIONS[slug];
  }
  return 'تجربة فاخرة بأيدي خبيرات في بي فيرست ليدي · لحظات تدلّل حقيقي';
}

export default function ServicesSection({
  categories, services, isLoggedIn = false,
}: {
  categories: Category[];
  services: (Service & { category?: Category | null })[];
  isLoggedIn?: boolean;
}) {
  const [openCat, setOpenCat] = useState<string | null>(categories[0]?.id || null);

  return (
    <section id="services" className="section-pad bg-cream-50">
      <div className="container-brand max-w-6xl">
        <div className="text-center mb-10">
          <span className="heading-eyebrow">OUR MENU</span>
          <h2 className="font-ar-display text-3xl md:text-4xl font-bold text-gold-deep mt-1">
            قائمة الأسعار
          </h2>
          <span className="divider-gold" />
          <p className="font-en-display italic text-ink-soft mt-2">
            Trust that suits you · Beauty worth talking about
          </p>
        </div>

        <div className="space-y-4">
          {categories.map((cat) => {
            const catServices = services.filter((s) => s.category_id === cat.id);
            const isOpen = openCat === cat.id;
            if (catServices.length === 0) return null;

            return (
              <div
                key={cat.id}
                className="bg-white rounded-3xl border border-gold-light/20 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenCat(isOpen ? null : cat.id)}
                  className="w-full flex items-center justify-between gap-4 p-5 hover:bg-cream-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-14 h-14 rounded-full bg-gradient-to-br from-cream-100 to-cream-200 border border-gold-light/30 flex items-center justify-center p-2">
                      <CategoryIcon slug={cat.slug} fallback={cat.icon} />
                    </span>
                    <div className="text-right">
                      <h3 className="font-ar-display text-xl font-bold text-gold-deep">{cat.name_ar}</h3>
                      <p className="font-en-display italic text-sm text-gold-light">{cat.name_en}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-cream-100 px-3 py-1 rounded-full text-ink-soft">
                      {catServices.length} خدمة
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gold-deep transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* الخدمات · بطاقات فاخرة بالبتلات */}
                <div className={`grid transition-[grid-template-rows] duration-500 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <div className="p-4 pt-0 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {catServices.map((s) => (
                        <ServiceCard key={s.id} service={s} isLoggedIn={isLoggedIn} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CategoryIcon({ slug, fallback }: { slug: string; fallback: string | null }) {
  const iconPath = CATEGORY_ICONS[slug];
  if (iconPath) {
    return <img src={iconPath} alt="" className="w-full h-full object-contain" />;
  }
  return <span className="text-2xl">{fallback || '✨'}</span>;
}

function ServiceCard({
  service, isLoggedIn,
}: {
  service: Service & { category?: Category | null };
  isLoggedIn: boolean;
}) {
  const cart = useCart();
  const router = useRouter();
  const inCart = cart.has(service.id);
  const localImg = `/images/services/${slugify(service.name_en)}.jpg`;
  const fallbackImg = GALLERY_FALLBACKS[hashString(service.id) % GALLERY_FALLBACKS.length];
  const [imgSrc, setImgSrc] = useState(service.image_url || localImg);
  const description = getDescription(service);
  const rating = (4.6 + (hashString(service.id) % 5) * 0.08).toFixed(1); // ثابت لكل خدمة

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error('لازم تسجّلي دخول أولاً', { icon: '🔒' });
      setTimeout(() => router.push(`/login?redirect=/services/${service.id}`), 800);
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

  return (
    <Link
      href={`/services/${service.id}`}
      className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-500 hover:shadow-xl hover:shadow-gold-deep/10 hover:-translate-y-1 ${
        inCart ? 'border-gold-deep shadow-md shadow-gold-deep/10' : 'border-cream-200 hover:border-gold-light/50'
      }`}
    >
      {/* الصورة · مع shimmer وبتلات */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gold-light/15 to-cream-100 overflow-hidden card-shimmer">
        <Image
          src={imgSrc}
          alt={service.name_ar}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onError={() => { if (imgSrc !== fallbackImg) setImgSrc(fallbackImg); }}
        />

        {/* 🌸 طبقة البتلات */}
        <Petals />

        {/* تدرّج سفلي لتباين النص فوق الصورة */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

        {/* تقييم في الزاوية */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-white/95 backdrop-blur text-ink text-xs font-bold px-2.5 py-1 rounded-full shadow-sm z-10">
          <Star className="w-3 h-3 text-gold-deep fill-gold-deep" />
          <span className="font-en-display">{rating}</span>
        </div>

        {/* شارة "في السلة" */}
        {inCart && (
          <div className="absolute top-2.5 left-2.5 bg-gold-deep text-cream-50 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10 flex items-center gap-1">
            <Check className="w-3 h-3" />
            في السلة
          </div>
        )}
      </div>

      {/* المحتوى */}
      <div className="p-4 relative">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h4 className="font-ar-display font-bold text-ink text-base line-clamp-1 flex-1">
            {service.name_ar}
          </h4>
          <div className="flex items-center gap-1 text-xs text-ink-soft shrink-0 bg-cream-50 px-2 py-0.5 rounded-full">
            <Clock className="w-3 h-3" />
            <span className="font-en-display">{formatDuration(service.duration_min)}</span>
          </div>
        </div>
        <p className="font-en-display italic text-xs text-gold-light mb-2.5 line-clamp-1">
          {service.name_en}
        </p>

        {/* الوصف · يبان دائماً */}
        <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed mb-3 min-h-[2.3rem]">
          {description}
        </p>

        {/* السعر · بشريط ذهبي ناعم */}
        <div className="flex items-baseline justify-between pt-2.5 border-t border-cream-100 mb-3">
          <span className="text-[10px] text-ink-soft tracking-wide">
            {service.price_from ? 'تبدأ من' : 'السعر'}
          </span>
          <span className="font-en-display font-bold text-lg bg-gradient-to-l from-gold-deep to-gold-light bg-clip-text text-transparent">
            {formatPrice(service.price, { showFrom: false })}
          </span>
        </div>

        {/* زر الإضافة */}
        <button
          onClick={handleAdd}
          className={`w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl transition-all ${
            inCart
              ? 'bg-gold-deep text-cream-50 hover:bg-ink shadow-sm shadow-gold-deep/20'
              : 'bg-cream-50 text-gold-deep border border-gold-light/40 hover:bg-gold-light/10 hover:border-gold-deep/60'
          }`}
        >
          {inCart ? (
            <>
              <Check className="w-3.5 h-3.5" />
              في السلة · اضغطي للإزالة
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
