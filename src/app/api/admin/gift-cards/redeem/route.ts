/**
 * POST /api/admin/gift-cards/redeem
 * ═══════════════════════════════════════════════════════════
 * استخدام بطاقة هديّة (في المحل)
 * - صلاحيّة: owner/manager/staff
 * - يتحقّق إنها نشطة + ما انتهت + فيها رصيد
 * - mode='full': يستخدم كل الرصيد (one-shot · افتراضي)
 * - mode='partial': يستخدم مبلغ محدّد
 * - يمنع الاستخدام المكرّر عبر RLS + check
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auditLog, extractRequestInfo } from '@/lib/audit-log';

const schema = z.object({
  code: z.string().min(3).max(50).transform((s) => s.trim().toUpperCase()),
  mode: z.enum(['full', 'partial']).default('full'),
  amount: z.number().positive().optional(),  // مطلوب لو mode=partial
  booking_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(300).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();
  if (!profile || !['owner', 'manager', 'staff'].includes((profile as any).role)) {
    return NextResponse.json({ error: 'ليس لديكِ صلاحية' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات غير صحيحة' }, { status: 400 });
  }

  const d = parsed.data;
  const admin = createAdminClient();

  // جلب البطاقة بالكود
  const { data: card, error: fetchErr } = await admin
    .from('gift_cards')
    .select('*')
    .eq('code', d.code)
    .maybeSingle();

  if (fetchErr || !card) {
    return NextResponse.json({ error: '❌ البطاقة غير موجودة · الكود غير صحيح' }, { status: 404 });
  }

  // ═══ تحقّقات الصلاحيّة ═══
  if (!card.is_active) {
    return NextResponse.json({
      error: '🚫 البطاقة مُعطّلة',
      card: { code: card.code, status: 'disabled' },
    }, { status: 400 });
  }

  if (Number(card.balance) <= 0) {
    return NextResponse.json({
      error: '🚫 البطاقة مستخدمة بالكامل · ما فيها رصيد',
      card: {
        code: card.code,
        balance: 0,
        initial_amount: card.initial_amount,
        status: 'used',
      },
    }, { status: 400 });
  }

  if (card.expires_at && new Date(card.expires_at) < new Date()) {
    return NextResponse.json({
      error: '🚫 البطاقة منتهيّة الصلاحيّة',
      card: {
        code: card.code,
        expired_at: card.expires_at,
        status: 'expired',
      },
    }, { status: 400 });
  }

  // ═══ تحديد المبلغ المستخدم ═══
  const availableBalance = Number(card.balance);
  const amountToUse = d.mode === 'full'
    ? availableBalance
    : Math.min(d.amount || 0, availableBalance);

  if (amountToUse <= 0) {
    return NextResponse.json({ error: 'المبلغ لازم يكون أكبر من صفر' }, { status: 400 });
  }

  const newBalance = availableBalance - amountToUse;

  // ═══ تنفيذ الاستخدام (atomic) ═══
  // تحديث الرصيد + تعطيل البطاقة لو انتهت
  const { data: updated, error: updateErr } = await admin
    .from('gift_cards')
    .update({
      balance: newBalance,
      is_active: newBalance > 0,  // تُعطَّل تلقائياً لو خلصت
    })
    .eq('id', card.id)
    .eq('balance', card.balance)  // optimistic lock · ما يسمح بالتحديث المتزامن
    .select()
    .single();

  if (updateErr || !updated) {
    return NextResponse.json({
      error: '⚠️ البطاقة تم استخدامها لتوّها من مكان آخر · جرّبي مرة ثانية',
    }, { status: 409 });
  }

  // ═══ سجل الاستخدام (للتوثيق) ═══
  await admin.from('gift_card_redemptions').insert({
    gift_card_id: card.id,
    booking_id: d.booking_id || null,
    amount: amountToUse,
    balance_after: newBalance,
  });

  // ═══ Audit Log ═══
  const { ip, ua } = extractRequestInfo(req);
  await auditLog({
    userId: user.id,
    userEmail: user.email || null,
    userRole: (profile as any).role,
    action: 'gift_card.redeem',
    resourceType: 'gift_card',
    resourceId: String(card.id),
    metadata: {
      code: card.code,
      amount_used: amountToUse,
      balance_before: availableBalance,
      balance_after: newBalance,
      mode: d.mode,
      booking_id: d.booking_id || null,
    },
    ipAddress: ip,
    userAgent: ua,
    success: true,
  });

  return NextResponse.json({
    ok: true,
    code: card.code,
    amount_used: amountToUse,
    balance_before: availableBalance,
    balance_after: newBalance,
    status: newBalance > 0 ? 'partial' : 'fully_used',
    recipient_name: card.recipient_name,
    message: newBalance > 0
      ? `✅ تم استخدام ${amountToUse} ر.س · الرصيد المتبقّي: ${newBalance} ر.س`
      : `✅ تم استخدام البطاقة بالكامل (${amountToUse} ر.س)`,
  });
}
