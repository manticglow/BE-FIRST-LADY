/**
 * POST /api/auth/otp/send
 * ═══════════════════════════════════════════════════════════
 * توليد رمز OTP من 6 أرقام · حفظه في قاعدة البيانات
 * · إرساله عبر واتساب
 *
 * Body: { phone: string, purpose?: 'login' | 'signup' | 'reset' }
 * Response: { ok: true } أو { ok: false, error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendOtpCode, formatPhoneForWhatsApp } from '@/lib/integrations/whatsapp';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone: string = (body.phone || '').trim();
    const purpose: string = body.purpose || 'login';

    // تحقّق من الرقم
    if (!phone || phone.length < 9) {
      return NextResponse.json({ ok: false, error: 'رقم جوال غير صحيح' }, { status: 400 });
    }

    const formattedPhone = formatPhoneForWhatsApp(phone);

    // ─── Rate Limiting: ما أكثر من 5 محاولات في 10 دقائق ───
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from('otp_codes')
      .select('*', { count: 'exact', head: true })
      .eq('phone', formattedPhone)
      .gte('created_at', tenMinAgo);

    if ((recentCount || 0) >= 5) {
      return NextResponse.json(
        { ok: false, error: 'لقد تجاوزتِ عدد المحاولات · حاولي بعد 10 دقائق' },
        { status: 429 }
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
      return NextResponse.json(
        { ok: false, error: result.error || 'فشل إرسال الرسالة' },
        { status: 500 }
      );
    }

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
