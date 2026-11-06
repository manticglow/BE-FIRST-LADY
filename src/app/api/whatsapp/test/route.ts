/**
 * /api/whatsapp/test — تشخيص سريع لإعدادات واتساب
 * ═══════════════════════════════════════════════════════════
 * يستخدم المكتبة الموحّدة (whatsapp.ts) اللي تختار المزوّد تلقائياً:
 *   • WHATSAPP_TEST_MODE=true  → تحفظ بدون إرسال
 *   • WHATSAPP_PROVIDER=twilio → ترسل عبر Twilio
 *   • افتراضي                  → ترسل عبر Meta Cloud API
 *
 * GET  → يفحص env variables ويخبرك ايش المزوّد المفعّل
 * POST → يرسل اختبار للرقم (body: { phone: "05xxx", text: "..." })
 */
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const meta = {
    phoneId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
    token: !!process.env.WHATSAPP_ACCESS_TOKEN,
    waba: !!process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  };
  const twilio = {
    sid: !!process.env.TWILIO_ACCOUNT_SID,
    token: !!process.env.TWILIO_AUTH_TOKEN,
    from: !!process.env.TWILIO_WHATSAPP_FROM,
  };
  const provider = process.env.WHATSAPP_PROVIDER || 'meta';
  const testMode = process.env.WHATSAPP_TEST_MODE === 'true' || process.env.WHATSAPP_TEST_MODE === '1';

  return NextResponse.json({
    active_provider: testMode ? 'test-mode (DB only)' : provider,
    meta_config: {
      WHATSAPP_PHONE_NUMBER_ID: meta.phoneId ? '✅' : '❌',
      WHATSAPP_ACCESS_TOKEN: meta.token ? '✅' : '❌',
      WHATSAPP_BUSINESS_ACCOUNT_ID: meta.waba ? '✅' : '❌',
    },
    twilio_config: {
      TWILIO_ACCOUNT_SID: twilio.sid ? '✅' : '❌',
      TWILIO_AUTH_TOKEN: twilio.token ? '✅' : '❌',
      TWILIO_WHATSAPP_FROM: twilio.from ? '✅' : '❌',
    },
    switch: {
      WHATSAPP_PROVIDER: provider,
      WHATSAPP_TEST_MODE: testMode,
    },
    next_step: 'POST هنا بـ { "phone": "0596198999", "text": "رسالة اختبار" }',
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const phone = body.phone as string | undefined;
  const text = body.text as string | undefined;

  if (!phone) {
    return NextResponse.json({ ok: false, error: 'أرسلي { "phone": "05xxxxxxxx" }' }, { status: 400 });
  }

  const provider = process.env.WHATSAPP_PROVIDER || 'meta';
  const testMode = process.env.WHATSAPP_TEST_MODE === 'true' || process.env.WHATSAPP_TEST_MODE === '1';
  const messageText = text ||
    '🌸 مرحباً من Be First Lady\n\nهذي رسالة اختبار من النظام · لو وصلتك معناه كل شي يشتغل تمام ✨';

  try {
    const { sendWhatsAppText } = await import('@/lib/integrations/whatsapp');
    const result = await sendWhatsAppText(phone, messageText);

    const activeChannel = testMode ? 'test-mode' : provider;

    return NextResponse.json({
      ok: result.ok,
      channel: activeChannel,
      phone_sent_to: phone,
      message_id: result.messageId,
      error: result.error,
      interpretation: result.ok
        ? (testMode
            ? '✅ محفوظة في whatsapp_log · شوفي /admin/whatsapp'
            : `✅ تمّ الإرسال عبر ${activeChannel} · شوفي واتسابك خلال 5-15 ثانية`)
        : `❌ فشل عبر ${activeChannel}: ${result.error}`,
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: 'exception',
      exception: String(e?.message || e),
    }, { status: 500 });
  }
}
