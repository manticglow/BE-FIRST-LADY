/**
 * POST /api/gift-cards        — شراء بطاقة هدية (عام)
 * GET  /api/gift-cards?code=  — التحقق من رصيد البطاقة
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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
  const body = await req.json();
  const parsed = purchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message || 'بيانات غير صحيحة' }, { status: 400 });
  }
  const d = parsed.data;

  const admin = createAdminClient();
  const { data: codeData } = await admin.rpc('generate_gift_card_code');
  const code = codeData || `GC-${Date.now().toString(36).toUpperCase()}`;

  const { data, error } = await admin.from('gift_cards').insert({
    code,
    initial_amount: d.amount,
    balance: d.amount,
    purchaser_name: d.purchaser_name,
    purchaser_phone: d.purchaser_phone,
    recipient_name: d.recipient_name || null,
    recipient_phone: d.recipient_phone || null,
    message: d.message || null,
    design: d.design || 'gold',
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    ok: true,
    code: data.code,
    amount: data.initial_amount,
  });
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) return NextResponse.json({ error: 'كود البطاقة مطلوب' }, { status: 400 });

  const supabase = await createClient();
  const { data } = await supabase.from('gift_cards')
    .select('code, balance, initial_amount, is_active, expires_at, recipient_name, message, design')
    .eq('code', code.toUpperCase().trim())
    .maybeSingle();

  if (!data) return NextResponse.json({ error: 'البطاقة غير موجودة' }, { status: 404 });

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
