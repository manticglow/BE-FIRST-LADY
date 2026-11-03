/**
 * MyRatingsCard — بطاقة تقييماتي من العميلات
 * ═══════════════════════════════════════════════════════════
 * - متوسّط النجوم + العدد الكلّي
 * - توزيع التقييمات (5 · 4 · 3 · 2 · 1)
 * - آخر 20 تقييم
 */
'use client';

import { useEffect, useState } from 'react';
import { Star, Loader2, Quote } from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  customer_name: string;
  created_at: string;
}

interface Data {
  average: number;
  total: number;
  distribution: Record<number, number>;
  items: Review[];
}

export default function MyRatingsCard() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/account/my-ratings')
      .then((r) => r.json())
      .then((d) => setData({
        average: d.average || 0,
        total: d.total || 0,
        distribution: d.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        items: d.items || [],
      }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-cream-200 rounded-2xl p-6 text-center">
        <Loader2 className="w-5 h-5 animate-spin text-gold-deep mx-auto" />
      </div>
    );
  }

  if (!data || data.total === 0) {
    return (
      <div className="bg-cream-50 border border-cream-200 rounded-2xl p-5 text-center">
        <div className="text-3xl mb-2">⭐</div>
        <div className="font-ar-display font-bold text-ink mb-1">لا يوجد تقييمات بعد</div>
        <p className="text-xs text-ink-soft">
          بتظهر تقييمات العميلات هنا بعد ما يقيّمن جلسات اشتغلتِ عليها
        </p>
      </div>
    );
  }

  const max = Math.max(...Object.values(data.distribution), 1);

  return (
    <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden">
      {/* الملخّص */}
      <div className="bg-gradient-to-br from-gold-deep via-amber-700 to-ink text-cream-50 p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-en-label text-[10px] tracking-[0.25em] opacity-80 mb-1">MY RATINGS</div>
            <div className="flex items-baseline gap-2">
              <span className="font-en-display font-bold text-4xl">{data.average.toFixed(1)}</span>
              <span className="text-xs opacity-80">من 5</span>
            </div>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-0.5 mb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4"
                  fill={i < Math.round(data.average) ? '#facc15' : 'none'}
                  color={i < Math.round(data.average) ? '#facc15' : 'rgba(255,255,255,0.4)'}
                />
              ))}
            </div>
            <div className="text-[11px] opacity-80 text-left">
              {data.total} تقييم
            </div>
          </div>
        </div>
      </div>

      {/* التوزيع */}
      <div className="p-4 space-y-1.5 border-b border-cream-100">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = data.distribution[star] || 0;
          const pct = (count / max) * 100;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-0.5 w-10 shrink-0">
                <span className="font-en-display font-bold text-ink">{star}</span>
                <Star className="w-3 h-3 text-gold-deep" fill="currentColor" />
              </div>
              <div className="flex-1 bg-cream-100 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-gold-light to-gold-deep rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="font-en-display text-ink-soft w-6 text-right">{count}</div>
            </div>
          );
        })}
      </div>

      {/* قائمة التقييمات */}
      {data.items.length > 0 && (
        <div className="p-4">
          <ul className="space-y-2">
            {(expanded ? data.items : data.items.slice(0, 3)).map((r) => (
              <li key={r.id} className="border-r-2 border-gold-light pr-3 py-1">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-3 h-3 text-gold-deep"
                        fill={i < r.rating ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-ink-soft">{r.customer_name}</span>
                </div>
                {r.comment && (
                  <p className="text-xs text-ink-soft italic flex items-start gap-1">
                    <Quote className="w-2.5 h-2.5 text-gold-light shrink-0 mt-1" />
                    <span>{r.comment}</span>
                  </p>
                )}
              </li>
            ))}
          </ul>

          {data.items.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-3 pt-3 border-t border-cream-100 text-xs text-gold-deep font-bold"
            >
              {expanded ? 'إخفاء' : `عرض الكل (${data.items.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
