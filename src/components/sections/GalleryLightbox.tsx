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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => setOpen(i)}
            className={`relative aspect-square bg-cream-100 rounded-2xl overflow-hidden group ${
              item.is_featured ? 'md:col-span-2 md:row-span-2 md:aspect-auto' : ''
            }`}
          >
            <img
              src={item.image_url}
              alt={item.title_ar || 'Be First Lady'}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-start p-4">
              <div className="flex items-center gap-2 text-cream-50">
                <ZoomIn className="w-4 h-4" />
                <span className="text-xs font-bold">عرض بالكامل</span>
              </div>
            </div>
          </button>
        ))}
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
