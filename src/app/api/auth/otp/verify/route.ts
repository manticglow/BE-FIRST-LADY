/**
 * POST /api/auth/otp/verify
 * ═══════════════════════════════════════════════════════════
 * التحقّق من رمز OTP · إنشاء/تسجيل دخول المستخدم
 *
 * Body: { phone: string, code: string, fullName?: string }
 * Response: { ok: true, session: {...} } أو { ok: false, error: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { formatPhoneForWhatsApp } from '@/lib/integrations/whatsapp';

const admin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const phone: string = (body.phone || '').trim();
    const code: string = (body.code || '').trim();
    const fullName: string | undefined = body.fullName?.trim();

    if (!phone || !code || code.length !== 6) {
      return NextResponse.json({ ok: false, error: 'بيانات غير صحيحة' }, { status: 400 });
    }

    const formattedPhone = formatPhoneForWhatsApp(phone);

    // ─── جلب آخر OTP نشط لهذا الرقم ───
    const { data: otp, error: otpError } = await admin
      .from('otp_codes')
      .select('*')
      .eq('phone', formattedPhone)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otp) {
      return NextResponse.json(
        { ok: false, error: 'الرمز منتهي أو غير موجود · اطلبي رمز جديد' },
        { status: 400 }
      );
    }

    // ─── منع brute force: 5 محاولات كحد أقصى ───
    if (otp.attempts >= 5) {
      return NextResponse.json(
        { ok: false, error: 'تم تجاوز عدد محاولات التحقّق · اطلبي رمز جديد' },
        { status: 429 }
      );
    }

    // ─── التحقّق من الكود ───
    if (otp.code !== code) {
      await admin
        .from('otp_codes')
        .update({ attempts: otp.attempts + 1 })
        .eq('id', otp.id);

      return NextResponse.json(
        {
          ok: false,
          error: `رمز غير صحيح · محاولات متبقّية: ${4 - otp.attempts}`,
        },
        { status: 400 }
      );
    }

    // ─── الرمز صحيح · علّمي كمستخدم ───
    await admin
      .from('otp_codes')
      .update({ verified: true, used_at: new Date().toISOString() })
      .eq('id', otp.id);

    // ─── هل المستخدم موجود؟ ───
    // نستخدم إيميل افتراضي من الرقم: 966xxx@befirstlady.phone
    const syntheticEmail = `${formattedPhone}@befirstlady.phone`;

    // محاولة جلب مستخدم موجود بهذا الإيميل الاصطناعي
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === syntheticEmail);

    let userId: string;

    if (existing) {
      // ─── مستخدمة موجودة · نولّد Magic Link للدخول ───
      userId = existing.id;
    } else {
      // ─── مستخدمة جديدة · ننشئها ───
      const { data: newUser, error: createError } = await admin.auth.admin.createUser({
        email: syntheticEmail,
        phone: formattedPhone,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: {
          full_name: fullName || `عميلة ${formattedPhone.slice(-4)}`,
          phone: formattedPhone,
          login_method: 'whatsapp_otp',
        },
      });

      if (createError || !newUser.user) {
        console.error('[OTP Verify] Create user error:', createError);
        return NextResponse.json(
          { ok: false, error: 'فشل إنشاء الحساب · حاولي مجدداً' },
          { status: 500 }
        );
      }
      userId = newUser.user.id;

      // ─── إنشاء profile ───
      await admin.from('profiles').insert({
        id: userId,
        full_name: fullName || `عميلة ${formattedPhone.slice(-4)}`,
        phone: formattedPhone,
        role: 'customer',
      });
    }

    // ─── توليد جلسة دخول (magic link ثم exchange) ───
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: syntheticEmail,
    });

    if (linkError || !linkData) {
      console.error('[OTP Verify] Magic link error:', linkError);
      return NextResponse.json(
        { ok: false, error: 'فشل تسجيل الدخول · حاولي مجدداً' },
        { status: 500 }
      );
    }

    // استخراج التوكنات من الـURL
    const url = new URL(linkData.properties?.action_link || '');
    const hashedToken = url.searchParams.get('token') || linkData.properties?.hashed_token;

    if (!hashedToken) {
      return NextResponse.json(
        { ok: false, error: 'فشل توليد الجلسة' },
        { status: 500 }
      );
    }

    // ─── Exchange token → session باستخدام SSR client ───
    const ssr = await createServerClient();
    const { data: sessionData, error: verifyError } = await ssr.auth.verifyOtp({
      type: 'magiclink',
      token_hash: hashedToken,
    });

    if (verifyError || !sessionData.session) {
      console.error('[OTP Verify] Verify error:', verifyError);
      return NextResponse.json(
        { ok: false, error: 'فشل تفعيل الجلسة · حاولي مجدداً' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      userId,
      email: syntheticEmail,
      message: 'تم تسجيل الدخول بنجاح',
    });
  } catch (e: any) {
    console.error('[OTP Verify] Exception:', e);
    return NextResponse.json(
      { ok: false, error: 'خطأ غير متوقّع · حاولي مجدداً' },
      { status: 500 }
    );
  }
}
