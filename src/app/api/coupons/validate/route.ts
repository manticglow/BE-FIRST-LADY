/**
 * POST /api/coupons/validate
 * Body: { code: string, subtotal: number, phone?: string }
 * يرجع الخصم المطبّق أو خطأ
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { code, subtotal, phone } = await req.json();
  if (!code || !subtotal) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: coupon } = await supabase
    .from('coupons')
    .select('*')
    .ilike('code', code.trim())
    .eq('is_active', true)
    .single();

  if (!coupon) {
    return NextResponse.json({ valid: false, error: 'الكود غير موجود أو منتهي' }, { status: 404 });
  }

  // التحقق من الصلاحية
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'الكود منتهي الصلاحية' }, { status: 400 });
  }

  // التحقق من عدد الاستخدامات
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return NextResponse.json({ valid: false, error: 'الكود استُنفد' }, { status: 400 });
  }

  // الحد الأدنى
  if (subtotal < coupon.min_total) {
    return NextResponse.json({
      valid: false,
      error: `الحد الأدنى للطلب ${coupon.min_total} ر.س`,
    }, { status: 400 });
  }

  // احسب الخصم
  const discount = coupon.discount_type === 'percentage'
    ? (subtotal * Number(coupon.discount_value) / 100)
    : Math.min(Number(coupon.discount_value), subtotal);

  return NextResponse.json({
    valid: true,
    code: coupon.code,
    discount: Math.round(discount * 100) / 100,
    description: coupon.description,
    new_total: Math.round((subtotal - discount) * 100) / 100,
  });
}
