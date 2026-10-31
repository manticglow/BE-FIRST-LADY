/**
 * POST /api/auth/otp/send
 * ═══════════════════════════════════════════════════════════
 * توليد رمز OTP من 6 أرقام · حفظه في قاعدة البيانات
 * · إرساله عبر واتساب
 *
 * 🛡️ Rate Limited:
 *   - 5 محاولات/10 دقائق لكل phone
 *   - 20 محاولة/ساعة لكل IP (ضد abuse)
 *
 * Body: { phone: string, purpose?: 'login' | 'signup' | 'reset' }
 * Response: { ok: true } أو { ok: false, error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOtpCode, formatPhoneForWhatsApp } from '@/lib/integrations/whatsapp';
import { checkRateLimit, getClientIp, rateLimitErrorResponse } from '@/lib/rate-limit';
import { auditLog, extractRequestInfo } from '@/lib/audit-log';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  const { ip, ua } = extractRequestInfo(req);

  try {
    const body = await req.json();
    const phone: string = (body.phone || '').trim();
    const purpose: string = body.purpose || 'login';

    // تحقّق من الرقم
    if (!phone || phone.length < 9) {
      return NextResponse.json({ ok: false, error: 'رقم جوال غير صحيح' }, { status: 400 });
    }

    const formattedPhone = formatPhoneForWhatsApp(phone);

    // ─── Rate Limit 1: لكل IP (20 محاولة/ساعة) ───
    const ipLimit = await checkRateLimit({
      key: ip || 'unknown',
      category: 'otp-send-ip',
      max: 20,
      windowSec: 60 * 60,
    });
    if (!ipLimit.allowed) {
      await auditLog({
        action: 'auth.otp.send',
        success: false,
        errorMessage: 'rate_limited_ip',
        metadata: { phone: formattedPhone, ip },
        ipAddress: ip,
        userAgent: ua,
      });
      return NextResponse.json(
        { ok: false, ...rateLimitErrorResponse(ipLimit) },
        { status: 429 },
      );
    }

    // ─── Rate Limit 2: لكل phone (5 محاولات/10 دقائق) ───
    const phoneLimit = await checkRateLimit({
      key: formattedPhone,
      category: 'otp-send-phone',
      max: 5,
      windowSec: 10 * 60,
    });
    if (!phoneLimit.allowed) {
      await auditLog({
        action: 'auth.otp.send',
        success: false,
        errorMessage: 'rate_limited_phone',
        metadata: { phone: formattedPhone, retry_after: phoneLimit.retryAfter },
        ipAddress: ip,
        userAgent: ua,
      });
      return NextResponse.json(
        { ok: false, ...rateLimitErrorResponse(phoneLimit) },
        { status: 429 },
      );
    }

    // ─── توليد كود 6 أرقام ───
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 دقائق

    // ─── حفظ في قاعدة البيانات ───
    const { error: insertError } = await supabase.from('otp_codes').insert({
      phone: formattedPhone,
      code,
      purpose,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error('[OTP Send] DB error:', insertError);
      return NextResponse.json(
        { ok: false, error: 'خطأ في حفظ الرمز · حاولي مجدداً' },
        { status: 500 }
      );
    }

    // ─── إرسال عبر واتساب ───
    const result = await sendOtpCode(formattedPhone, code);

    if (!result.ok) {
      // إذا WhatsApp API ما مُفعّلة (التطوير)، نرجع الكود في الـresponse للاختبار فقط
      if (process.env.NODE_ENV !== 'production' && result.error?.includes('غير مُفعّلة')) {
        return NextResponse.json({
          ok: true,
          message: 'DEV MODE: الـAPI ما مُفعّلة · الكود مرئي هنا للاختبار',
          _devCode: code, // ⚠️ ما يظهر في الإنتاج
        });
      }
      await auditLog({
        action: 'auth.otp.send',
        success: false,
        errorMessage: result.error || 'whatsapp_send_failed',
        metadata: { phone: formattedPhone, purpose },
        ipAddress: ip,
        userAgent: ua,
      });
      return NextResponse.json(
        { ok: false, error: result.error || 'فشل إرسال الرسالة' },
        { status: 500 }
      );
    }

    // ─── Audit success ───
    await auditLog({
      action: 'auth.otp.send',
      success: true,
      metadata: { phone: formattedPhone, purpose, messageId: result.messageId },
      ipAddress: ip,
      userAgent: ua,
    });

    return NextResponse.json({
      ok: true,
      message: 'تم إرسال الرمز إلى واتساب',
      messageId: result.messageId,
    });
  } catch (e: any) {
    console.error('[OTP Send] Exception:', e);
    return NextResponse.json(
      { ok: false, error: 'خطأ غير متوقّع · حاولي مجدداً' },
      { status: 500 }
    );
  }
}
