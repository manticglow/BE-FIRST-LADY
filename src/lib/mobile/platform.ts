/**
 * Platform Detection — كشف البيئة
 * ═══════════════════════════════════════════════════════════
 * - isNative:  يشتغل داخل تطبيق Capacitor (Android/iOS)
 * - isWeb:     يشتغل في المتصفح العادي
 * - isPWA:     يشتغل كـ PWA مثبّت
 * - isIOS/isAndroid
 */

export const isNative = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
};

export const isWeb = (): boolean => !isNative();

export const isPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches
    || (window.navigator as any).standalone === true;
};

export const getPlatform = (): 'web' | 'ios' | 'android' => {
  if (typeof window === 'undefined') return 'web';
  const cap = (window as any).Capacitor;
  if (!cap?.isNativePlatform?.()) return 'web';
  return cap.getPlatform?.() === 'ios' ? 'ios' : 'android';
};

export const isIOS = (): boolean => getPlatform() === 'ios';
export const isAndroid = (): boolean => getPlatform() === 'android';

/**
 * استدعاء آمن — ينفّذ دالة Capacitor فقط لو كنا في بيئة ناتيف،
 * وإلا يرجع fallback بدون أي خطأ.
 */
export async function safeNative<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!isNative()) return fallback;
  try { return await fn(); } catch { return fallback; }
}
