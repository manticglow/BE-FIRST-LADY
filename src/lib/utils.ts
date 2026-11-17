/**
 * Utilities helpers
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// دمج كلاسات Tailwind مع تجنّب التعارض
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// تنسيق السعر بالريال
export function formatPrice(amount: number, options: { showFrom?: boolean } = {}): string {
  const formatted = new Intl.NumberFormat('ar-SA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${options.showFrom ? 'من ' : ''}${formatted} ر.س`;
}

// تنسيق المدة
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} د`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} س`;
  return `${hours} س ${mins} د`;
}

// تنسيق التاريخ العربي
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// رابط واتساب
export function waLink(message?: string): string {
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '966504389329';
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${phone}${text}`;
}

// slugify (للروابط العربية)
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^؀-ۿݐ-ݿa-z0-9-]/g, '');
}

// ═══════════════════════════════════════════════════════════
// التوقيت السعودي (Asia/Riyadh · UTC+3)
// ═══════════════════════════════════════════════════════════
// Vercel يشغّل بتوقيت UTC · لازم كل العرض والمنطق المرتبط باليوم
// يستخدم توقيت السعودية الصحيح · حتى الـcron وحسابات اليوم.
export const SAUDI_TZ = 'Asia/Riyadh';

/** تاريخ اليوم بتوقيت الرياض بصيغة YYYY-MM-DD */
export function saudiToday(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAUDI_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const d = parts.find((p) => p.type === 'day')?.value;
  return `${y}-${m}-${d}`;
}

/** ساعة اليوم (0-23) بتوقيت الرياض */
export function saudiHour(): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SAUDI_TZ,
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  return Number(parts.find((p) => p.type === 'hour')?.value || '0');
}

/** إضافة/طرح أيام من تاريخ ISO-date */
export function shiftIsoDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
}
