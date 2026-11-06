/**
 * Twilio WhatsApp Integration
 * ═══════════════════════════════════════════════════════════
 * بديل Meta مباشرة · يستخدم Twilio Sandbox أو Production
 *
 * ⚙️ SETUP:
 *   1. سجّلي في twilio.com
 *   2. فعّلي WhatsApp Sandbox (join <code>)
 *   3. أضيفي في Vercel:
 *      TWILIO_ACCOUNT_SID = AC...
 *      TWILIO_AUTH_TOKEN = ...
 *      TWILIO_WHATSAPP_FROM = whatsapp:+14155238886
 *      WHATSAPP_PROVIDER = twilio     ← يحوّل الكود لاستخدام Twilio
 */

import { logger } from '@/lib/logger';

const log = logger.scope('twilio-whatsapp');

interface SendResult {
  ok: boolean;
  error?: string;
  messageId?: string;
}

/**
 * تنسيق رقم الجوّال لصيغة Twilio: whatsapp:+966xxxxxxxxx
 */
function formatTwilioPhone(phone: string): string {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('00966')) p = p.slice(2);
  else if (p.startsWith('0')) p = '966' + p.slice(1);
  else if (!p.startsWith('966')) p = '966' + p;
  return `whatsapp:+${p}`;
}

/**
 * إرسال رسالة واتساب عبر Twilio
 */
export async function sendTwilioWhatsApp(
  to: string,
  body: string
): Promise<SendResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  if (!sid || !token) {
    return { ok: false, error: 'Twilio credentials غير مُضافة في البيئة' };
  }

  const toFormatted = formatTwilioPhone(to);
  const apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

  // Twilio Sandbox يرفض الرسائل الحرّة · لازم ContentSid حتى داخل 24h
  // الـDefault: قالب Sandbox "appointment_reminder" الجاهز
  //   النص: "Your appointment is coming up on {{1}} at {{2}}"
  // مع Production template مخصّص نضع TWILIO_CONTENT_SID في env
  const SANDBOX_DEFAULT = 'HXb5b62575e6e4ff6129ad7c8efe1f983e';
  const contentSid = process.env.TWILIO_CONTENT_SID || SANDBOX_DEFAULT;
  const isSandboxDefault = contentSid === SANDBOX_DEFAULT;

  // للقالب الافتراضي يحتاج {{1}} و{{2}} · نقسّم النص
  // للقوالب المخصّصة نرسل {{1}} = النص كامل
  const contentVariables = isSandboxDefault
    ? JSON.stringify({
        '1': body.slice(0, 60).replace(/\n/g, ' '),
        '2': body.slice(60, 120).replace(/\n/g, ' ') || 'الموعد',
      })
    : JSON.stringify({ '1': body.slice(0, 1024) });

  // Twilio يستقبل البيانات كـform-urlencoded
  const formData = new URLSearchParams({
    From: from,
    To: toFormatted,
    ContentSid: contentSid,
    ContentVariables: contentVariables,
  });

  // Basic Auth = base64(sid:token)
  const auth = Buffer.from(`${sid}:${token}`).toString('base64');

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await res.json();

    if (!res.ok) {
      log.error('Twilio send failed', null, { data });
      return { ok: false, error: data.message || `خطأ Twilio: ${res.status}` };
    }

    return { ok: true, messageId: data.sid };
  } catch (e: any) {
    log.error('Twilio exception', e);
    return { ok: false, error: e.message };
  }
}

/**
 * فحص الـconfig
 */
export function isTwilioConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

/**
 * هل المزوّد المفعّل هو Twilio؟
 */
export function isTwilioEnabled(): boolean {
  return process.env.WHATSAPP_PROVIDER === 'twilio' && isTwilioConfigured();
}
