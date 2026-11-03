/**
 * GalleryStrip — شريط أفقي لصور المعرض
 */
import Image from 'next/image';
import { GALLERY_IMAGES } from './image-picker';

export default function GalleryStrip() {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 snap-x">
      {GALLERY_IMAGES.map((src, i) => (
        <div
          key={i}
          className="snap-start flex-shrink-0 w-32 h-40 rounded-2xl overflow-hidden shadow-sm border border-cream-200 relative active:scale-95 transition-transform"
        >
          <Image
            src={src}
            alt={`عمل ${i + 1}`}
            fill
            className="object-cover"
            sizes="128px"
          />
        </div>
      ))}
    </div>
  );
}
