'use client';

import { useState } from 'react';
import { ChevronDown, Clock, Plus } from 'lucide-react';
import { formatPrice, formatDuration } from '@/lib/utils';
import type { Category, Service } from '@/types/database';

export default function ServicesSection({
  categories, services
}: {
  categories: Category[];
  services: Service[];
}) {
  const [openCat, setOpenCat] = useState<string | null>(categories[0]?.id || null);

  return (
    <section id="services" className="section-pad bg-cream-50">
      <div className="container-brand max-w-5xl">
        <div className="text-center mb-10">
          <span className="heading-eyebrow">OUR MENU</span>
          <h2 className="font-ar-display text-3xl md:text-4xl font-bold text-gold-deep mt-1">
            قائمة الأسعار
          </h2>
          <span className="divider-gold" />
          <p className="font-en-display italic text-ink-soft mt-2">
            Trust that suits you · Beauty worth talking about
          </p>
        </div>

        <div className="space-y-3">
          {categories.map((cat) => {
            const catServices = services.filter((s) => s.category_id === cat.id);
            const isOpen = openCat === cat.id;
            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-gold-light/20 overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenCat(isOpen ? null : cat.id)}
                  className="w-full flex items-center justify-between gap-4 p-5 hover:bg-cream-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-14 h-14 rounded-full bg-gradient-to-br from-cream-100 to-cream-200 border border-gold-light/30 flex items-center justify-center p-2">
                      <CategoryIcon slug={cat.slug} fallback={cat.icon} />
                    </span>
                    <div className="text-right">
                      <h3 className="font-ar-display text-xl font-bold text-gold-deep">{cat.name_ar}</h3>
                      <p className="font-en-display italic text-sm text-gold-light">{cat.name_en}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-cream-100 px-3 py-1 rounded-full text-ink-soft">
                      {catServices.length} خدمة
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gold-deep transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* الخدمات */}
                <div className={`grid transition-[grid-template-rows] duration-500 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <div className="p-4 pt-0 grid gap-2 md:grid-cols-2">
                      {catServices.map((s) => (
                        <ServiceCard key={s.id} service={s} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// أيقونات الفئات بصور حقيقية (المحفوظة في /public/images/icons/)
const ICON_MAP: Record<string, string> = {
  'massage':    '/images/icons/massage.png',
  'bath':       '/images/icons/bath.png',
  'facial':     '/images/icons/facial.png',
  'nails':      '/images/icons/nails.png',
  'brows':      '/images/icons/facial.png',       // استخدام أيقونة البشرة للحواجب
  'hair-color': '/images/icons/hair-color.png',
  'hair-cut':   '/images/icons/hair-cut.png',
  'blow-dry':   '/images/icons/blow-dry.png',
  'hair-style': '/images/icons/hair-style.png',
  'hair-treat': '/images/icons/hair-treat.png',
  'makeup':     '/images/icons/facial.png',
};

function CategoryIcon({ slug, fallback }: { slug: string; fallback: string | null }) {
  const iconPath = ICON_MAP[slug];
  if (iconPath) {
    // استخدام <img> بدل Image لأن الأيقونات صغيرة ولا تحتاج تحسين Next
    return <img src={iconPath} alt="" className="w-full h-full object-contain" />;
  }
  return <span className="text-2xl">{fallback || '✨'}</span>;
}

function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="border border-cream-200 rounded-xl p-4 hover:border-gold-light/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-bold text-ink">{service.name_ar}</h4>
          <p className="font-en-display italic text-xs text-gold-light mt-0.5">{service.name_en}</p>
          {service.description_ar && (
            <p className="text-xs text-ink-soft mt-2 leading-relaxed">{service.description_ar}</p>
          )}
        </div>
        <div className="text-left flex-shrink-0">
          <div className="font-en-display text-xl font-bold text-gold-deep whitespace-nowrap">
            {formatPrice(service.price, { showFrom: service.price_from })}
          </div>
          <div className="inline-flex items-center gap-1 text-xs text-ink-soft mt-1">
            <Clock className="w-3 h-3" />
            <span>{formatDuration(service.duration_min)}</span>
          </div>
        </div>
      </div>
      <button className="mt-3 w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-gold-deep bg-cream-50 hover:bg-cream-100 py-2 rounded-lg transition-colors">
        <Plus className="w-3.5 h-3.5" />
        <span>أضيفي للسلة</span>
      </button>
    </div>
  );
}
