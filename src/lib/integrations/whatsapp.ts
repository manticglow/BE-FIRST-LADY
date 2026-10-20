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
// رسالة نصيّة · للمحادثات المفتوحة (24 ساعة من آخر رد للعميلة)
// ═══════════════════════════════════════════════════════════
export async function sendWhatsAppText(to: string, body: string): Promise<SendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !token) {
    return { ok: false, error: 'WhatsApp API غير مُفعّلة في البيئة' };
  }

  const phone = formatPhoneForWhatsApp(to);

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
      console.error('[WhatsApp Text] Error:', data);
      return { ok: false, error: data.error?.message || 'فشل الإرسال' };
    }
    return { ok: true, messageId: data.messages?.[0]?.id };
  } catch (e: any) {
    console.error('[WhatsApp Text] Exception:', e);
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
      console.error('[WhatsApp Template] Error:', data);
      return { ok: false, error: data.error?.message || 'فشل الإرسال' };
    }
    return { ok: true, messageId: data.messages?.[0]?.id };
  } catch (e: any) {
    console.error('[WhatsApp Template] Exception:', e);
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
  date: string,       // "2026-10-20"
  time: string,       // "3:00 م"
  bookingNumber: string
): Promise<SendResult> {
  return sendWhatsAppTemplate(phone, 'booking_confirmation', 'ar', [
    customerName,
    date,
    time,
    bookingNumber,
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
    customerName,
    date,
    time,
  ]);
}

// للتوافق مع الكود القديم
export const sendWhatsAppMessage = sendWhatsAppText;
