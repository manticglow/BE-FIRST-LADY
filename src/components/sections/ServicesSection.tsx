/**
 * ServicesSection — قسم الخدمات في الصفحة الرئيسية (ديسكتوب + جوال)
 * ═══════════════════════════════════════════════════════════
 * - بطاقات فاخرة بالصور · متطابقة مع التطبيق
 * - وصف مختصر · سعر · "أضيفي للسلة"
 * - اضغطي البطاقة → صفحة التفاصيل
 * - تتطلّب تسجيل دخول للسلة
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

function slugify(n: string) {
  return n.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h);
}

export default function ServicesSection({
  categories, services, isLoggedIn = false,
}: {
  categories: Category[];
  services: Service[];
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

                {/* الخدمات · بطاقات فاخرة */}
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

function ServiceCard({ service, isLoggedIn }: { service: Service; isLoggedIn: boolean }) {
  const cart = useCart();
  const router = useRouter();
  const inCart = cart.has(service.id);
  const localImg = `/images/services/${slugify(service.name_en)}.jpg`;
  const fallbackImg = GALLERY_FALLBACKS[hashString(service.id) % GALLERY_FALLBACKS.length];
  const [imgSrc, setImgSrc] = useState(service.image_url || localImg);

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
      className={`group bg-white rounded-2xl overflow-hidden border transition-all hover:shadow-lg hover:-translate-y-0.5 ${
        inCart ? 'border-gold-deep shadow-sm' : 'border-cream-200'
      }`}
    >
      {/* الصورة */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gold-light/15 to-cream-100 overflow-hidden">
        <Image
          src={imgSrc}
          alt={service.name_ar}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          onError={() => { if (imgSrc !== fallbackImg) setImgSrc(fallbackImg); }}
        />
        {/* تقييم في الزاوية */}
        <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur text-ink text-xs font-bold px-2 py-0.5 rounded-full">
          <Star className="w-3 h-3 text-gold-deep fill-gold-deep" />
          <span className="font-en-display">{(4.5 + Math.random() * 0.5).toFixed(1)}</span>
        </div>
      </div>

      {/* المحتوى */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-1.5">
          <h4 className="font-ar-display font-bold text-ink text-base line-clamp-1 flex-1">
            {service.name_ar}
          </h4>
          <div className="flex items-center gap-1 text-xs text-ink-soft shrink-0">
            <Clock className="w-3 h-3" />
            <span className="font-en-display">{formatDuration(service.duration_min)}</span>
          </div>
        </div>
        <p className="font-en-display italic text-xs text-gold-light mb-2">{service.name_en}</p>

        {/* الوصف */}
        {service.description_ar && (
          <p className="text-xs text-ink-soft line-clamp-2 leading-relaxed mb-3 min-h-[2.3rem]">
            {service.description_ar}
          </p>
        )}

        {/* السعر */}
        <div className="flex items-baseline justify-between pt-2 border-t border-cream-100 mb-3">
          <span className="text-[10px] text-ink-soft">
            {service.price_from ? 'تبدأ من' : 'السعر'}
          </span>
          <span className="font-en-display font-bold text-lg text-gold-deep">
            {formatPrice(service.price, { showFrom: false })}
          </span>
        </div>

        {/* زر الإضافة */}
        <button
          onClick={handleAdd}
          className={`w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl transition-colors ${
            inCart
              ? 'bg-gold-deep text-cream-50 hover:bg-ink'
              : 'bg-cream-50 text-gold-deep border border-gold-light/40 hover:bg-gold-light/10'
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
