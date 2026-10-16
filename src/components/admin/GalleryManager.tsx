/**
 * GalleryManager — إدارة المعرض بالرفع المباشر
 * ═══════════════════════════════════════════════════════════
 * - رفع صور إلى Supabase Storage (bucket: gallery)
 * - إضافتها لجدول gallery تلقائياً
 * - حذف صورة
 * - زر "تمييز" (featured)
 */
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Image as ImageIcon, Upload, Trash2, Star, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { GalleryItem } from '@/types/database';

export default function GalleryManager({ items }: { items: GalleryItem[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const supabase = createClient();

    let okCount = 0;
    let failCount = 0;

    for (const file of Array.from(files)) {
      try {
        // رفع إلى Storage
        const ext = file.name.split('.').pop();
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('gallery')
          .upload(path, file, { cacheControl: '3600', upsert: false });

        if (upErr) {
          console.error(upErr);
          failCount++;
          continue;
        }

        // احصل على URL عام
        const { data: { publicUrl } } = supabase.storage.from('gallery').getPublicUrl(path);

        // أضف إلى جدول gallery عبر API
        const res = await fetch('/api/admin/gallery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: publicUrl,
            is_published: true,
            display_order: items.length + okCount,
          }),
        });

        if (res.ok) okCount++;
        else failCount++;
      } catch (err) {
        console.error(err);
        failCount++;
      }
    }

    setUploading(false);
    if (okCount > 0) {
      toast.success(`تم رفع ${okCount} صورة بنجاح ✨`);
      router.refresh();
    }
    if (failCount > 0) {
      toast.error(`فشل رفع ${failCount} صورة — تأكدي من bucket "gallery" في Supabase Storage`);
    }
  }

  async function toggleFeatured(item: GalleryItem) {
    setBusy(item.id);
    const res = await fetch('/api/admin/gallery', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, is_featured: !item.is_featured }),
    });
    setBusy(null);
    if (res.ok) {
      toast.success(item.is_featured ? 'تمت إزالة التمييز' : 'تم التمييز ⭐');
      router.refresh();
    }
  }

  async function remove(id: string) {
    if (!confirm('متأكدة من حذف هذه الصورة؟')) return;
    setBusy(id);
    const res = await fetch(`/api/admin/gallery?id=${id}`, { method: 'DELETE' });
    setBusy(null);
    if (res.ok) {
      toast.success('تم الحذف');
      router.refresh();
    }
  }

  return (
    <div>
      {/* زر الرفع */}
      <div className="mb-6">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => handleUpload(e.target.files)}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-primary flex items-center gap-2 !py-2.5 text-sm disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري الرفع...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              رفع صور جديدة
            </>
          )}
        </button>
        <p className="text-xs text-ink-soft mt-2">
          يمكنكِ اختيار عدة صور معاً · يُفضّل JPG أو PNG بحجم أقل من 2MB
        </p>
      </div>

      {/* الشبكة */}
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-cream-200">
          <ImageIcon className="w-12 h-12 text-ink-soft/50 mx-auto mb-3" />
          <div className="text-ink-soft text-sm">ما فيه صور في المعرض بعد — ارفعي أول صورة!</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <div key={item.id} className="aspect-square bg-cream-100 rounded-xl overflow-hidden relative group">
              <img
                src={item.image_url}
                alt={item.title_ar || 'صورة من المعرض'}
                className="w-full h-full object-cover"
              />
              {item.is_featured && (
                <div className="absolute top-2 right-2 bg-gold-deep text-cream-50 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> مميّزة
                </div>
              )}
              <div className="absolute inset-0 bg-ink/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => toggleFeatured(item)}
                  disabled={busy === item.id}
                  className="p-2 bg-white rounded-full text-gold-deep hover:scale-110 transition-transform"
                  title={item.is_featured ? 'إزالة التمييز' : 'تمييز'}
                >
                  <Star className={`w-4 h-4 ${item.is_featured ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => remove(item.id)}
                  disabled={busy === item.id}
                  className="p-2 bg-white rounded-full text-danger hover:scale-110 transition-transform"
                  title="حذف"
                >
                  {busy === item.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
