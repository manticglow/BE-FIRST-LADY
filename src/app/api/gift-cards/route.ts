/**
 * POST /api/gift-cards        — إنشاء مسودّة بطاقة هديّة · تُفعّل بعد الدفع فقط
 * GET  /api/gift-cards?code=  — التحقق من رصيد البطاقة
 *
 * 🔒 SECURITY: البطاقة تُنشأ بـstatus='pending' وbalance=0 · لا تصبح صالحة
 *             إلا بعد تأكيد الدفع من webhook الدفع (payment_intents).
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp, rateLimitErrorResponse } from '@/lib/rate-limit';

const purchaseSchema = z.object({
  amount: z.number().min(50).max(10000),
  purchaser_name: z.string().min(2).max(100),
  purchaser_phone: z.string().min(9).max(20),
  recipient_name: z.string().min(2).max(100).optional(),
  recipient_phone: z.string().min(9).max(20).optional(),
  message: z.string().max(300).optional(),
  design: z.enum(['gold', 'pink', 'floral']).optional(),
});

export async function POST(req: NextRequest) {
  // 🔒 لازم المشترية مسجّلة دخول
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: 'يجب تسجيل الدخول لشراء بطاقة هديّة' },
      { status: 401 }
    );
  }

  // 🔒 Rate limit: 5 محاولات/10 دقائق لكل مستخدم
  const rl = await checkRateLimit({
    key: user.id,
    category: 'gift-card-create',
    max: 5,
    windowSec: 600,
  });
  if (!rl.allowed) {
    return NextResponse.json(rateLimitErrorResponse(rl), { status: 429 });
  }

  const body = await req.json();
  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message || 'بيانات غير صحيحة' },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const admin = createAdminClient();
  const { data: codeData } = await admin.rpc('generate_gift_card_code');
  const code = codeData || `GC-${Date.now().toString(36).toUpperCase()}`;

  // 🔒 البطاقة تُنشأ pending · لا تصبح نشطة إلا بعد الدفع
  const { data, error } = await admin.from('gift_cards').insert({
    code,
    initial_amount: d.amount,
    balance: 0,                      // ← صفر حتى الدفع
    is_active: false,                // ← غير نشطة حتى الدفع
    purchaser_id: user.id,           // ← لربطها بالمشترية
    purchaser_name: d.purchaser_name,
    purchaser_phone: d.purchaser_phone,
    recipient_name: d.recipient_name || null,
    recipient_phone: d.recipient_phone || null,
    message: d.message || null,
    design: d.design || 'gold',
    payment_status: 'pending',       // ← حالة الدفع
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // بعد إنشاء المسودّة · العميلة تنتقل لصفحة الدفع
  // الـwebhook هو اللي يفعّل البطاقة ويحوّل balance = initial_amount
  return NextResponse.json({
    ok: true,
    code: data.code,
    amount: data.initial_amount,
    gift_card_id: data.id,
    requires_payment: true,
    next_step: `/gift-cards/${data.id}/pay`,
  });
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'كود البطاقة مطلوب' }, { status: 400 });

  // 🔒 Rate limit على الاستعلام (منع brute-force الأكواد)
  const ip = getClientIp(req);
  const rl = await checkRateLimit({
    key: `ip:${ip}`,
    category: 'gift-card-check',
    max: 20,
    windowSec: 60,
  });
  if (!rl.allowed) {
    return NextResponse.json(rateLimitErrorResponse(rl), { status: 429 });
  }

  const supabase = await createClient();
  const { data } = await supabase.from('gift_cards')
    .select('code, balance, initial_amount, is_active, expires_at, recipient_name, message, design, payment_status')
    .eq('code', code.toUpperCase().trim())
    .maybeSingle();

  if (!data) return NextResponse.json({ error: 'البطاقة غير موجودة' }, { status: 404 });

  // 🔒 إذا لم تُدفع بعد · ترجع كغير موجودة (لمنع الكشف)
  if (data.payment_status !== 'paid') {
    return NextResponse.json({ error: 'البطاقة غير موجودة' }, { status: 404 });
  }

  const expired = data.expires_at && new Date(data.expires_at) < new Date();
  const valid = data.is_active && !expired && Number(data.balance) > 0;

  return NextResponse.json({
    valid,
    code: data.code,
    balance: data.balance,
    initial_amount: data.initial_amount,
    recipient_name: data.recipient_name,
    message: data.message,
    design: data.design,
    expired,
  });
}
