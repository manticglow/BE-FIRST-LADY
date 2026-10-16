/**
 * Barcode / QR Scanner — ماسح QR ناتيف
 * ═══════════════════════════════════════════════════════════
 * - للموظفات لمسح QR العميلة عند الوصول
 * - لإدخال كود الكوبون/بطاقة الهدية بسرعة
 */

'use client';

import { isNative } from './platform';

export async function scanBarcode(): Promise<string | null> {
  if (!isNative()) {
    // ويب fallback — ممكن تستخدمي مكتبة مثل @zxing/browser
    return null;
  }

  try {
    const { BarcodeScanner } = await import('@capawesome/capacitor-barcode-scanner');

    // اطلبي الإذن
    const { camera } = await BarcodeScanner.checkPermissions();
    if (camera !== 'granted') {
      const req = await BarcodeScanner.requestPermissions();
      if (req.camera !== 'granted') return null;
    }

    // ابدئي المسح
    const result = await BarcodeScanner.scan({
      formats: ['QR_CODE', 'EAN_13', 'EAN_8', 'CODE_128'],
    });

    return result.barcodes?.[0]?.rawValue || null;
  } catch (e) {
    console.error('[Barcode] scan failed:', e);
    return null;
  }
}
