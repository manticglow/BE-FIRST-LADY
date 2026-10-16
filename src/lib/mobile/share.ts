/**
 * Native Share — مشاركة ناتيف
 * ═══════════════════════════════════════════════════════════
 * - رقم الحجز، كود الإحالة، بطاقات الهدية
 */

'use client';

import { isNative } from './platform';

interface ShareOptions {
  title?: string;
  text: string;
  url?: string;
  dialogTitle?: string;
}

export async function share(opts: ShareOptions): Promise<boolean> {
  // ناتيف: Capacitor Share
  if (isNative()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share(opts);
      return true;
    } catch { return false; }
  }

  // ويب: Web Share API
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: opts.title, text: opts.text, url: opts.url });
      return true;
    } catch { return false; }
  }

  // Fallback: نسخ للحافظة
  const content = [opts.text, opts.url].filter(Boolean).join('\n');
  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch { return false; }
}
