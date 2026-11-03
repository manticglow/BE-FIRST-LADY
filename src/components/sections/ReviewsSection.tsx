'use client';

/**
 * ReviewsSection v2 — Editorial marquee + featured spotlight
 * ═══════════════════════════════════════════════════════════
 * - Featured review spotlight (largest · with photos if available)
 * - Horizontal marquee of smaller reviews that auto-scrolls
 * - Pause on hover · supports touch swipe
 */
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Review } from '@/types/database';

export default function ReviewsSection({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;

  // اختاري أول review مميّز (أو الأعلى تقييماً) كـfeatured
  const featured = reviews.find((r) => r.is_featured) || reviews[0];
  const rest = reviews.filter((r) => r.id !== featured.id).slice(0, 10);

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <section id="reviews" className="section-pad relative overflow-hidden">
      {/* زخارف خلفيّة */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-rose-200/20 to-amber-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-64 h-64 bg-gradient-to-br from-amber-200/20 to-pink-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="container-brand max-w-6xl relative">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="heading-eyebrow">WHAT THEY SAY</span>
          <h2 className="font-ar-display text-3xl md:text-4xl font-bold text-gold-deep mt-1">
            ماذا قلن عنّا
          </h2>
          <span className="divider-gold" />

          {/* ratings summary */}
          <div className="inline-flex items-center gap-4 mt-4 px-5 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-gold-light/30 shadow-sm">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-gold-deep text-gold-deep" />
              ))}
            </div>
            <div className="font-en-display font-bold text-lg text-gold-deep">{avgRating}</div>
            <div className="w-px h-5 bg-gold-light/40" />
            <div className="text-xs text-ink-soft">
              من <strong className="font-en-display text-ink">{reviews.length}+</strong> عميلة
            </div>
          </div>
        </div>

        {/* ─── Featured Spotlight ─── */}
        <div className="relative bg-gradient-to-br from-cream-50 via-white to-amber-50/30 rounded-3xl p-6 md:p-10 shadow-xl border border-gold-light/20 mb-10 overflow-hidden">
          {/* Decorative quote */}
          <Quote
            className="absolute top-6 right-6 w-20 h-20 text-gold-light/15 pointer-events-none"
            fill="currentColor"
          />

          <div className="relative grid md:grid-cols-5 gap-6 items-center">
            {/* نصّ التقييم · 3 أعمدة */}
            <div className="md:col-span-3">
              <div className="flex gap-0.5 text-gold-deep mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5"
                    fill={i < featured.rating ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              {featured.comment && (
                <blockquote className="font-ar-display text-xl md:text-2xl text-ink leading-relaxed mb-5 italic">
                  "{featured.comment}"
                </blockquote>
              )}

              {/* صور التقييم (قبل/بعد) */}
              {Array.isArray(featured.image_urls) && featured.image_urls.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-5">
                  {featured.image_urls.slice(0, 4).map((url: string, i: number) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square rounded-xl overflow-hidden border border-gold-light/30 group ring-2 ring-transparent hover:ring-gold-light transition-all"
                    >
                      <img src={url} alt={`صورة ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </a>
                  ))}
                </div>
              )}

              {/* الاسم */}
              <div className="flex items-center gap-3 pt-4 border-t border-gold-light/15">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-light to-gold-deep text-cream-50 flex items-center justify-center font-ar-display font-bold text-xl shadow-md">
                  {featured.customer_name[0]}
                </div>
                <div>
                  <div className="font-bold text-ink">{featured.customer_name}</div>
                  <div className="text-xs text-ink-soft">
                    {new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: 'long' })
                      .format(new Date(featured.created_at))}
                  </div>
                </div>
                {featured.is_featured && (
                  <span className="ml-auto text-[10px] bg-gradient-to-br from-gold-deep to-ink text-cream-50 font-bold px-2 py-1 rounded-full">
                    تقييم مميّز ⭐
                  </span>
                )}
              </div>
            </div>

            {/* ردّ البراند · 2 عمود */}
            {featured.admin_reply && (
              <div className="md:col-span-2">
                <div className="relative bg-gradient-to-br from-gold-deep/5 to-amber-50 border-r-4 border-gold-deep p-5 rounded-2xl">
                  <div className="text-[10px] font-bold text-gold-deep tracking-widest uppercase mb-2">
                    💛 ردّ Be First Lady
                  </div>
                  <p className="text-sm text-ink leading-relaxed">{featured.admin_reply}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Marquee row of other reviews ─── */}
        {rest.length > 0 && <ReviewsMarquee reviews={rest} />}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// Marquee · auto-scrolling horizontal strip
// ═══════════════════════════════════════════════════════════
function ReviewsMarquee({ reviews }: { reviews: Review[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  // دوبل الـitems حتى يكون الـmarquee مستمرّ
  const items = [...reviews, ...reviews];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame: number;
    let offset = 0;
    const SPEED = 0.5; // px per frame

    function step() {
      if (!paused && ref.current) {
        offset += SPEED;
        const width = ref.current.scrollWidth / 2;
        if (offset >= width) offset = 0;
        ref.current.style.transform = `translateX(${offset}px)`;
      }
      frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [paused]);

  return (
    <div className="relative overflow-hidden" dir="ltr">
      {/* Gradient fades */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-cream-50 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-cream-50 to-transparent z-10 pointer-events-none" />

      <div
        ref={ref}
        className="flex gap-4 py-4 will-change-transform"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {items.map((r, idx) => (
          <article
            key={`${r.id}-${idx}`}
            dir="rtl"
            className="shrink-0 w-72 bg-white rounded-2xl p-5 shadow-sm border border-gold-light/15 hover:border-gold-light/40 hover:shadow-md transition-all"
          >
            <div className="flex gap-0.5 text-gold-light mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5" fill={i < r.rating ? 'currentColor' : 'none'} />
              ))}
            </div>
            {r.comment && (
              <p className="text-xs text-ink leading-relaxed mb-3 line-clamp-3">"{r.comment}"</p>
            )}
            <div className="pt-3 border-t border-cream-100 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-light to-gold-deep text-white flex items-center justify-center font-bold text-sm">
                {r.customer_name[0]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-ink truncate">{r.customer_name}</div>
                <div className="text-[10px] text-ink-soft">
                  {new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: 'short' })
                    .format(new Date(r.created_at))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
