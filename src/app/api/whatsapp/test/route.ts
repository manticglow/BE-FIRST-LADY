/**
 * /api/whatsapp/test — تشخيص سريع لإعدادات واتساب
 * ═══════════════════════════════════════════════════════════
 * يستخدم فقط للاختبار · يحذف قبل الإنتاج
 *
 * GET  → يفحص الـenv variables ويرجّع التفاصيل
 * POST → يرسل hello_world للرقم المُرسَل في الـbody
 *
 * Example:
 *   GET  /api/whatsapp/test
 *   POST /api/whatsapp/test   body: { "phone": "0596198999" }
 */
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

  return NextResponse.json({
    env_check: {
      WHATSAPP_PHONE_NUMBER_ID: phoneNumberId
        ? `✅ موجود (${phoneNumberId.slice(0, 6)}...${phoneNumberId.slice(-4)})`
        : '❌ غير موجود',
      WHATSAPP_ACCESS_TOKEN: token
        ? `✅ موجود (${token.slice(0, 10)}... · طول: ${token.length})`
        : '❌ غير موجود',
      WHATSAPP_BUSINESS_ACCOUNT_ID: wabaId
        ? `✅ موجود (${wabaId.slice(0, 6)}...)`
        : '❌ غير موجود',
    },
    next_step: phoneNumberId && token
      ? 'اعملي POST لهذا الـendpoint بـ { "phone": "رقمك" } عشان ترسل اختبار'
      : 'ضيفي الـenv variables في Vercel أوّل · ثم Redeploy',
  });
}

export async function POST(req: NextRequest) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !token) {
    return NextResponse.json(
      { ok: false, error: 'WHATSAPP env variables غير موجودة', missing: { phoneNumberId: !phoneNumberId, token: !token } },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  let phone = body.phone as string | undefined;
  if (!phone) {
    return NextResponse.json({ ok: false, error: 'أرسلي { "phone": "05xxxxxxxx" }' }, { status: 400 });
  }

  // تنسيق الرقم
  phone = phone.replace(/\D/g, '');
  if (phone.startsWith('00966')) phone = phone.slice(2);
  else if (phone.startsWith('0')) phone = '966' + phone.slice(1);
  else if (!phone.startsWith('966')) phone = '966' + phone;

  // أرسلي قالب hello_world (الموجود افتراضياً مع Test Number)
  const apiUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: phone,
    type: 'template',
    template: {
      name: 'hello_world',
      language: { code: 'en_US' },
    },
  };

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    return NextResponse.json({
      ok: res.ok,
      status_code: res.status,
      phone_sent_to: phone,
      template_used: 'hello_world (en_US)',
      meta_response: data,
      interpretation: res.ok
        ? '✅ تمّ الإرسال! شوفي واتسابك خلال 5-15 ثانية'
        : parseError(data),
    });
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: 'فشل الاتصال بـMeta',
      exception: String(e?.message || e),
    }, { status: 500 });
  }
}

function parseError(data: any): string {
  const err = data?.error;
  if (!err) return 'خطأ غير معروف · شوفي meta_response';

  const code = err.code;
  const msg = err.message || '';

  if (code === 131030) return '❌ الرقم غير موجود في قائمة "To" المعتمدة في Meta · ضيفي الرقم في Meta Dashboard أوّل';
  if (code === 131026) return '❌ القالب غير موجود (hello_world) · تحقّقي من إنّك مفعّلة WhatsApp API صح';
  if (code === 190) return '❌ الـAccess Token منتهي · الـTemporary Token صالح لـ24 ساعة فقط';
  if (code === 132000) return '❌ عدد الـparameters لا يطابق القالب';
  if (msg.includes('authentication')) return '❌ Token خاطئ أو ما عنده صلاحيات';

  return `❌ ${msg} (code: ${code})`;
}
