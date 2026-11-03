/**
 * GalleryLightbox — عارض معرض فاخر بـ Lightbox
 * ═══════════════════════════════════════════════════════════
 * - شبكة متجاوبة بطبقة zoom
 * - عرض الصورة بشاشة كاملة مع تنقّل
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import type { GalleryItem } from '@/types/database';

export default function GalleryLightbox({ items }: { items: GalleryItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const next = useCallback(() => {
    if (open === null) return;
    setOpen((open + 1) % items.length);
  }, [open, items.length]);
  const prev = useCallback(() => {
    if (open === null) return;
    setOpen((open - 1 + items.length) % items.length);
  }, [open, items.length]);

  // لوحة المفاتيح
  useEffect(() => {
    if (open === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') prev();
      if (e.key === 'ArrowLeft') next();
    };
    window.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, close, next, prev]);

  return (
    <>
      {/* ─── Masonry via CSS columns ─── */}
      <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
        {items.map((item, i) => {
          // ارتفاعات متنوّعة لـorganic masonry
          const heights = ['aspect-[3/4]', 'aspect-square', 'aspect-[4/5]', 'aspect-[3/4]'];
          const heightClass = item.is_featured ? 'aspect-[2/3]' : heights[i % heights.length];
          return (
            <button
              key={item.id}
              onClick={() => setOpen(i)}
              className={`relative w-full bg-cream-100 rounded-2xl overflow-hidden group block mb-3 break-inside-avoid ${heightClass}`}
            >
              <img
                src={item.image_url}
                alt={item.title_ar || 'Be First Lady'}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              {/* overlay gradient على الصورة · دائماً خفيف · يقوى عند الـhover */}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/0 to-transparent opacity-30 group-hover:opacity-80 transition-opacity" />

              {/* badge "مميّزة" */}
              {item.is_featured && (
                <div className="absolute top-3 right-3 px-2 py-1 bg-gradient-to-br from-gold-deep to-ink text-cream-50 text-[10px] font-bold rounded-full shadow-lg">
                  ⭐ مميّزة
                </div>
              )}

              {/* معلومات الصورة · تظهر عند الـhover */}
              <div className="absolute inset-x-0 bottom-0 p-4 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                {item.title_ar && (
                  <div className="font-ar-display font-bold text-cream-50 text-sm mb-1">
                    {item.title_ar}
                  </div>
                )}
                <div className="flex items-center gap-1 text-cream-50 text-[11px] bg-black/30 backdrop-blur-sm w-fit px-2 py-1 rounded-full">
                  <ZoomIn className="w-3 h-3" />
                  <span className="font-bold">عرض كامل</span>
                </div>
              </div>

              {/* إطار ذهبي يظهر عند الـhover */}
              <div className="absolute inset-0 border-2 border-gold-light/0 group-hover:border-gold-light/60 rounded-2xl transition-colors pointer-events-none" />
            </button>
          );
        })}
      </div>

      {/* Lightbox */}
      {open !== null && items[open] && (
        <div
          onClick={close}
          className="fixed inset-0 z-[999] bg-ink/95 backdrop-blur-md flex items-center justify-center animate-fade-in"
        >
          {/* زر الإغلاق */}
          <button
            onClick={close}
            className="absolute top-6 right-6 z-10 p-3 bg-cream-50/10 hover:bg-cream-50/20 rounded-full text-cream-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* عدّاد */}
          <div className="absolute top-6 left-6 z-10 bg-cream-50/10 px-4 py-2 rounded-full text-cream-50 font-en-display text-sm">
            {open + 1} / {items.length}
          </div>

          {/* السابق */}
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute right-4 md:right-8 z-10 p-3 bg-cream-50/10 hover:bg-cream-50/20 rounded-full text-cream-50 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* التالي */}
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute left-4 md:left-8 z-10 p-3 bg-cream-50/10 hover:bg-cream-50/20 rounded-full text-cream-50 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* الصورة */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-6xl max-h-[85vh] mx-4"
          >
            <img
              src={items[open].image_url}
              alt={items[open].title_ar || 'Gallery'}
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            />
            {items[open].title_ar && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/80 to-transparent p-6 rounded-b-xl">
                <div className="font-ar-display text-cream-50 text-xl">
                  {items[open].title_ar}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
