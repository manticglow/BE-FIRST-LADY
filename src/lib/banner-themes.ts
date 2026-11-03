/**
 * Banner Themes · 5 تصاميم فاخرة جاهزة
 * ═══════════════════════════════════════════════════════════
 * كل ثيم عبارة عن ألوان + تدرّج + صورة خلفيّة
 */

export interface BannerTheme {
  id: number;
  name: string;
  gradient: string;
  bgImage: string;
  textColor: string;
  accentColor: string;
  // مقاسات الصورة البديلة المُوصى بها (لو banner_type=image)
  recommendedSize: string;
}

export const BANNER_THEMES: BannerTheme[] = [
  {
    id: 1,
    name: 'ذهبي · ليلي',
    gradient: 'from-amber-900/80 via-amber-800/60 to-rose-900/40',
    bgImage: '/images/gallery/evening-glam.jpg',
    textColor: 'text-cream-50',
    accentColor: 'bg-gold-light text-ink',
    recommendedSize: '1920 × 1080 px',
  },
  {
    id: 2,
    name: 'ورديّ · أنثوي',
    gradient: 'from-rose-900/80 via-amber-800/60 to-amber-900/40',
    bgImage: '/images/gallery/burgundy-mani.jpg',
    textColor: 'text-cream-50',
    accentColor: 'bg-rose-200 text-ink',
    recommendedSize: '1920 × 1080 px',
  },
  {
    id: 3,
    name: 'ملكي · فاخر',
    gradient: 'from-stone-900/80 via-amber-900/60 to-rose-900/40',
    bgImage: '/images/gallery/bridal-look.jpg',
    textColor: 'text-cream-50',
    accentColor: 'bg-gold-deep text-cream-50',
    recommendedSize: '1920 × 1080 px',
  },
  {
    id: 4,
    name: 'كريمي · ناعم',
    gradient: 'from-amber-700/70 via-rose-600/40 to-transparent',
    bgImage: '/images/gallery/french-mani.jpg',
    textColor: 'text-cream-50',
    accentColor: 'bg-cream-50 text-gold-deep',
    recommendedSize: '1920 × 1080 px',
  },
  {
    id: 5,
    name: 'عرايس · حنيّة',
    gradient: 'from-rose-800/80 via-amber-800/50 to-amber-900/30',
    bgImage: '/images/gallery/bridal-makeup.jpg',
    textColor: 'text-cream-50',
    accentColor: 'bg-rose-100 text-rose-900',
    recommendedSize: '1920 × 1080 px',
  },
];

export function getThemeById(id: number | null | undefined): BannerTheme {
  return BANNER_THEMES.find((t) => t.id === id) || BANNER_THEMES[0];
}

// مقاسات موصى بها للـcustom images/HTML
export const BANNER_SIZES = {
  mobile: { width: 800, height: 500, ratio: '16:10', label: 'جوّال (مُوصى به)' },
  desktop: { width: 1920, height: 1080, ratio: '16:9', label: 'ديسكتوب' },
  square: { width: 1080, height: 1080, ratio: '1:1', label: 'مربّع' },
};
