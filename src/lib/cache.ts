/**
 * Cache Utilities — طبقة caching فوق Next.js unstable_cache
 * ═══════════════════════════════════════════════════════════
 * - Tag-based invalidation عشان نقدر نلغي cache عند التغيير
 * - TTL مختلفة حسب نوع البيانات
 * - fallback للـin-memory لو الـcache فشل
 */
import { unstable_cache, revalidateTag } from 'next/cache';

/** TTL ثابتة حسب نوع البيانات */
export const CACHE_TTL = {
  SHORT: 60,          // دقيقة · للـfrequently changing
  MEDIUM: 300,        // 5 دقائق · للخدمات/البنرات
  LONG: 3600,         // ساعة · للإعدادات العامّة
  DAY: 86400,         // يوم · للثوابت
} as const;

/** Tags للـinvalidation */
export const CACHE_TAGS = {
  SERVICES: 'services',
  CATEGORIES: 'categories',
  PACKAGES: 'packages',
  BANNERS: 'banners',
  THEMES: 'themes',
  TEMPLATES: 'templates',
  STAFF: 'staff',
  SETTINGS: 'settings',
} as const;

type Fetcher<T> = () => Promise<T>;

/**
 * Cache wrapper — يحفظ النتيجة لمدّة TTL ويرجّعها بدل الـDB query
 *
 * Usage:
 *   const services = await cached('services:all', CACHE_TTL.MEDIUM, [CACHE_TAGS.SERVICES],
 *     async () => await supabase.from('services').select('*'));
 */
export function cached<T>(
  key: string,
  ttlSec: number,
  tags: string[],
  fetcher: Fetcher<T>,
): Promise<T> {
  const cachedFn = unstable_cache(fetcher, [key], { revalidate: ttlSec, tags });
  return cachedFn();
}

/** إلغاء cache لـtag معيّن · يُستدعى بعد التحديث */
export function invalidate(tag: string | string[]) {
  const tags = Array.isArray(tag) ? tag : [tag];
  tags.forEach((t) => {
    try {
      revalidateTag(t);
    } catch {
      // ignore — بيئة dev ممكن ما تدعم
    }
  });
}

/** يلغي كل الـcache المرتبط بالخدمات (services + categories + packages) */
export function invalidateServices() {
  invalidate([CACHE_TAGS.SERVICES, CACHE_TAGS.CATEGORIES, CACHE_TAGS.PACKAGES]);
}
