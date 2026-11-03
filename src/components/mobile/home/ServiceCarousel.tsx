/**
 * ServiceCarousel + ServiceAppCard + AddToCartServiceCard
 * ═══════════════════════════════════════════════════════════
 * - شريط أفقي من بطاقات الخدمات
 * - زر إضافة للسلة
 * - fallback ذكي للصور
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { Clock, Star, Plus, Check } from 'lucide-react';
import type { Service, Category } from '@/types/database';
import { formatPrice, formatDuration } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import Petals from '@/components/ui/Petals';
import HeartButton from '@/components/ui/HeartButton';
import { pickFallbackImage, slugify } from './image-picker';

type ServiceWithCategory = Service & { category?: Pick<Category, 'slug'> | null };

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

export default function ServiceCarousel({
  services, isLoggedIn,
}: {
  services: ServiceWithCategory[];
  isLoggedIn: boolean;
}) {
  return (
    <div className="mt-3 flex gap-3 overflow-x-auto scrollbar-hide pr-4 pl-4 snap-x">
      {services.map((s) => (
        <ServiceAppCard key={s.id} service={s} isLoggedIn={isLoggedIn} />
      ))}
    </div>
  );
}

function ServiceAppCard({ service, isLoggedIn }: { service: ServiceWithCategory; isLoggedIn: boolean }) {
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

function AddToCartServiceCard({
  service, img, fallbackImg, isLoggedIn,
}: {
  service: ServiceWithCategory;
  img: string;
  fallbackImg: string;
  isLoggedIn: boolean;
}) {
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

  const dbDesc = service.description_ar;
  const catSlug = service.category?.slug;
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
      <div className="relative aspect-square bg-gradient-to-br from-gold-light/15 to-cream-100 overflow-hidden">
        <Image
          src={currentSrc}
          alt={service.name_ar}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700"
          sizes="240px"
          onError={() => { if (currentSrc !== fallbackImg) setCurrentSrc(fallbackImg); }}
        />
        <Petals count={4} />
        <div className="absolute top-2 left-2 z-10">
          <HeartButton serviceId={service.id} size="sm" variant="solid" />
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1 text-xs">
            <Star className="w-3 h-3 text-gold-deep fill-gold-deep" />
            <span className="font-bold font-en-display text-ink">{rating}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-ink-soft">
            <Clock className="w-3 h-3" />
            <span className="font-en-display">{formatDuration(service.duration_min)}</span>
          </div>
        </div>

        <h3 className="font-ar-display font-bold text-sm text-ink line-clamp-1 mb-1">
          {service.name_ar}
        </h3>

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
