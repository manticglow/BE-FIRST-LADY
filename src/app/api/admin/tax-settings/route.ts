/**
 * GET  /api/admin/tax-settings
 * PUT  /api/admin/tax-settings
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { isValidSaudiVATNumber } from '@/lib/zatca';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'غير مصرح', code: 401 };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return { error: 'للمالكة/المديرة فقط', code: 403 };
  }
  return { error: null, code: 0 };
}

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.from('tax_settings').select('*').eq('is_active', true).maybeSingle();
  return NextResponse.json({ settings: data });
}

export async function PUT(req: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const body = await req.json();

  // تحقق من الرقم الضريبي لو موجود
  if (body.vat_number && body.apply_vat && !isValidSaudiVATNumber(body.vat_number)) {
    return NextResponse.json({
      error: 'الرقم الضريبي غير صحيح — يجب 15 رقم يبدأ وينتهي بـ 3'
    }, { status: 400 });
  }

  if (body.apply_vat && !body.vat_number) {
    return NextResponse.json({
      error: 'الرقم الضريبي مطلوب لتفعيل الضريبة'
    }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: existing } = await admin.from('tax_settings').select('id').eq('is_active', true).maybeSingle();

  const payload = {
    business_name_ar: body.business_name_ar,
    business_name_en: body.business_name_en || null,
    commercial_reg: body.commercial_reg || null,
    vat_number: body.vat_number || null,
    address: body.address || null,
    city: body.city || null,
    apply_vat: body.apply_vat || false,
    vat_rate: body.vat_rate || 15.00,
    prices_include_vat: body.prices_include_vat ?? true,
    invoice_prefix: body.invoice_prefix || 'INV',
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await admin.from('tax_settings').update(payload).eq('id', existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else {
    const { error } = await admin.from('tax_settings').insert({ ...payload, is_active: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
