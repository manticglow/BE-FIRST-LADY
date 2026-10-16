'use client';

import { Star } from 'lucide-react';
import type { Review } from '@/types/database';

export default function ReviewsSection({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) return null;

  return (
    <section id="reviews" className="section-pad">
      <div className="container-brand max-w-5xl">
        <div className="text-center mb-10">
          <span className="heading-eyebrow">WHAT THEY SAY</span>
          <h2 className="font-ar-display text-3xl md:text-4xl font-bold text-gold-deep mt-1">
            ماذا قلن عنّا
          </h2>
          <span className="divider-gold" />
          <p className="font-en-display italic text-ink-soft mt-2">آراء حقيقية من سيّداتنا</p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {reviews.slice(0, 6).map((r) => (
            <article key={r.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gold-light/15">
              <div className="flex gap-0.5 text-gold-light mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4" fill={i < r.rating ? 'currentColor' : 'none'} />
                ))}
              </div>
              {r.comment && (
                <p className="text-sm text-ink leading-relaxed mb-4">"{r.comment}"</p>
              )}
              {(r as any).admin_reply && (
                <div className="bg-gold-light/10 border-r-2 border-gold-deep p-3 rounded-xl mb-4">
                  <div className="text-[10px] font-bold text-gold-deep uppercase mb-1">💛 ردّ Be First Lady</div>
                  <p className="text-xs text-ink leading-relaxed">{(r as any).admin_reply}</p>
                </div>
              )}
              <div className="pt-3 border-t border-cream-200 flex items-center gap-2">
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-light to-gold text-white flex items-center justify-center font-bold">
                  {r.customer_name[0]}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-ink">{r.customer_name}</div>
                  <div className="text-xs text-ink-soft">
                    {new Intl.DateTimeFormat('ar-SA', { year: 'numeric', month: 'long' }).format(new Date(r.created_at))}
                  </div>
                </div>
                {r.is_featured && (
                  <span className="text-[9px] bg-gold-deep text-cream-50 font-bold px-1.5 py-0.5 rounded">⭐</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
