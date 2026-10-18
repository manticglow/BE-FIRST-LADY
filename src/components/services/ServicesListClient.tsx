/**
 * ServicesListClient — واجهة قائمة الخدمات
 * ═══════════════════════════════════════════════════════════
 * - شريط فلاتر أفقي (كل الفئات · قابل للسحب)
 * - بطاقات الخدمات بالصور الحقيقية
 * - زر "أضيفي للسلة" مع تفاعل مباشر
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { Plus, Check, Clock, Star, Search, ArrowRight } from 'lucide-react';
import { formatPrice, formatDuration } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import type { Category, Service } from '@/types/database';

// صور المعرض كـfallback
const GALLERY = [
  '/images/gallery/bridal-look.jpg', '/images/gallery/bridal-makeup.jpg', '/images/gallery/bun-styling.jpg',
  '/images/gallery/burgundy-mani.jpg', '/images/gallery/evening-glam.jpg', '/images/gallery/eyes-detail-poster.jpg',
  '/images/gallery/eyes-makeup-poster.jpg', '/images/gallery/french-mani.jpg', '/images/gallery/gold-mani.jpg',
  '/images/gallery/hairstyle.jpg', '/images/gallery/hollywood-waves.jpg', '/images/gallery/lashes-poster.jpg',
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h);
}

function slugify(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function pickFallback(serviceId: string, nameEn: string, catSlug?: string): string {
  const name = nameEn.toLowerCase();
  const keywords: Array<[string[], string[]]> = [
    [['royal', 'bridal', 'luxury', 'premium'], ['/images/gallery/bridal-look.jpg', '/images/gallery/bridal-makeup.jpg']],
    [['hollywood', 'waves'], ['/images/gallery/hollywood-waves.jpg']],
    [['bun', 'updo'], ['/images/gallery/bun-styling.jpg']],
    [['french'], ['/images/gallery/french-mani.jpg']],
    [['gold'], ['/images/gallery/gold-mani.jpg']],
    [['burgundy', 'red'], ['/images/gallery/burgundy-mani.jpg']],
    [['lashes'], ['/images/gallery/lashes-poster.jpg']],
    [['eyes', 'eye'], ['/images/gallery/eyes-detail-poster.jpg', '/images/gallery/eyes-makeup-poster.jpg']],
    [['evening', 'glam'], ['/images/gallery/evening-glam.jpg']],
  ];
  for (const [kws, imgs] of keywords) {
    if (kws.some((k) => name.includes(k))) return imgs[hashString(serviceId) % imgs.length];
  }
  const byCat: Record<string, string[]> = {
    'nails': ['/images/gallery/french-mani.jpg', '/images/gallery/burgundy-mani.jpg', '/images/gallery/gold-mani.jpg'],
    'makeup': ['/images/gallery/bridal-makeup.jpg', '/images/gallery/eyes-makeup-poster.jpg', '/images/gallery/evening-glam.jpg', '/images/gallery/bridal-look.jpg'],
    'hair-style': ['/images/gallery/bun-styling.jpg', '/images/gallery/hollywood-waves.jpg', '/images/gallery/hairstyle.jpg'],
    'hair-cut': ['/images/gallery/hairstyle.jpg', '/images/gallery/bun-styling.jpg'],
    'blow-dry': ['/images/gallery/hollywood-waves.jpg', '/images/gallery/hairstyle.jpg'],
    'hair-color': ['/images/gallery/hollywood-waves.jpg', '/images/gallery/hairstyle.jpg'],
    'hair-treat': ['/images/gallery/hairstyle.jpg'],
    'brows': ['/images/gallery/lashes-poster.jpg', '/images/gallery/eyes-detail-poster.jpg'],
    'facial': ['/images/gallery/bridal-look.jpg', '/images/gallery/evening-glam.jpg'],
    'massage': ['/images/gallery/evening-glam.jpg', '/images/gallery/bridal-look.jpg'],
    'bath': ['/images/gallery/bridal-look.jpg', '/images/gallery/evening-glam.jpg'],
  };
  if (catSlug && byCat[catSlug]) {
    const list = byCat[catSlug];
    return list[hashString(serviceId) % list.length];
  }
  return GALLERY[hashString(serviceId) % GALLERY.length];
}

export default function ServicesListClient({ categories, services, isLoggedIn }: { categories: Category[]; services: (Service & { category?: Category })[]; isLoggedIn: boolean }) {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // اقرئي الـhash من الـURL (مثل #massage) لتفعيل الفئة
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (hash && categories.some((c) => c.slug === hash)) {
      setActiveCat(hash);
      // scroll لأعلى
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
    }
  }, [categories]);

  const filtered = services.filter((s) => {
    if (activeCat && s.category?.slug !== activeCat) return false;
    if (search && !s.name_ar.includes(search) && !s.name_en.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped: Record<string, (Service & { category?: Category })[]> = {};
  filtered.forEach((s) => {
    const key = s.category?.slug || 'other';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* ═══ العنوان ═══ */}
      <div className="mb-6 text-center">
        <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mb-1">
          OUR SERVICES
        </div>
        <h1 className="font-ar-display text-3xl md:text-4xl font-bold text-gold-deep">
          قائمة الأسعار
        </h1>
        <div className="w-16 h-px bg-gold-light mx-auto my-3 opacity-50" />
      </div>

      {/* ═══ البحث ═══ */}
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحثي عن خدمة..."
          className="w-full pr-10 pl-3 py-3 rounded-2xl border border-cream-200 bg-white focus:border-gold outline-none text-sm"
        />
      </div>

      {/* ═══ فلاتر الفئات ═══ */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2 mb-6 snap-x">
        <FilterPill label="الكل" active={!activeCat} onClick={() => setActiveCat(null)} />
        {categories.map((cat) => (
          <FilterPill
            key={cat.id}
            label={cat.name_ar}
            active={activeCat === cat.slug}
            onClick={() => setActiveCat(cat.slug)}
          />
        ))}
      </div>

      {/* ═══ قائمة الخدمات مجمّعة بالفئات ═══ */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-cream-200">
          <div className="text-5xl mb-3">🔎</div>
          <div className="font-ar-display font-bold text-lg text-ink mb-1">ما لقينا نتائج</div>
          <div className="text-sm text-ink-soft">جربي كلمة بحث مختلفة أو شوفي كل الخدمات</div>
        </div>
      ) : (
        categories
          .filter((cat) => grouped[cat.slug]?.length > 0)
          .map((cat) => (
            <section key={cat.id} id={cat.slug} className="mb-8 scroll-mt-24">
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-3 flex items-center gap-2">
                <span>{cat.name_ar}</span>
                <span className="text-xs font-en-label tracking-[0.2em] text-gold-light uppercase font-normal">
                  {cat.name_en}
                </span>
              </h2>
              <div className="grid md:grid-cols-2 gap-3">
                {grouped[cat.slug].map((s) => <ServiceRow key={s.id} service={s} isLoggedIn={isLoggedIn} />)}
              </div>
            </section>
          ))
      )}
    </div>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 snap-start px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
        active
          ? 'bg-gold-deep text-cream-50 border-gold-deep'
          : 'bg-white text-ink border-cream-200 hover:border-gold-light'
      }`}
    >
      {label}
    </button>
  );
}

function ServiceRow({ service, isLoggedIn }: { service: Service & { category?: Category }; isLoggedIn: boolean }) {
  const cart = useCart();
  const inCart = cart.has(service.id);
  const localImg = `/images/services/${slugify(service.name_en)}.jpg`;
  const fallbackImg = pickFallback(service.id, service.name_en, service.category?.slug);
  const [currentSrc, setCurrentSrc] = useState(service.image_url || localImg);

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      toast.error('لازم تسجّلي دخول أولاً', { icon: '🔒' });
      setTimeout(() => { window.location.href = `/login?redirect=/services/${service.id}`; }, 800);
      return;
    }
    if (inCart) {
      cart.remove(service.id);
      toast('تم الإزالة من السلة', { icon: '🗑️' });
    } else {
      cart.add(service.id);
      toast.success(`أُضيفت للسلة · ${cart.count + 1} خدمات 🌸`);
    }
  }

  return (
    <Link
      href={`/services/${service.id}`}
      className={`bg-white rounded-2xl border overflow-hidden flex gap-3 shadow-sm transition-all hover:shadow-md ${
        inCart ? 'border-gold-deep' : 'border-cream-200'
      }`}
    >
      {/* صورة */}
      <div className="relative w-24 h-28 md:w-28 md:h-32 bg-gradient-to-br from-gold-light/15 to-cream-100 shrink-0">
        <Image
          src={currentSrc}
          alt={service.name_ar}
          fill
          className="object-cover"
          sizes="112px"
          onError={() => { if (currentSrc !== fallbackImg) setCurrentSrc(fallbackImg); }}
        />
      </div>

      {/* معلومات */}
      <div className="flex-1 min-w-0 py-3 pl-3 flex flex-col justify-between">
        <div>
          <h3 className="font-ar-display font-bold text-sm text-ink line-clamp-1">
            {service.name_ar}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-ink-soft">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-gold-deep" />
              <span className="font-en-display">{formatDuration(service.duration_min)}</span>
            </span>
            <span>·</span>
            <span className="font-en-display font-bold text-gold-deep text-sm">
              {formatPrice(service.price, { showFrom: service.price_from })}
            </span>
          </div>
          {service.description_ar && (
            <p className="text-[11px] text-ink-soft mt-1 line-clamp-2 leading-relaxed">
              {service.description_ar}
            </p>
          )}
        </div>

        <button
          onClick={handleToggle}
          className={`mt-2 inline-flex items-center justify-center gap-1 text-[11px] font-bold py-1.5 px-3 rounded-lg transition-colors self-start ${
            inCart
              ? 'bg-gold-deep text-cream-50'
              : 'bg-cream-50 text-gold-deep border border-gold-light/40 hover:bg-cream-100'
          }`}
        >
          {inCart ? (
            <>
              <Check className="w-3 h-3" />
              في السلة
            </>
          ) : (
            <>
              <Plus className="w-3 h-3" />
              أضيفي للسلة
            </>
          )}
        </button>
      </div>
    </Link>
  );
}
