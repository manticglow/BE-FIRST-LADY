// Platform detection — web-safe
export const isNative = () => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
};
export const isWeb = () => !isNative();
export const isPWA = () => {
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
export const isIOS = () => getPlatform() === 'ios';
export const isAndroid = () => getPlatform() === 'android';
export async function safeNative<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!isNative()) return fallback;
  try { return await fn(); } catch { return fallback; }
}
