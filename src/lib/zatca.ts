/**
 * ZATCA Phase 1 — توليد QR Code للفاتورة الإلكترونية
 * ═══════════════════════════════════════════════════════════
 * بناء على متطلبات هيئة الزكاة والضريبة والجمارك السعودية.
 *
 * يستخدم صيغة TLV (Tag-Length-Value) → base64
 *
 * التاجات:
 *   1 → اسم البائع
 *   2 → الرقم الضريبي (VAT Number)
 *   3 → الطابع الزمني (ISO 8601)
 *   4 → الإجمالي شامل الضريبة
 *   5 → مبلغ الضريبة
 */

interface ZatcaInvoice {
  sellerName: string;      // اسم المنشأة
  vatNumber: string;       // 15 رقم
  timestamp: string;       // ISO 8601
  total: number;           // المجموع شامل VAT
  vatAmount: number;       // مبلغ الضريبة فقط
}

/**
 * تحويل سلسلة UTF-8 إلى Uint8Array
 */
function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * بناء TLV واحد
 */
function makeTLV(tag: number, value: string): Uint8Array {
  const valueBytes = stringToBytes(value);
  const buffer = new Uint8Array(2 + valueBytes.length);
  buffer[0] = tag;
  buffer[1] = valueBytes.length;
  buffer.set(valueBytes, 2);
  return buffer;
}

/**
 * دمج TLVs
 */
function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((sum, a) => sum + a.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * تحويل Uint8Array إلى Base64 (يعمل في Node و Browser)
 */
function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
}

/**
 * توليد نص ZATCA QR (Base64)
 */
export function generateZatcaQR(invoice: ZatcaInvoice): string {
  const tlvs = [
    makeTLV(1, invoice.sellerName),
    makeTLV(2, invoice.vatNumber),
    makeTLV(3, invoice.timestamp),
    makeTLV(4, invoice.total.toFixed(2)),
    makeTLV(5, invoice.vatAmount.toFixed(2)),
  ];
  const merged = concatBytes(...tlvs);
  return toBase64(merged);
}

/**
 * توليد URL لـ QR Code image (يحمل الـ base64)
 */
export function generateZatcaQRImageUrl(invoice: ZatcaInvoice, size = 180): string {
  const data = generateZatcaQR(invoice);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&margin=1`;
}

/**
 * حساب الضريبة
 * ─────────────
 * إذا الأسعار شاملة الضريبة (المعتاد في السعودية):
 *   total = السعر المعروض
 *   vat_amount = total × (rate / (100 + rate))
 *   subtotal_before_vat = total - vat_amount
 *
 * إذا الأسعار غير شاملة:
 *   subtotal_before_vat = السعر
 *   vat_amount = subtotal × (rate / 100)
 *   total = subtotal + vat_amount
 */
export function calculateVAT(amount: number, rate: number, pricesIncludeVAT: boolean): {
  subtotal: number;      // قبل الضريبة
  vatAmount: number;     // مبلغ الضريبة
  total: number;         // شامل الضريبة
} {
  if (pricesIncludeVAT) {
    const factor = rate / (100 + rate);
    const vatAmount = Math.round(amount * factor * 100) / 100;
    const subtotal = Math.round((amount - vatAmount) * 100) / 100;
    return { subtotal, vatAmount, total: amount };
  } else {
    const vatAmount = Math.round(amount * (rate / 100) * 100) / 100;
    const total = Math.round((amount + vatAmount) * 100) / 100;
    return { subtotal: amount, vatAmount, total };
  }
}

/**
 * التحقق من الرقم الضريبي السعودي (15 رقم، يبدأ وينتهي بـ 3)
 */
export function isValidSaudiVATNumber(vatNumber: string): boolean {
  const cleaned = vatNumber.replace(/\s/g, '');
  if (!/^\d{15}$/.test(cleaned)) return false;
  return cleaned.startsWith('3') && cleaned.endsWith('3');
}

/**
 * تنسيق رقم الفاتورة
 */
export function formatInvoiceNumber(prefix: string, counter: number): string {
  return `${prefix}-${String(counter).padStart(6, '0')}`;
}
