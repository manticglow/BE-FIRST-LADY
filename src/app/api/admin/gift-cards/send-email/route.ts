/**
 * POST /api/admin/gift-cards/send-email
 * ═══════════════════════════════════════════════════════════
 * إرسال بطاقة هديّة بالإيميل
 * - البطاقة تُرفَق كـصورة PNG + PDF (base64)
 * - HTML template فاخر مع كود + QR + تعليمات
 *
 * Body:
 * {
 *   card_id?: string,                 // لو موجود · يُحدّث البطاقة
 *   to_email: string,
 *   code: string,
 *   amount: number,
 *   recipient_name: string,
 *   message?: string,
 *   design: 'gold'|'pink'|'floral',
 *   expires_at?: string,
 *   purchaser_name?: string,
 *   png_base64?: string,             // صورة البطاقة من html2canvas
 *   pdf_base64?: string,             // PDF من jsPDF (اختياري)
 * }
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// نسمح بـbody كبير · الـPNG + PDF ممكن يوصلون 5-8MB
export const maxDuration = 30;
export const runtime = 'nodejs';

import { sendEmail, isValidEmail } from '@/lib/email';
import {
  buildGiftCardEmailHtml,
  buildGiftCardEmailText,
} from '@/lib/emails/gift-card-template';
import { auditLog, extractRequestInfo } from '@/lib/audit-log';

const schema = z.object({
  card_id: z.string().uuid().optional(),
  to_email: z.string().email('إيميل غير صحيح'),
  code: z.string().min(3).max(50),
  amount: z.number().positive(),
  recipient_name: z.string().min(1).max(100),
  message: z.string().max(500).nullable().optional(),
  design: z.enum(['gold', 'pink', 'floral']).default('gold'),
  expires_at: z.string().nullable().optional(),
  purchaser_name: z.string().max(100).nullable().optional(),
  png_base64: z.string().optional(),
  pdf_base64: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || !['owner', 'manager', 'staff'].includes((profile as any).role)) {
    return NextResponse.json({ error: 'ليس لديكِ صلاحية' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'بيانات غير صحيحة' },
      { status: 400 },
    );
  }

  const d = parsed.data;
  const { ip, ua } = extractRequestInfo(req);

  // ─── بناء الإيميل ───
  const html = buildGiftCardEmailHtml({
    code: d.code,
    amount: d.amount,
    recipient_name: d.recipient_name,
    purchaser_name: d.purchaser_name,
    message: d.message,
    design: d.design,
    expires_at: d.expires_at,
  });
  const text = buildGiftCardEmailText({
    code: d.code,
    amount: d.amount,
    recipient_name: d.recipient_name,
    message: d.message,
    design: d.design,
    expires_at: d.expires_at,
  });

  // ─── الـattachments ───
  const attachments = [];
  if (d.png_base64) {
    // ننظف أي "data:image/png;base64," prefix
    const base64 = d.png_base64.replace(/^data:[^;]+;base64,/, '');
    attachments.push({
      filename: `gift-card-${d.code}.png`,
      content: Buffer.from(base64, 'base64'),
      contentType: 'image/png',
    });
  }
  if (d.pdf_base64) {
    const base64 = d.pdf_base64.replace(/^data:[^;]+;base64,/, '');
    attachments.push({
      filename: `gift-card-${d.code}.pdf`,
      content: Buffer.from(base64, 'base64'),
      contentType: 'application/pdf',
    });
  }

  // ─── إرسال ───
  const result = await sendEmail({
    to: d.to_email,
    subject: `🎁 بطاقة هديّة فاخرة من Be First Lady · ${d.amount} ر.س`,
    html,
    text,
    attachments: attachments.length > 0 ? attachments : undefined,
  });

  // ─── Audit ───
  await auditLog({
    userId: user.id,
    userEmail: user.email || null,
    userRole: (profile as any).role,
    action: 'gift_card.issue',
    resourceType: 'gift_card_email',
    resourceId: d.card_id || d.code,
    metadata: {
      code: d.code,
      amount: d.amount,
      sent_to: d.to_email,
      has_png: !!d.png_base64,
      has_pdf: !!d.pdf_base64,
    },
    ipAddress: ip,
    userAgent: ua,
    success: result.ok,
    errorMessage: result.ok ? undefined : result.error,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  // ─── سجّلي الإيميل على البطاقة (لو عندنا card_id) ───
  if (d.card_id) {
    const admin = createAdminClient();
    await admin
      .from('gift_cards')
      .update({ recipient_email: d.to_email })
      .eq('id', d.card_id);
  }

  return NextResponse.json({
    ok: true,
    message: `📧 تم إرسال البطاقة إلى ${d.to_email}`,
    email_id: result.id,
  });
}
