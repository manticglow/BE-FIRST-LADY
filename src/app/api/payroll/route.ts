/**
 * GET  /api/payroll?month=X&year=Y — جلب رواتب الشهر
 * POST /api/payroll — توليد رواتب الشهر تلقائياً من الحضور
 * PATCH /api/payroll — تعديل راتب (مكافأة/خصم/دفع)
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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

export async function GET(req: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const month = Number(req.nextUrl.searchParams.get('month') || new Date().getMonth() + 1);
  const year = Number(req.nextUrl.searchParams.get('year') || new Date().getFullYear());

  const admin = createAdminClient();
  const { data } = await admin
    .from('payroll_records')
    .select('*, user:profiles!payroll_records_user_id_fkey(id, full_name, role)')
    .eq('period_month', month)
    .eq('period_year', year);

  return NextResponse.json({ records: data || [], month, year });
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const { month, year } = await req.json();
  const admin = createAdminClient();

  // جلب كل الموظفات
  const { data: staff } = await admin.from('profiles').select('id, full_name, hourly_rate, monthly_salary')
    .in('role', ['staff', 'manager']);

  // تواريخ الشهر
  const periodStart = new Date(year, month - 1, 1).toISOString();
  const periodEnd = new Date(year, month, 0, 23, 59, 59).toISOString();

  let created = 0;
  for (const s of staff || []) {
    // تجاهلي الموجودين
    const { data: existing } = await admin.from('payroll_records').select('id')
      .eq('user_id', s.id).eq('period_month', month).eq('period_year', year).maybeSingle();
    if (existing) continue;

    // احسبي الساعات من الحضور
    const { data: attendance } = await admin.from('attendance_records').select('total_minutes')
      .eq('user_id', s.id).gte('check_in_at', periodStart).lte('check_in_at', periodEnd)
      .not('total_minutes', 'is', null);

    const totalMinutes = (attendance || []).reduce((sum: number, r: any) => sum + (r.total_minutes || 0), 0);
    const totalHours = Math.round((totalMinutes / 60) * 100) / 100;

    // احسبي الراتب
    let baseAmount = 0;
    const hourlyRate = Number(s.hourly_rate || 0);
    const monthlySalary = Number(s.monthly_salary || 0);

    if (monthlySalary > 0) {
      baseAmount = monthlySalary;
    } else if (hourlyRate > 0) {
      baseAmount = totalHours * hourlyRate;
    }

    await admin.from('payroll_records').insert({
      user_id: s.id,
      period_month: month,
      period_year: year,
      total_hours: totalHours,
      hourly_rate: hourlyRate || null,
      base_amount: baseAmount,
      net_amount: baseAmount,
    });
    created++;
  }

  return NextResponse.json({ ok: true, created });
}

export async function PATCH(req: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const { id, bonuses, deductions, notes, paid } = await req.json();
  const admin = createAdminClient();

  // جلب الحالي
  const { data: current } = await admin.from('payroll_records').select('*').eq('id', id).single();
  if (!current) return NextResponse.json({ error: 'غير موجود' }, { status: 404 });

  const b = bonuses !== undefined ? Number(bonuses) : Number(current.bonuses || 0);
  const d = deductions !== undefined ? Number(deductions) : Number(current.deductions || 0);
  const net = Number(current.base_amount) + b - d;

  const updates: any = {
    bonuses: b,
    deductions: d,
    net_amount: net,
  };
  if (notes !== undefined) updates.notes = notes;
  if (paid === true) updates.paid_at = new Date().toISOString();
  if (paid === false) updates.paid_at = null;

  await admin.from('payroll_records').update(updates).eq('id', id);
  return NextResponse.json({ ok: true, net_amount: net });
}
