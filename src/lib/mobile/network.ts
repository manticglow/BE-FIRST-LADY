/**
 * Network Status — متابعة الاتصال
 * ═══════════════════════════════════════════════════════════
 */

'use client';

import { isNative } from './platform';

export async function initNetworkListener(onChange: (online: boolean) => void) {
  if (!isNative()) {
    window.addEventListener('online', () => onChange(true));
    window.addEventListener('offline', () => onChange(false));
    onChange(navigator.onLine);
    return;
  }

  try {
    const { Network } = await import('@capacitor/network');
    const status = await Network.getStatus();
    onChange(status.connected);
    Network.addListener('networkStatusChange', (s) => onChange(s.connected));
  } catch {}
}
