/**
 * دوال التحقق وتنسيق أرقام الجوال السعودية
 */

const SAUDI_REGEX = /^(?:\+?966|0)?5\d{8}$/;

export function isValidSaudiPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[^0-9+]/g, '');
  return SAUDI_REGEX.test(cleaned);
}

export function normalizeSaudiPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('966')) return '+' + digits;
  if (digits.startsWith('0')) return '+966' + digits.slice(1);
  if (digits.startsWith('5') && digits.length === 9) return '+966' + digits;
  return phone;
}

/** تنسيق للعرض: 05xxxxxxxx أو +966 5x xxx xxxx */
export function formatSaudiPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length < 9) return phone;

  // الصيغة الدولية
  let local = digits;
  if (digits.startsWith('966')) local = '0' + digits.slice(3);
  else if (digits.startsWith('5')) local = '0' + digits;

  // 05x xxx xxxx
  if (local.length === 10) {
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return local;
}
