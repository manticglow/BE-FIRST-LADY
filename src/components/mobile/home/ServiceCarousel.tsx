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
import { formatDuration } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import HeartButton from '@/components/ui/HeartButton';
import { pickFallbackImage, slugify } from './image-picker';

type ServiceWithCategory = Service & { category?: Pick<Category, 'slug'> | null };

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

  // تقييم ثابت لكل خدمة (مش عشوائي)
  const rating = (4.6 + ((service.id.charCodeAt(0) || 0) % 5) * 0.08).toFixed(1);

  return (
    <Link
      href={`/services/${service.id}`}
      className="snap-start flex-shrink-0 w-[260px] bg-white rounded-[22px] overflow-hidden active:scale-[0.98] transition-transform shadow-card hover:shadow-gold-soft group"
    >
      <div className="relative h-[140px] bg-gradient-to-br from-rose-blush/40 via-gold-light/30 to-cream-100 overflow-hidden">
        <Image
          src={currentSrc}
          alt={service.name_ar}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="260px"
          onError={() => { if (currentSrc !== fallbackImg) setCurrentSrc(fallbackImg); }}
        />
        {/* Tag */}
        {service.price_from && (
          <div className="absolute top-2.5 right-2.5 z-10 backdrop-blur-md bg-white/85 text-gold-deep text-[9px] font-bold tracking-[0.1em] px-2 py-1 rounded-full">
            SIGNATURE
          </div>
        )}
        {/* Heart (right-side for RTL) */}
        <div className="absolute top-2 left-2 z-10">
          <HeartButton serviceId={service.id} size="sm" variant="solid" />
        </div>
      </div>

      <div className="p-3.5">
        <h3 className="font-en-display text-[16px] font-medium text-ink mb-1 leading-tight line-clamp-1">
          {service.name_ar}
        </h3>

        <div className="flex items-center gap-3 text-[10.5px] text-ink-soft mb-2.5">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(service.duration_min)}
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-gold-deep fill-gold-deep" />
            {rating}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-cream-100">
          <div className="font-en-display font-medium text-[18px] text-gold-deep leading-none">
            <span className="text-[9px] font-body text-ink-soft font-normal mr-1">ر.س</span>
            {service.price}
          </div>

          <button
            onClick={handleAdd}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center transition-all
              ${inCart
                ? 'bg-success text-white'
                : 'bg-ink text-cream-50 hover:bg-gold-deep active:scale-90'
              }
            `}
            aria-label={inCart ? 'في السلة' : 'أضيفي للسلة'}
          >
            {inCart ? <Check className="w-4 h-4" strokeWidth={2.5} /> : <Plus className="w-4 h-4" strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </Link>
  );
}
