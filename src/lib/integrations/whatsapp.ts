/**
 * WhatsApp Cloud API Integration
 * ═══════════════════════════════════════════════════════════
 * ⚙️ SETUP (مرة واحدة):
 *   1. سجّلي في developers.facebook.com
 *   2. أنشئي WhatsApp Business Account
 *   3. احصلي على: Phone Number ID + Access Token
 *   4. أضيفي في .env.local:
 *      WHATSAPP_PHONE_NUMBER_ID=xxxxx
 *      WHATSAPP_ACCESS_TOKEN=xxxxx
 *
 * الاستخدام:
 *   await sendWhatsAppMessage(phone, 'نص الرسالة');
 */

const API_VERSION = 'v21.0';

interface SendResult {
  ok: boolean;
  error?: string;
  messageId?: string;
}

export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<SendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !token) {
    return { ok: false, error: 'WhatsApp API غير مُفعّلة في البيئة' };
  }

  // تنسيق الرقم (966xxxxxxxxx)
  const phone = to.replace(/\D/g, '').replace(/^0/, '966');

  try {
    const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body },
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: data.error?.message || 'فشل الإرسال' };
    }
    return { ok: true, messageId: data.messages?.[0]?.id };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// قوالب جاهزة ─────────────────────────────────────
export const WhatsAppTemplates = {
  bookingConfirmation: (name: string, date: string, time: string, bookingNumber: string) =>
    `✨ أهلاً ${name} 💛

تم تأكيد حجزكِ في Be First Lady 🌸

📅 التاريخ: ${date}
⏰ الوقت: ${time}
🔖 رقم الحجز: ${bookingNumber}

نرحّب بكِ قبل 10 دقائق من موعدكِ.

للتواصل: 0504389329`,

  reminder24h: (name: string, time: string) =>
    `💛 تذكير يا ${name}

عندكِ موعد غداً في Be First Lady الساعة ${time}

نرى الترحيب 🌸`,

  reminder2h: (name: string) =>
    `⏰ ${name}، موعدكِ بعد ساعتين 💛

Be First Lady · نرحّب بكِ قريباً 🌸`,

  thankYou: (name: string, reviewLink: string) =>
    `شكراً لزيارتكِ ${name} 💛

نتمنى أن تجربتكِ كانت رائعة في Be First Lady 🌸

رأيكِ يهمّنا — تكرّمي بتقييمنا:
${reviewLink}`,

  birthday: (name: string, discountCode: string) =>
    `🎂 كل عام وأنتِ بألف خير يا ${name} 💛

هديتنا لكِ: خصم 20% على جلستكِ القادمة
الكود: ${discountCode}

Be First Lady 🌸`,

  winBack: (name: string, discountCode: string) =>
    `اشتقنا لكِ ${name} 💛

ما شفناكِ من فترة — نقدّم لكِ خصم 25% للعودة:
الكود: ${discountCode}

نتطلّع لرؤيتكِ قريباً 🌸
Be First Lady`,
};
