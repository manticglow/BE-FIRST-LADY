/**
 * WhatsApp Cloud API Integration (Meta Official)
 * ═══════════════════════════════════════════════════════════
 * دوال إرسال رسائل واتساب عبر Meta Cloud API
 *
 * ⚙️ SETUP (مرة واحدة):
 *   1. راجعي: docs/WHATSAPP_SETUP.md
 *   2. أضيفي في Vercel:
 *      WHATSAPP_PHONE_NUMBER_ID
 *      WHATSAPP_ACCESS_TOKEN
 *
 * ─────────────────────────────────────────────
 * الاستخدام:
 *   // رسالة نصيّة (للمحادثات اللي العميلة بدأتها خلال 24 ساعة)
 *   await sendWhatsAppText(phone, 'نص الرسالة');
 *
 *   // قالب (للمحادثات اللي أنتي بدأتيها - OTP/تأكيد)
 *   await sendWhatsAppTemplate(phone, 'otp_login', 'ar', ['123456']);
 */

import { logger } from '@/lib/logger';

const log = logger.scope('whatsapp');
const API_VERSION = 'v21.0';

interface SendResult {
  ok: boolean;
  error?: string;
  messageId?: string;
}

// ═══════════════════════════════════════════════════════════
// تنسيق رقم الجوال → 966xxxxxxxxx (بدون +)
// ═══════════════════════════════════════════════════════════
export function formatPhoneForWhatsApp(phone: string): string {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('00966')) p = p.slice(2);     // 00966... → 966...
  else if (p.startsWith('0'))  p = '966' + p.slice(1); // 05xxx → 9665xxx
  else if (!p.startsWith('966')) p = '966' + p;        // 5xxx → 9665xxx
  return p;
}

// ═══════════════════════════════════════════════════════════
// 🧪 Test Mode · حفظ الرسالة في DB بدل الإرسال
// يُفعّل بـ WHATSAPP_TEST_MODE=true في env
// ═══════════════════════════════════════════════════════════
const isTestMode = () =>
  (process.env.WHATSAPP_TEST_MODE || '').toLowerCase() === 'true' ||
  (process.env.WHATSAPP_TEST_MODE || '') === '1';

async function logToDb(opts: {
  phone: string;
  message: string;
  status: 'test' | 'sent' | 'failed';
  response?: unknown;
  error?: string;
  messageId?: string;
  templateCode?: string;
  mode: 'live' | 'test';
}): Promise<void> {
  try {
    const { createAdminClient } = await import('@/lib/supabase/server');
    const admin = createAdminClient();
    await (admin as any).from('whatsapp_log').insert({
      phone: opts.phone,
      message: opts.message,
      status: opts.status,
      gateway_response: opts.response || null,
      gateway_message_id: opts.messageId || null,
      error_message: opts.error || null,
      template_code: opts.templateCode || null,
      mode: opts.mode,
      sent_at: opts.status === 'sent' || opts.status === 'test' ? new Date().toISOString() : null,
    });
  } catch (e) {
    log.warn('failed to log to db', { err: e });
  }
}

// ═══════════════════════════════════════════════════════════
// رسالة نصيّة · للمحادثات المفتوحة (24 ساعة من آخر رد للعميلة)
// ═══════════════════════════════════════════════════════════
export async function sendWhatsAppText(to: string, body: string): Promise<SendResult> {
  const phone = formatPhoneForWhatsApp(to);

  // 🧪 Test Mode · ما نرسل · نحفظ فقط
  if (isTestMode()) {
    await logToDb({ phone, message: body, status: 'test', mode: 'test' });
    log.info('TEST MODE · message saved to db', { phone, preview: body.slice(0, 50) });
    return { ok: true, messageId: 'test-' + Date.now() };
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !token) {
    return { ok: false, error: 'WhatsApp API غير مُفعّلة في البيئة' };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body, preview_url: false },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      log.error('text message failed', null, { data });
      await logToDb({
        phone, message: body, status: 'failed', mode: 'live',
        response: data, error: data.error?.message,
      });
      return { ok: false, error: data.error?.message || 'فشل الإرسال' };
    }
    const messageId = data.messages?.[0]?.id;
    await logToDb({ phone, message: body, status: 'sent', mode: 'live', response: data, messageId });
    return { ok: true, messageId };
  } catch (e: any) {
    log.error('text message exception', e);
    await logToDb({ phone, message: body, status: 'failed', mode: 'live', error: e.message });
    return { ok: false, error: e.message };
  }
}

// ═══════════════════════════════════════════════════════════
// رسالة قالب · للرسائل اللي البرنامج يبدأها (OTP/تأكيد/تذكير)
// ═══════════════════════════════════════════════════════════
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  lang: string = 'ar',
  bodyParams: string[] = [],
  buttonParams?: string[]
): Promise<SendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !token) {
    return { ok: false, error: 'WhatsApp API غير مُفعّلة في البيئة' };
  }

  const phone = formatPhoneForWhatsApp(to);

  // بناء components حسب القالب
  const components: any[] = [];
  if (bodyParams.length > 0) {
    components.push({
      type: 'body',
      parameters: bodyParams.map((text) => ({ type: 'text', text })),
    });
  }
  if (buttonParams && buttonParams.length > 0) {
    components.push({
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: buttonParams.map((text) => ({ type: 'text', text })),
    });
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: lang },
            components,
          },
        }),
      }
    );

    const data = await res.json();
    if (!res.ok) {
      log.error('template failed', null, { data });
      return { ok: false, error: data.error?.message || 'فشل الإرسال' };
    }
    return { ok: true, messageId: data.messages?.[0]?.id };
  } catch (e: any) {
    log.error('template exception', e);
    return { ok: false, error: e.message };
  }
}

// ═══════════════════════════════════════════════════════════
// Helpers · دوال جاهزة للاستخدام المباشر
// ═══════════════════════════════════════════════════════════

/** إرسال رمز OTP (6 أرقام) · يستخدم قالب otp_login */
export async function sendOtpCode(phone: string, code: string): Promise<SendResult> {
  return sendWhatsAppTemplate(phone, 'otp_login', 'ar', [code]);
}

/** تأكيد الحجز · يستخدم قالب booking_confirmation */
export async function sendBookingConfirmation(
  phone: string,
  customerName: string,
  date: string,
  time: string,
  bookingNumber: string
): Promise<SendResult> {
  return sendWhatsAppTemplate(phone, 'booking_confirmation', 'ar', [
    customerName, date, time, bookingNumber,
  ]);
}

/** تذكير 24 ساعة قبل الموعد */
export async function sendBookingReminder(
  phone: string,
  customerName: string,
  date: string,
  time: string
): Promise<SendResult> {
  return sendWhatsAppTemplate(phone, 'booking_reminder_24h', 'ar', [
    customerName, date, time,
  ]);
}

/**
 * ✨ الإصدار المحسّن · يستخدم قالب DB قابل للتحرير
 * - يحمل القالب من message_templates حسب الـcode
 * - يستبدل المتغيّرات بالقيم الحقيقيّة
 * - يرسل كـfree-text (يحتاج 24h window) · أو يرجّع للـMeta template لو فشل
 */
export async function sendTemplatedMessage(
  phone: string,
  templateCode: string,
  variables: Record<string, string | number | null | undefined>,
  fallbackMetaTemplate?: { name: string; language: 'ar' | 'en'; params: string[] },
): Promise<SendResult> {
  const { renderTemplateByCode } = await import('@/lib/templates');
  const body = await renderTemplateByCode(templateCode, variables, '');

  if (body) {
    const result = await sendWhatsAppText(phone, body);
    if (result.ok) return result;
  }

  // fallback للـMeta template (لو خارج نافذة الـ24 ساعة)
  if (fallbackMetaTemplate) {
    return sendWhatsAppTemplate(
      phone,
      fallbackMetaTemplate.name,
      fallbackMetaTemplate.language,
      fallbackMetaTemplate.params,
    );
  }

  return { ok: false, error: 'لا يوجد طريقة إرسال متاحة' };
}

// للتوافق مع الكود القديم
export const sendWhatsAppMessage = sendWhatsAppText;
