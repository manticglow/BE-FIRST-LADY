/**
 * ImageUploader — رفع صورة + معاينة
 * ═══════════════════════════════════════════════════════════
 * - يدعم: رفع ملف · لصق URL يدوي · مسح الصورة
 * - preview فوري قبل الرفع
 * - يرجّع الـURL عبر onChange
 */
'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, Link as LinkIcon, X, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  folder?: string;
  label?: string;
  aspectRatio?: '1/1' | '4/5' | '16/9';
}

export default function ImageUploader({
  value, onChange, folder = 'services', label = 'صورة الخدمة',
  aspectRatio = '4/5',
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    const toastId = toast.loading('جاري الرفع...');

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);

      const res = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();

      toast.dismiss(toastId);
      if (data.ok) {
        onChange(data.url);
        toast.success('رفعتها لكِ ✨');
      } else {
        toast.error(data.error || 'تعثّر الرفع');
      }
    } catch {
      toast.dismiss(toastId);
      toast.error('تعثّر الاتّصال');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function applyUrl() {
    if (!urlInput.trim()) {
      toast.error('ألصقي رابط الصورة');
      return;
    }
    try {
      new URL(urlInput);  // تحقّق من صلاحيّة الـURL
      onChange(urlInput.trim());
      setShowUrlInput(false);
      setUrlInput('');
      toast.success('تمّ الربط');
    } catch {
      toast.error('رابط غير صحيح');
    }
  }

  function clear() {
    if (!confirm('حذف الصورة؟')) return;
    onChange(null);
  }

  return (
    <div>
      <label className="block text-xs font-bold text-ink-soft mb-2">{label}</label>

      {/* Preview */}
      {value ? (
        <div className="relative mb-3" style={{ aspectRatio }}>
          <Image
            src={value}
            alt="معاينة الصورة"
            fill
            className="object-cover border border-cream-200"
            style={{ borderRadius: '2px' }}
            unoptimized={value.startsWith('http') && !value.includes('supabase')}
          />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 left-2 w-8 h-8 bg-white/95 hover:bg-rose-100 hover:text-rose-600 text-ink-soft flex items-center justify-center transition-colors shadow"
            style={{ borderRadius: '2px' }}
            aria-label="حذف الصورة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          className="bg-cream-50 border-2 border-dashed border-cream-300 flex flex-col items-center justify-center text-ink-soft text-xs mb-3"
          style={{ aspectRatio, borderRadius: '2px' }}
        >
          <ImageIcon className="w-8 h-8 opacity-30 mb-1" aria-hidden="true" />
          <span>لا توجد صورة بعد</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2">
        {/* زرّ رفع ملف */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full bg-ink hover:bg-gold-deep text-cream-50 py-2.5 text-[12px] font-bold uppercase flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          style={{ borderRadius: '2px', letterSpacing: '0.1em' }}
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          {value ? 'استبدال الصورة' : 'رفع من الجهاز'}
        </button>

        {/* URL manual */}
        {!showUrlInput ? (
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="w-full border border-cream-300 hover:bg-cream-50 text-ink-soft py-2 text-[11px] font-bold flex items-center justify-center gap-2 transition-colors"
            style={{ borderRadius: '2px' }}
          >
            <LinkIcon className="w-3 h-3" />
            أو ألصقي رابط صورة
          </button>
        ) : (
          <div className="flex gap-1.5">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://..."
              className="inp text-[11px] !py-2"
              dir="ltr"
              autoFocus
            />
            <button
              type="button"
              onClick={applyUrl}
              className="shrink-0 bg-ink text-cream-50 px-3 text-[11px] font-bold"
              style={{ borderRadius: '2px' }}
            >
              حفظ
            </button>
            <button
              type="button"
              onClick={() => { setShowUrlInput(false); setUrlInput(''); }}
              className="shrink-0 bg-cream-100 text-ink-soft px-3 text-[11px] font-bold"
              style={{ borderRadius: '2px' }}
            >
              إلغاء
            </button>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      <p className="text-[10px] text-ink-soft mt-2 leading-relaxed">
        💡 JPG · PNG · WebP · حدّ أقصى 5MB · تُعرض بنسبة {aspectRatio.replace('/', ':')}
      </p>
    </div>
  );
}
