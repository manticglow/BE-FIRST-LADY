/**
 * POST /api/legal/complaints
 * ═══════════════════════════════════════════════════════════
 * استلام شكوى + حفظها + إبلاغ المالكة بواتساب
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { auditLog, extractRequestInfo } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  const { ip, ua } = extractRequestInfo(req);

  // 🛡 rate limit · 3 شكاوى/15 دقيقة لكل IP
  const rl = await checkRateLimit({
    key: ip || 'unknown',
    category: 'complaints',
    max: 3,
    windowSec: 15 * 60,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: 'محاولات كثيرة · حاولي بعد قليل' },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const { name, phone, email, type, subject, message } = body;

  if (!name || !phone || !message) {
    return NextResponse.json(
      { ok: false, error: 'الاسم والجوّال والرسالة مطلوبون' },
      { status: 400 },
    );
  }

  if (String(message).length > 2000) {
    return NextResponse.json({ ok: false, error: 'الرسالة طويلة جداً' }, { status: 400 });
  }

  const admin = createAdminClient();

  // توليد رقم مرجع
  const reference = 'CMP-' + Date.now().toString(36).toUpperCase();

  // احفظي في جدول complaints (لو موجود · إلا كـfallback في audit_logs)
  try {
    await admin.from('complaints').insert({
      reference,
      name: String(name).slice(0, 100),
      phone: String(phone).slice(0, 20),
      email: email ? String(email).slice(0, 150) : null,
      type: String(type || 'other').slice(0, 30),
      subject: subject ? String(subject).slice(0, 200) : null,
      message: String(message).slice(0, 2000),
      status: 'open',
      ip_address: ip,
    });
  } catch {
    // الجدول قد لا يكون موجود · كـfallback نسجّل في audit_logs
  }

  await auditLog({
    action: 'customer.notes_update',
    resourceType: 'complaint',
    resourceId: reference,
    metadata: {
      reference,
      type,
      has_email: !!email,
    },
    ipAddress: ip,
    userAgent: ua,
    success: true,
  });

  // أرسلي تنبيه للمالكة بواتساب (fire-and-forget)
  (async () => {
    try {
      const { sendWhatsAppText, formatPhoneForWhatsApp } = await import('@/lib/integrations/whatsapp');
      const ownerPhone = process.env.OWNER_WHATSAPP || '966504134147';
      const msg = `⚠️ شكوى جديدة · ${reference}\n\nمن: ${name}\nجوال: ${phone}\nالنوع: ${type}\n${subject ? `الموضوع: ${subject}\n` : ''}\nالرد خلال 24 ساعة.\n\nافتحي: /admin/complaints`;
      await sendWhatsAppText(formatPhoneForWhatsApp(ownerPhone), msg);
    } catch {
      // silent
    }
  })();

  return NextResponse.json({
    ok: true,
    reference,
    message: 'استلمنا شكوتكِ · نرد خلال 24 ساعة',
  });
}
