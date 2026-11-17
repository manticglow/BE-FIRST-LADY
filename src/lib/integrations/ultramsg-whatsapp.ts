/**
 * UltraMsg WhatsApp Integration
 * ═══════════════════════════════════════════════════════════
 * بديل عملي · يشتغل مع أيّ رقم واتساب عادي
 * لا يحتاج موافقات Meta · لا قيود على القوالب
 *
 * ⚙️ SETUP:
 *   1. سجّلي في ultramsg.com
 *   2. أنشئي Instance جديد
 *   3. اربطي رقم الواتساب (QR Code)
 *   4. من Settings · انسخي:
 *      - Instance ID (مثال: instance12345)
 *      - Token (مفتاح طويل)
 *   5. أضيفي في Vercel:
 *      ULTRAMSG_INSTANCE_ID = instance12345
 *      ULTRAMSG_TOKEN       = <طويل جداً>
 *      WHATSAPP_PROVIDER    = ultramsg
 *
 * 💰 التكلفة: 10$/شهر (خطة Starter)
 * 🚀 التفعيل: فوري بعد ربط الرقم
 */

import { logger } from '@/lib/logger';

const log = logger.scope('ultramsg-whatsapp');

interface SendResult {
  ok: boolean;
  error?: string;
  messageId?: string;
}

/**
 * تنسيق رقم الجوّال لصيغة UltraMsg
 * يقبل: 05xxxxxxxx أو 9665xxxxxxxx أو +9665xxxxxxxx
 * ويرجّع: 9665xxxxxxxx (بدون + · بدون أصفار بادئة)
 */
function formatUltraMsgPhone(phone: string): string {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('00966')) p = p.slice(2);        // 00966... → 966...
  else if (p.startsWith('0')) p = '966' + p.slice(1); // 05xxx → 9665xxx
  else if (!p.startsWith('966')) p = '966' + p;       // 5xxx → 9665xxx
  return p;
}

/**
 * إرسال رسالة واتساب عبر UltraMsg
 */
export async function sendUltraMsgWhatsApp(
  to: string,
  body: string
): Promise<SendResult> {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token = process.env.ULTRAMSG_TOKEN;

  if (!instanceId || !token) {
    return {
      ok: false,
      error: 'UltraMsg غير مُعدّ · أضيفي ULTRAMSG_INSTANCE_ID و ULTRAMSG_TOKEN',
    };
  }

  const toFormatted = formatUltraMsgPhone(to);
  const apiUrl = `https://api.ultramsg.com/${instanceId}/messages/chat`;

  // UltraMsg يستقبل البيانات كـform-urlencoded
  const formData = new URLSearchParams({
    token: token,
    to: toFormatted,
    body: body,
    priority: '10', // أعلى أولويّة
  });

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await res.json();

    // UltraMsg الاستجابة الناجحة: { sent: "true", message: "ok", id: "xxx" }
    if (!res.ok || data.error) {
      log.error('UltraMsg send failed', null, { data });
      return {
        ok: false,
        error: data.error || data.message || `خطأ UltraMsg: ${res.status}`,
      };
    }

    if (data.sent !== 'true' && data.sent !== true) {
      log.warn('UltraMsg returned non-sent status', { data });
      return {
        ok: false,
        error: data.message || 'الرسالة لم تُرسل · تحقّقي من ربط الـInstance',
      };
    }

    return {
      ok: true,
      messageId: String(data.id || data.message_id || `um-${Date.now()}`),
    };
  } catch (e: any) {
    log.error('UltraMsg exception', e);
    return { ok: false, error: e.message };
  }
}

/**
 * فحص · هل UltraMsg مُعدّ؟
 */
export function isUltraMsgConfigured(): boolean {
  return !!(process.env.ULTRAMSG_INSTANCE_ID && process.env.ULTRAMSG_TOKEN);
}

/**
 * هل المزوّد المفعّل هو UltraMsg؟
 */
export function isUltraMsgEnabled(): boolean {
  return process.env.WHATSAPP_PROVIDER === 'ultramsg' && isUltraMsgConfigured();
}

/**
 * فحص حالة الـInstance (هل مربوط بواتساب نشط؟)
 * مفيد لـdiagnostic endpoint
 */
export async function checkUltraMsgStatus(): Promise<{
  ok: boolean;
  instance_status?: string;
  error?: string;
}> {
  const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
  const token = process.env.ULTRAMSG_TOKEN;

  if (!instanceId || !token) {
    return { ok: false, error: 'غير مُعدّ' };
  }

  try {
    const res = await fetch(
      `https://api.ultramsg.com/${instanceId}/instance/status?token=${token}`,
      { method: 'GET' }
    );
    const data = await res.json();
    return {
      ok: data.status === 'authenticated',
      instance_status: data.status,
    };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}
