/**
 * GallerySection — قسم المعرض (استخدم GalleryLightbox الفاخر)
 */
import GalleryLightbox from './GalleryLightbox';
import type { GalleryItem } from '@/types/database';

export default function GallerySection({ items }: { items: GalleryItem[] }) {
  return (
    <section id="gallery" className="section-pad">
      <div className="container-brand">
        <div className="text-center mb-10">
          <span className="heading-eyebrow">OUR WORK</span>
          <h2 className="font-ar-display text-3xl md:text-4xl font-bold text-gold-deep mt-1">من معرض أعمالنا</h2>
          <span className="divider-gold" />
          <p className="font-en-display italic text-ink-soft mt-2">A Glimpse of Our Craft</p>
        </div>

        <GalleryLightbox items={items} />
      </div>
    </section>
  );
}
