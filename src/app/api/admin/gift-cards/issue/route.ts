/**
 * POST /api/admin/gift-cards/issue
 * ═══════════════════════════════════════════════════════════
 * إصدار بطاقة هديّة يدوياً من قِبل الإدارة
 * - صلاحيّة: owner/manager
 * - يُنشئ كود فريد (GC-XXXXXXXX)
 * - يحفظ البطاقة بحالة نشطة
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auditLog, extractRequestInfo } from '@/lib/audit-log';

const schema = z.object({
  amount: z.number().min(10).max(20000),
  recipient_name: z.string().min(2).max(100),
  recipient_phone: z.string().min(9).max(20),
  recipient_email: z.string().email().nullable().optional(),
  message: z.string().max(500).nullable().optional(),
  design: z.enum(['gold', 'pink', 'floral']).default('gold'),
  expires_days: z.number().int().min(0).max(730).default(365),
  // للتوثيق · من دفع
  purchaser_name: z.string().min(2).max(100).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();
  const profile = profileRaw as { role: string; full_name: string | null } | null;
  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'الإصدار متاح للمالكة والمديرة فقط' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات غير صحيحة' }, { status: 400 });
  }

  const d = parsed.data;
  const admin = createAdminClient();

  // توليد كود فريد
  const { data: codeData } = await admin.rpc('generate_gift_card_code');
  const code = codeData || `GC-${Date.now().toString(36).toUpperCase()}`;

  // تاريخ الانتهاء
  const expiresAt = d.expires_days > 0
    ? new Date(Date.now() + d.expires_days * 86400000).toISOString()
    : null;

  // تنظيف الجوال
  const cleanPhone = d.recipient_phone.replace(/[^0-9+]/g, '');

  const { data: card, error } = await admin
    .from('gift_cards')
    .insert({
      code,
      initial_amount: d.amount,
      balance: d.amount,
      purchaser_name: d.purchaser_name || `إصدار من ${profile.full_name || 'الإدارة'}`,
      purchaser_phone: cleanPhone,
      recipient_name: d.recipient_name,
      recipient_phone: cleanPhone,
      recipient_email: d.recipient_email || null,
      message: d.message || null,
      design: d.design,
      expires_at: expiresAt,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error('Gift card issue error:', error);
    return NextResponse.json({ error: 'فشل إصدار البطاقة' }, { status: 500 });
  }

  // ═══ Audit Log ═══
  const { ip, ua } = extractRequestInfo(req);
  await auditLog({
    userId: user.id,
    userEmail: user.email || null,
    userRole: profile.role,
    action: 'gift_card.issue',
    resourceType: 'gift_card',
    resourceId: String(card.id),
    metadata: {
      code: card.code,
      amount: d.amount,
      recipient_name: d.recipient_name,
      recipient_phone: cleanPhone,
      design: d.design,
      expires_days: d.expires_days,
    },
    ipAddress: ip,
    userAgent: ua,
    success: true,
  });

  return NextResponse.json({
    ok: true,
    card: {
      id: card.id,
      id: card.id,
      code: card.code,
      amount: card.initial_amount,
      recipient_name: card.recipient_name,
      recipient_phone: card.recipient_phone,
      recipient_email: card.recipient_email,
      message: card.message,
      design: card.design,
      expires_at: card.expires_at,
    },
    message: `✅ تم إصدار البطاقة · الكود: ${card.code}`,
  });
}
