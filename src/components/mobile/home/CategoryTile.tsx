/**
 * CategoryTile — بلاطة فئة ناعمة فاخرة (التصميم الحديث)
 * ═══════════════════════════════════════════════════════════
 * • حاوية بيضاء مع shadow ناعم · ما في حدود سميكة
 * • أيقونة مع خلفيّة ذهبيّة مُتدرّجة لمّا نشطة
 * • اسم عربي قصير بتوسيط
 */
import Link from 'next/link';
import Image from 'next/image';
import type { Category } from '@/types/database';
import { CATEGORY_ICONS } from './image-picker';

export default function CategoryTile({
  category,
  active = false,
}: {
  category: Category;
  active?: boolean;
}) {
  const icon = CATEGORY_ICONS[category.slug];

  return (
    <Link
      href={`/services?category=${category.slug}`}
      className="group flex flex-col items-center gap-2 shrink-0 cursor-pointer"
    >
      <div
        className={`
          w-[60px] h-[60px] rounded-[20px] flex items-center justify-center
          transition-all duration-300
          ${active
            ? 'bg-gradient-to-br from-gold-light to-gold text-white shadow-gold-soft -translate-y-0.5'
            : 'bg-white shadow-card group-hover:-translate-y-0.5 group-hover:shadow-gold-soft'
          }
        `}
      >
        {icon ? (
          <Image
            src={icon}
            alt={category.name_ar}
            width={34}
            height={34}
            className={`object-contain transition-all ${active ? 'brightness-0 invert' : ''}`}
          />
        ) : (
          <span className="text-2xl">{category.icon || '✨'}</span>
        )}
      </div>
      <div className={`text-[10.5px] font-semibold text-center leading-tight ${active ? 'text-gold-deep' : 'text-ink'}`}>
        {category.name_ar}
      </div>
    </Link>
  );
}
