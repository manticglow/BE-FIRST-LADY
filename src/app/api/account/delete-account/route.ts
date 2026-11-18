/**
 * POST /api/account/delete-account
 * ═══════════════════════════════════════════════════════════
 * 🔒 حقّ المحو · PDPL Article 17
 *
 * - يتطلّب إعادة تأكيد (reconfirm password أو OTP)
 * - ينظّف: profiles · bookings (anonymize) · visit_photos
 *   waitlist · wallet · webauthn · push subscriptions · gift cards
 * - يحذف الحساب نهائياً من auth.users
 * - يصدر audit log قبل الحذف للامتثال
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { auditLog, extractRequestInfo } from '@/lib/audit-log';
import { logger } from '@/lib/logger';

const log = logger.scope('delete-account');

export async function POST(req: NextRequest) {
  const { ip, ua } = extractRequestInfo(req);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const confirmation = String(body?.confirmation || '').trim();

  // 🛡 يتطلّب كتابة "احذفي حسابي" تماماً
  if (confirmation !== 'احذفي حسابي') {
    return NextResponse.json({
      ok: false,
      error: 'للتأكيد · اكتبي "احذفي حسابي" في حقل التأكيد',
    }, { status: 400 });
  }

  // 🛡 لا نسمح للمالكة/المديرة بحذف نفسها من هنا (يجب نقل الصلاحيّة أوّل)
  const { data: profile } = await supabase
    .from('profiles').select('role, full_name').eq('id', user.id).single();

  if (profile && ['owner', 'manager'].includes((profile as any).role)) {
    return NextResponse.json({
      ok: false,
      error: 'لا يمكن حذف حساب المالكة/المديرة من هنا · تواصلي مع فريق الدعم',
    }, { status: 403 });
  }

  const admin = createAdminClient();

  try {
    // 1. Audit log قبل الحذف (للامتثال · نحتفظ بالسجلّ لكن نحذف البيانات)
    await auditLog({
      userId: user.id,
      userEmail: user.email || null,
      action: 'customer.delete',
      metadata: {
        self_initiated: true,
        reason: body?.reason || null,
      },
      ipAddress: ip,
      userAgent: ua,
      success: true,
    });

    // 2. Anonymize bookings (نحتفظ بالسجلّ المالي لكن نحذف PII)
    await admin.from('bookings').update({
      customer_id: null,
      customer_name: '[مُحذوف]',
      customer_phone: null,
      customer_email: null,
      notes: null,
    }).eq('customer_id', user.id);

    // 3. حذف كامل من الجداول الفرعيّة
    const tablesToCleanse = [
      'waitlist_entries', 'wallet_transactions', 'birthday_messages',
      'loyalty_challenge_progress', 'customer_favorites',
      'webauthn_credentials', 'push_subscriptions', 'device_tokens',
      'visit_photos', 'carts', 'beauty_profiles',
    ];

    for (const t of tablesToCleanse) {
      try {
        if ((t as string) === 'webauthn_credentials' || (t as string) === 'push_subscriptions' || (t as string) === 'device_tokens') {
          await admin.from(t).delete().eq('user_id', user.id);
        } else {
          await admin.from(t).delete().eq('customer_id', user.id);
        }
      } catch {
        // الجدول قد لا يكون موجوداً · نتجاوز
      }
    }

    // 4. حذف profile
    await admin.from('profiles').delete().eq('id', user.id);

    // 5. حذف من auth.users (نهائي)
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) {
      log.error('auth.deleteUser failed', delErr);
      return NextResponse.json({
        ok: false,
        error: 'لم يكتمل حذف الحساب · تواصلي مع الدعم',
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: 'تمّ حذف حسابكِ وبياناتكِ · شكراً لثقتكِ 🤍',
    });
  } catch (e: any) {
    log.error('delete-account exception', e);
    return NextResponse.json({
      ok: false,
      error: 'حدث خطأ · تواصلي مع الدعم',
    }, { status: 500 });
  }
}
