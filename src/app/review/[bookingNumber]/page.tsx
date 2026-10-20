/**
 * صفحة التقييم العامة — Public Review Submission
 * ═══════════════════════════════════════════════════════════
 * رابط يُرسَل للعميلة بعد اكتمال الحجز للتقييم
 * - نجوم من 1-5
 * - تعليق اختياري
 * - 📸 رفع حتى 4 صور (قبل/بعد)
 */
'use client';

import { useState, use } from 'react';
import { toast } from 'sonner';
import { Star, Heart, Loader2, Check, Camera, X, ImagePlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const MAX_IMAGES = 4;
const MAX_SIZE_MB = 5;

export default function ReviewPage({ params }: { params: Promise<{ bookingNumber: string }> }) {
  const { bookingNumber } = use(params);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<Array<{ file: File; preview: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function handleImages(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`الحد الأقصى ${MAX_IMAGES} صور`);
      return;
    }

    const toAdd = files.slice(0, remaining).filter((f) => {
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        toast.error(`الصورة "${f.name}" أكبر من ${MAX_SIZE_MB}MB`);
        return false;
      }
      if (!f.type.startsWith('image/')) {
        toast.error('الملف لازم يكون صورة');
        return false;
      }
      return true;
    });

    setImages((prev) => [
      ...prev,
      ...toAdd.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
    e.target.value = ''; // reset input
  }

  function removeImage(idx: number) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function uploadImages(): Promise<string[]> {
    if (images.length === 0) return [];
    const supabase = createClient();
    const urls: string[] = [];

    for (const img of images) {
      const ext = img.file.name.split('.').pop() || 'jpg';
      const path = `reviews/${bookingNumber}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

      const { data, error } = await supabase.storage
        .from('reviews')
        .upload(path, img.file, { cacheControl: '3600', upsert: false });

      if (error) {
        console.error('[Upload] Error:', error);
        toast.error(`فشل رفع "${img.file.name}": ${error.message}`);
        continue;
      }

      // الحصول على الرابط العام
      const { data: urlData } = supabase.storage.from('reviews').getPublicUrl(data.path);
      urls.push(urlData.publicUrl);
    }

    return urls;
  }

  async function submit() {
    if (!rating) {
      toast.error('اختاري عدد النجوم أولاً 🌟');
      return;
    }
    setSubmitting(true);
    try {
      // 1. رفع الصور إذا موجودة
      const image_urls = await uploadImages();

      // 2. إرسال التقييم
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_number: bookingNumber,
          rating,
          comment: comment.trim() || undefined,
          image_urls,
        }),
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
          <p className="text-sm text-ink-soft">تم استلام تقييمكِ بنجاح</p>
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
        <div className="mb-5">
          <label className="block text-xs font-semibold text-ink-soft mb-2">
            اكتبي رأيكِ (اختياري)
          </label>
          <textarea
            rows={3}
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

        {/* ═══ 📸 الصور ═══ */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-ink-soft mb-2 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5" />
            صور قبل/بعد (اختياري · حتى {MAX_IMAGES} صور)
          </label>

          <div className="grid grid-cols-4 gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-cream-200 bg-cream-50">
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-500 transition-colors"
                  aria-label="حذف الصورة"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {images.length < MAX_IMAGES && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-cream-300 hover:border-gold-deep hover:bg-cream-50 flex flex-col items-center justify-center cursor-pointer transition-colors">
                <ImagePlus className="w-5 h-5 text-ink-soft" />
                <span className="text-[10px] text-ink-soft mt-1">إضافة</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImages}
                />
              </label>
            )}
          </div>
          <p className="text-[10px] text-ink-soft mt-1.5">
            🔒 الصور تظهر مع تقييمكِ بعد موافقة الإدارة
          </p>
        </div>

        <button
          onClick={submit}
          disabled={submitting || !rating}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
          {submitting ? 'جارِ الإرسال...' : 'إرسال التقييم'}
        </button>
      </div>
    </main>
  );
}
