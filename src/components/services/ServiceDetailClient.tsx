/**
 * ServiceDetailClient — واجهة صفحة تفاصيل الخدمة
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft, Clock, Star, Plus, Check, ShoppingBag, Calendar,
  Sparkles, LogIn, MessageSquare,
} from 'lucide-react';
import { formatPrice, formatDuration } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import Petals from '@/components/ui/Petals';
import type { Service, Category } from '@/types/database';

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

function getDescription(service: Service & { category?: Category }): string {
  if (service.description_ar && service.description_ar.trim()) return service.description_ar;
  const slug = service.category?.slug;
  if (slug && CATEGORY_DESCRIPTIONS[slug]) return CATEGORY_DESCRIPTIONS[slug];
  return 'تجربة فاخرة بأيدي خبيرات في بي فيرست ليدي · لحظات تدلّل حقيقي تستحقينها';
}

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

interface Props {
  service: Service & { category?: Category };
  reviews: Review[];
  avgRating: number | null;
  isLoggedIn: boolean;
  userName?: string;
}

function slugify(n: string) { return n.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

export default function ServiceDetailClient({ service, reviews, avgRating, isLoggedIn }: Props) {
  const cart = useCart();
  const router = useRouter();
  const inCart = cart.has(service.id);
  const [imgSrc, setImgSrc] = useState(
    service.image_url || `/images/services/${slugify(service.name_en)}.jpg`
  );

  function requireAuth(action: 'add' | 'book'): boolean {
    if (!isLoggedIn) {
      toast.error('لازم تسجّلي دخول أولاً', { icon: '🔒' });
      setTimeout(() => router.push(`/login?redirect=/services/${service.id}`), 800);
      return false;
    }
    return true;
  }

  function handleAddToCart() {
    if (!requireAuth('add')) return;
    if (inCart) {
      cart.remove(service.id);
      toast('تم الإزالة من السلة', { icon: '🗑️' });
    } else {
      cart.add(service.id);
      toast.success(`أُضيفت للسلة 🌸`);
    }
  }

  function handleBookNow() {
    if (!requireAuth('book')) return;
    router.push(`/booking?service=${service.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* ═══ Header مع زر الرجوع ═══ */}
      <div className="px-4 py-2 flex items-center justify-between">
        <Link
          href="/services"
          className="w-10 h-10 rounded-full bg-white shadow-sm border border-cream-200 hover:bg-cream-50 flex items-center justify-center text-ink-soft hover:text-gold-deep transition-colors"
          aria-label="رجوع"
        >
          <ArrowLeft className="w-5 h-5 rotate-180" />
        </Link>
        <Link
          href="/cart"
          className="relative w-10 h-10 rounded-full bg-white shadow-sm border border-cream-200 hover:bg-cream-50 flex items-center justify-center text-ink-soft hover:text-gold-deep transition-colors"
          aria-label="السلة"
        >
          <ShoppingBag className="w-5 h-5" />
          {cart.count > 0 && (
            <span className="absolute -top-1 -right-1 bg-gold-deep text-cream-50 rounded-full min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-en-display font-bold shadow">
              {cart.count}
            </span>
          )}
        </Link>
      </div>

      {/* ═══ الصورة الكبيرة · مع بتلات ناعمة ═══ */}
      <div className="group relative aspect-[4/3] md:aspect-[16/9] bg-gradient-to-br from-gold-light/15 to-cream-100 mx-4 rounded-3xl overflow-hidden mt-2 shadow-md">
        <Image
          src={imgSrc}
          alt={service.name_ar}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 768px"
          onError={() => setImgSrc('/images/gallery/bridal-look.jpg')}
        />
        {/* 🌸 بتلات */}
        <Petals count={6} />
      </div>

      {/* ═══ المحتوى ═══ */}
      <div className="px-4 pt-5 pb-6">

        {/* الفئة · عنوان · تقييم */}
        <div className="mb-3">
          {service.category && (
            <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mb-1">
              {service.category.name_en?.toUpperCase() || 'SERVICE'}
            </div>
          )}
          <h1 className="font-ar-display text-2xl md:text-3xl font-bold text-gold-deep leading-tight">
            {service.name_ar}
          </h1>
          <p className="font-en-display italic text-sm text-gold-light mt-1">
            {service.name_en}
          </p>

          {/* تقييم + مدة */}
          <div className="flex items-center gap-3 mt-3 text-sm">
            {avgRating !== null && (
              <div className="flex items-center gap-1 bg-gold-light/15 text-gold-deep font-bold rounded-full px-3 py-1">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="font-en-display">{avgRating.toFixed(1)}</span>
                <span className="text-[10px] text-ink-soft font-normal">({reviews.length})</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-ink-soft">
              <Clock className="w-4 h-4" />
              <span className="font-en-display">{formatDuration(service.duration_min)}</span>
            </div>
          </div>
        </div>

        {/* السعر */}
        <div className="bg-gradient-to-l from-gold-light/15 to-transparent rounded-2xl p-4 mb-5 flex items-baseline justify-between">
          <span className="text-xs text-ink-soft">السعر</span>
          <div className="flex items-baseline gap-1.5">
            {service.price_from && (
              <span className="text-xs text-ink-soft">يبدأ من</span>
            )}
            <span className="font-en-display font-bold text-2xl md:text-3xl text-gold-deep">
              {formatPrice(service.price, { showFrom: false })}
            </span>
          </div>
        </div>

        {/* الوصف · يبان دائماً */}
        <section className="mb-6">
          <h2 className="font-ar-display text-lg font-bold text-ink mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold-deep" />
            عن هذه الخدمة
          </h2>
          <p className="text-sm text-ink-soft leading-relaxed">
            {getDescription(service)}
          </p>
        </section>

        {/* الملاحظات */}
        {service.notes_ar && (
          <section className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <h3 className="font-ar-display font-bold text-amber-900 text-sm mb-1">
              ⚠️ ملاحظات مهمة
            </h3>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              {service.notes_ar}
            </p>
          </section>
        )}

        {/* ═══ التقييمات ═══ */}
        <section className="mb-6">
          <h2 className="font-ar-display text-lg font-bold text-ink mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-gold-deep fill-gold-deep" />
            تقييمات العميلات
          </h2>
          {reviews.length === 0 ? (
            <div className="bg-white border border-cream-200 rounded-2xl p-6 text-center">
              <div className="text-3xl mb-2">⭐</div>
              <p className="text-sm text-ink-soft">
                لسه ما فيه تقييمات لهذه الخدمة · كوني أول من يجربها!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ═══ أزرار ثابتة في الأسفل · مع safe area للـiPhone والمتصفحات ═══ */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 bg-white/98 backdrop-blur-md border-t border-cream-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}
      >
        <div className="max-w-3xl mx-auto px-4 pt-3 flex items-center gap-2">
          {!isLoggedIn ? (
            <Link
              href={`/login?redirect=/services/${service.id}`}
              className="flex-1 bg-gradient-to-br from-gold-deep to-ink text-cream-50 font-ar-display font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-gold-deep/20 hover:scale-[1.02] transition-transform"
            >
              <LogIn className="w-4 h-4" />
              سجّلي دخول للحجز
            </Link>
          ) : (
            <>
              <button
                onClick={handleAddToCart}
                className={`flex-1 font-ar-display font-bold py-3 rounded-2xl flex items-center justify-center gap-2 transition-all ${
                  inCart
                    ? 'bg-gold-deep text-cream-50 shadow-lg shadow-gold-deep/20'
                    : 'bg-cream-50 text-gold-deep border-2 border-gold-light hover:bg-gold-light/10'
                }`}
              >
                {inCart ? <><Check className="w-4 h-4" /> في السلة</> : <><Plus className="w-4 h-4" /> أضيفي للسلة</>}
              </button>
              <button
                onClick={handleBookNow}
                className="flex-1 bg-gradient-to-br from-gold-deep to-ink text-cream-50 font-ar-display font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-gold-deep/20 hover:scale-[1.02] transition-transform"
              >
                <Calendar className="w-4 h-4" />
                احجزي الآن
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const stars = Array.from({ length: 5 }, (_, i) => i < review.rating);
  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gold-light/20 flex items-center justify-center text-gold-deep font-bold text-sm shrink-0">
            {review.customer_name.charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-ink truncate">{review.customer_name}</div>
            <div className="text-[10px] text-ink-soft font-en-display">
              {new Date(review.created_at).toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>
        <div className="flex gap-0.5 shrink-0">
          {stars.map((filled, i) => (
            <Star
              key={i}
              className={`w-3 h-3 ${filled ? 'text-gold-deep fill-gold-deep' : 'text-cream-200'}`}
            />
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="text-xs text-ink-soft leading-relaxed border-t border-cream-100 pt-2">
          {review.comment}
        </p>
      )}
    </div>
  );
}
