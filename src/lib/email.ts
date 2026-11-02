/**
 * Email Service — إرسال الإيميلات عبر Resend
 * ═══════════════════════════════════════════════════════════
 * - يستخدم Resend API
 * - يدعم HTML + attachments (PNG/PDF)
 * - fallback graceful لو الـAPI key ناقص
 */
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || 'Be First Lady <noreply@befirstlady.com>';

export interface EmailAttachment {
  filename: string;
  content: Buffer | string; // Buffer للـbinary, base64 string للـencoded
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * إرسال إيميل عبر Resend
 */
export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY غير مُفعّل · تخطّي الإرسال');
    return {
      ok: false,
      error: 'خدمة الإيميل غير مُفعّلة · يرجى التواصل مع الدعم',
    };
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const payload: any = {
      from: RESEND_FROM,
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
    };
    if (opts.text) payload.text = opts.text;
    if (opts.replyTo) payload.replyTo = opts.replyTo;
    if (opts.attachments && opts.attachments.length > 0) {
      payload.attachments = opts.attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      }));
    }

    const { data, error } = await resend.emails.send(payload);
    if (error) {
      console.error('[email] Resend error:', error);
      return { ok: false, error: error.message || 'فشل إرسال الإيميل' };
    }
    return { ok: true, id: data?.id };
  } catch (e: any) {
    console.error('[email] Exception:', e);
    return { ok: false, error: e.message || 'خطأ في الإرسال' };
  }
}

/**
 * تحقّق بسيط من صيغة الإيميل
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
