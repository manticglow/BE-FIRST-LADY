/**
 * صفحة التقييم العامة — Public Review Submission
 * ═══════════════════════════════════════════════════════════
 * رابط يُرسَل للعميلة بعد اكتمال الحجز للتقييم
 */
'use client';

import { useState, useEffect, use } from 'react';
import { toast } from 'sonner';
import { Star, Heart, Loader2, Check } from 'lucide-react';

export default function ReviewPage({ params }: { params: Promise<{ bookingNumber: string }> }) {
  const { bookingNumber } = use(params);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!rating) {
      toast.error('اختاري عدد النجوم أولاً 🌟');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_number: bookingNumber, rating, comment: comment.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDone(true);
    } catch (e: any) {
      toast.error(e.message || 'حدث خطأ');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen bg-cream-50 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center border border-gold-light/40">
          <div className="w-16 h-16 rounded-full bg-success/20 mx-auto mb-4 flex items-center justify-center">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h1 className="font-ar-display text-2xl font-bold text-gold-deep mb-2">
            شكراً لكِ 💛
          </h1>
          <p className="text-sm text-ink-soft mb-6">
            رأيكِ وصلنا وسنعرضه بعد المراجعة.<br />
            نرجو أن نراكِ قريباً مرة أخرى 🌸
          </p>
          <a href="/" className="btn-primary inline-block">
            عودة للرئيسية
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-cream-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 border border-gold-light/40">
        <div className="text-center mb-6">
          <div className="font-en-label text-[10px] tracking-[0.3em] text-gold mb-2">
            YOUR OPINION MATTERS
          </div>
          <h1 className="font-ar-display text-2xl font-bold text-gold-deep">
            كيف كانت تجربتكِ معنا؟
          </h1>
          <div className="divider-gold w-16 mx-auto mt-3" />
          <p className="text-xs text-ink-soft mt-3">
            رقم الحجز: <span className="font-en-display font-bold">{bookingNumber}</span>
          </p>
        </div>

        {/* النجوم */}
        <div className="flex items-center justify-center gap-1 mb-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(n)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-9 h-9 transition-colors ${
                  (hoverRating || rating) >= n
                    ? 'fill-gold-deep text-gold-deep'
                    : 'text-cream-300'
                }`}
              />
            </button>
          ))}
        </div>

        {rating > 0 && (
          <div className="text-center text-sm text-ink-soft mb-6">
            {rating === 1 && 'نعتذر — ساعدينا نتحسن 💛'}
            {rating === 2 && 'شكراً — خذي بالك من ملاحظاتكِ'}
            {rating === 3 && 'جيّد — نتطلّع للأفضل'}
            {rating === 4 && 'ممتاز — شكراً لكِ 🌸'}
            {rating === 5 && 'رائعة ✨ شرّفتينا!'}
          </div>
        )}

        {/* التعليق */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-ink-soft mb-2">
            اكتبي رأيكِ (اختياري)
          </label>
          <textarea
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            placeholder="شاركينا تجربتكِ..."
            className="w-full px-3 py-3 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm resize-none"
          />
          <p className="text-[10px] text-ink-soft text-left mt-1 font-en-display">
            {comment.length}/500
          </p>
        </div>

        <button
          onClick={submit}
          disabled={submitting || !rating}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
          إرسال التقييم
        </button>
      </div>
    </main>
  );
}
