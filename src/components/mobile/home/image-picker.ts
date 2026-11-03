/**
 * image-picker — اختيار ذكي للصور البديلة للخدمات
 * ═══════════════════════════════════════════════════════════
 * يُستخدم لعرض الخدمات في MobileHomeApp والـcarousels.
 * التسلسل:
 *   1) تطابق بكلمات مفتاحيّة في اسم الخدمة الإنجليزي
 *   2) fallback حسب الفئة
 *   3) أي صورة من المعرض (مع hash للتوزيع المتوازن)
 */

// الأيقونات من الموقع · في /public/images/icons/
export const CATEGORY_ICONS: Record<string, string> = {
  'massage':    '/images/icons/massage.png',
  'bath':       '/images/icons/bath.png',
  'facial':     '/images/icons/facial.png',
  'nails':      '/images/icons/nails.png',
  'brows':      '/images/icons/facial.png',
  'hair-color': '/images/icons/hair-color.png',
  'hair-cut':   '/images/icons/hair-cut.png',
  'blow-dry':   '/images/icons/blow-dry.png',
  'hair-style': '/images/icons/hair-style.png',
  'hair-treat': '/images/icons/hair-treat.png',
  'makeup':     '/images/icons/facial.png',
};

// صور معرض الأعمال الجاهزة · لإعادة الاستخدام كـfallback
export const GALLERY_IMAGES = [
  '/images/gallery/bridal-look.jpg',
  '/images/gallery/bridal-makeup.jpg',
  '/images/gallery/bun-styling.jpg',
  '/images/gallery/burgundy-mani.jpg',
  '/images/gallery/evening-glam.jpg',
  '/images/gallery/eyes-detail-poster.jpg',
  '/images/gallery/eyes-makeup-poster.jpg',
  '/images/gallery/french-mani.jpg',
  '/images/gallery/gold-mani.jpg',
  '/images/gallery/hairstyle.jpg',
  '/images/gallery/hollywood-waves.jpg',
  '/images/gallery/lashes-poster.jpg',
];

// توزيع ذكي · نفس الخدمة دائماً تحصل على نفس الصورة
export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h);
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// بديل ذكي للخدمة · يفحص الاسم أولاً · ثم الفئة
export function pickFallbackImage(serviceId: string, nameEn: string, categorySlug?: string): string {
  const name = nameEn.toLowerCase();

  const keywordMap: Array<[string[], string[]]> = [
    [['bridal', 'royal', 'luxury', 'premium', 'queen', 'princess'],
      ['/images/gallery/bridal-look.jpg', '/images/gallery/bridal-makeup.jpg', '/images/gallery/evening-glam.jpg']],
    [['stone', 'hot stone'],
      ['/images/gallery/evening-glam.jpg', '/images/gallery/bridal-look.jpg']],
    [['deep tissue', 'deep', 'tissue', 'therapeutic', 'medical'],
      ['/images/gallery/evening-glam.jpg', '/images/gallery/bun-styling.jpg']],
    [['hollywood', 'waves', 'curls', 'curl'],
      ['/images/gallery/hollywood-waves.jpg']],
    [['bun', 'updo', 'knot'],
      ['/images/gallery/bun-styling.jpg']],
    [['french'],
      ['/images/gallery/french-mani.jpg']],
    [['gold', 'golden'],
      ['/images/gallery/gold-mani.jpg']],
    [['burgundy', 'red', 'cherry'],
      ['/images/gallery/burgundy-mani.jpg']],
    [['lashes', 'lash', 'eyelash'],
      ['/images/gallery/lashes-poster.jpg']],
    [['eyes', 'eye'],
      ['/images/gallery/eyes-detail-poster.jpg', '/images/gallery/eyes-makeup-poster.jpg']],
    [['evening', 'glam', 'night'],
      ['/images/gallery/evening-glam.jpg']],
  ];

  for (const [keywords, images] of keywordMap) {
    if (keywords.some((k) => name.includes(k))) {
      return images[hashString(serviceId) % images.length];
    }
  }

  const byCat: Record<string, string[]> = {
    'nails':      ['/images/gallery/french-mani.jpg', '/images/gallery/burgundy-mani.jpg', '/images/gallery/gold-mani.jpg'],
    'makeup':     ['/images/gallery/bridal-makeup.jpg', '/images/gallery/eyes-makeup-poster.jpg', '/images/gallery/evening-glam.jpg', '/images/gallery/eyes-detail-poster.jpg', '/images/gallery/bridal-look.jpg'],
    'hair-style': ['/images/gallery/bun-styling.jpg', '/images/gallery/hollywood-waves.jpg', '/images/gallery/hairstyle.jpg'],
    'hair-cut':   ['/images/gallery/hairstyle.jpg', '/images/gallery/bun-styling.jpg'],
    'blow-dry':   ['/images/gallery/hollywood-waves.jpg', '/images/gallery/hairstyle.jpg'],
    'hair-color': ['/images/gallery/hollywood-waves.jpg', '/images/gallery/hairstyle.jpg', '/images/gallery/bun-styling.jpg'],
    'hair-treat': ['/images/gallery/hairstyle.jpg', '/images/gallery/hollywood-waves.jpg'],
    'brows':      ['/images/gallery/lashes-poster.jpg', '/images/gallery/eyes-detail-poster.jpg'],
    'facial':     ['/images/gallery/bridal-look.jpg', '/images/gallery/evening-glam.jpg', '/images/gallery/bridal-makeup.jpg'],
    'massage':    ['/images/gallery/evening-glam.jpg', '/images/gallery/bridal-look.jpg', '/images/gallery/bun-styling.jpg'],
    'bath':       ['/images/gallery/bridal-look.jpg', '/images/gallery/evening-glam.jpg'],
  };

  if (categorySlug && byCat[categorySlug]) {
    const list = byCat[categorySlug];
    return list[hashString(serviceId) % list.length];
  }

  return GALLERY_IMAGES[hashString(serviceId) % GALLERY_IMAGES.length];
}
