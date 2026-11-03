/**
 * SectionHeader — عنوان قسم + رابط "عرض الكل"
 */
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-ar-display text-lg font-bold text-gold-deep">{title}</h2>
      <Link href={href} className="text-xs text-ink-soft hover:text-gold-deep font-semibold flex items-center gap-1">
        عرض الكل
        <ChevronLeft className="w-3 h-3" />
      </Link>
    </div>
  );
}
