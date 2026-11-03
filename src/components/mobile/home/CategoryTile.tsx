/**
 * CategoryTile — بلاطة فئة في شبكة الصفحة الرئيسيّة للموبايل
 */
import Link from 'next/link';
import Image from 'next/image';
import type { Category } from '@/types/database';
import { CATEGORY_ICONS } from './image-picker';

export default function CategoryTile({ category }: { category: Category }) {
  const icon = CATEGORY_ICONS[category.slug];
  return (
    <Link
      href={`/booking?category=${category.slug}`}
      className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-cream-50 via-white to-amber-50/40 border border-gold-light/25 shadow-sm active:scale-95 transition-all p-3 flex flex-col items-center justify-center gap-1.5 hover:border-gold-light/50 hover:shadow-md"
    >
      <div className="absolute top-0 right-0 w-16 h-16 bg-gold-light/20 rounded-full blur-2xl opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/30 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-700 pointer-events-none" />

      <div className="relative">
        {icon ? (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-cream-50 flex items-center justify-center p-2 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 ring-1 ring-gold-light/20">
            <Image
              src={icon}
              alt={category.name_ar}
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-light/20 to-amber-100/30 flex items-center justify-center text-2xl shadow-sm">
            {category.icon || '✨'}
          </div>
        )}
      </div>
      <div className="font-ar-display font-bold text-ink text-xs text-center relative">
        {category.name_ar}
      </div>
      <div className="text-[8px] font-en-label tracking-[0.25em] text-gold-light uppercase relative">
        {category.name_en}
      </div>
    </Link>
  );
}
