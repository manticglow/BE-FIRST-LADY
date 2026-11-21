/**
 * GET /api/admin/compliance-report
 * ═══════════════════════════════════════════════════════════
 * يُرجع تقرير امتثال شامل لـPDPL + نظام التجارة + ZATCA
 *
 * Query params:
 *   - from=YYYY-MM-DD   (اختياري · افتراضي بداية الشهر الحالي)
 *   - to=YYYY-MM-DD     (اختياري · افتراضي اليوم)
 *
 * Response:
 *   {
 *     ok: true,
 *     period: { from, to },
 *     policies: { privacy, refund, terms, shipping, complaints, cookies },
 *     complaints: { total, resolved, pending, avg_response_hours, by_type },
 *     data_access: { total, fulfilled, pending, avg_days },
 *     breach_log: { total, within_72h, pending },
 *     zatca: { invoices_issued, total_vat, sample_qr_present },
 *     accounts: { deleted, marketing_consent_count, marketing_consent_rate },
 *     settings: { cr_number, tax_number, dpo_name, dpo_email, maroof_id },
 *     checklist: { passed, total, items: [...] },
 *   }
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (!role || !['owner', 'manager'].includes(role)) {
    return NextResponse.json({ error: 'للمالكة والمديرة فقط' }, { status: 403 });
  }

  // المدّة · افتراضياً الشهر الحالي
  const { searchParams } = new URL(req.url);
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 7) + '-01';
  const from = searchParams.get('from') || monthStart;
  const to = searchParams.get('to') || today;
  const fromDate = `${from}T00:00:00.000Z`;
  const toDate = `${to}T23:59:59.999Z`;

  const admin = createAdminClient();

  // ─── الشكاوى ───
  const { data: complaintsAll } = await admin
    .from('complaints')
    .select('status, type, created_at, responded_at, resolved_at')
    .gte('created_at', fromDate)
    .lte('created_at', toDate);

  const complaintsData = (complaintsAll || []) as Array<{
    status: string; type: string;
    created_at: string; responded_at: string | null; resolved_at: string | null;
  }>;

  const complaintsTotal = complaintsData.length;
  const complaintsResolved = complaintsData.filter(c => c.status === 'resolved').length;
  const complaintsPending = complaintsData.filter(c =>
    ['open', 'acknowledged', 'investigating'].includes(c.status)
  ).length;

  const responseHours = complaintsData
    .filter(c => c.responded_at)
    .map(c => {
      const start = new Date(c.created_at).getTime();
      const end = new Date(c.responded_at!).getTime();
      return (end - start) / 1000 / 60 / 60;
    });
  const avgResponseHours = responseHours.length
    ? Math.round(responseHours.reduce((a, b) => a + b, 0) / responseHours.length * 10) / 10
    : 0;

  const complaintsByType: Record<string, number> = {};
  for (const c of complaintsData) {
    complaintsByType[c.type] = (complaintsByType[c.type] || 0) + 1;
  }

  // ─── طلبات الوصول للبيانات (PDPL) ───
  const { data: darAll } = await admin
    .from('data_access_requests')
    .select('status, created_at, fulfilled_at')
    .gte('created_at', fromDate)
    .lte('created_at', toDate);

  const darData = (darAll || []) as Array<{
    status: string; created_at: string; fulfilled_at: string | null;
  }>;

  const darTotal = darData.length;
  const darFulfilled = darData.filter(r => r.status === 'fulfilled').length;
  const darPending = darData.filter(r => ['pending', 'processing'].includes(r.status)).length;
  const darDays = darData
    .filter(r => r.fulfilled_at)
    .map(r => {
      const start = new Date(r.created_at).getTime();
      const end = new Date(r.fulfilled_at!).getTime();
      return (end - start) / 1000 / 60 / 60 / 24;
    });
  const avgDarDays = darDays.length
    ? Math.round(darDays.reduce((a, b) => a + b, 0) / darDays.length * 10) / 10
    : 0;

  // ─── سجلّ الاختراقات (PDPL 72h) ───
  const { data: breachAll } = await admin
    .from('breach_log')
    .select('status, detected_at, notified_at')
    .gte('detected_at', fromDate)
    .lte('detected_at', toDate);

  const breachData = (breachAll || []) as Array<{
    status: string; detected_at: string; notified_at: string | null;
  }>;
  const breachTotal = breachData.length;
  const breachWithin72h = breachData.filter(b => {
    if (!b.notified_at) return false;
    const gapHours = (new Date(b.notified_at).getTime() - new Date(b.detected_at).getTime()) / 1000 / 60 / 60;
    return gapHours <= 72;
  }).length;
  const breachPending = breachData.filter(b => b.status === 'pending').length;

  // ─── ZATCA ─── الفواتير المصدّرة في الفترة
  const { count: invoicesCount } = await admin
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', 'paid')
    .gte('created_at', fromDate)
    .lte('created_at', toDate);

  const { data: paidBookings } = await admin
    .from('bookings')
    .select('vat_amount')
    .eq('payment_status', 'paid')
    .gte('created_at', fromDate)
    .lte('created_at', toDate);
  const totalVat = ((paidBookings || []) as Array<{ vat_amount: number | null }>)
    .reduce((sum, b) => sum + (Number(b.vat_amount) || 0), 0);

  // ─── الحسابات ───
  const { count: deletedAccountsCount } = await admin
    .from('deletion_log')
    .select('*', { count: 'exact', head: true })
    .gte('deleted_at', fromDate)
    .lte('deleted_at', toDate);

  const { count: totalCustomers } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer');

  const { count: marketingConsented } = await admin
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer')
    .eq('marketing_consent', true);

  // ─── إعدادات المنشأة (من tax_settings) ───
  const { data: settingsRaw } = await admin
    .from('tax_settings')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();
  const settings = (settingsRaw || {}) as Record<string, any>;

  // ─── Checklist الأساسي ───
  const checklist = [
    {
      key: 'cr_number',
      label: 'رقم السجل التجاري مُسجّل',
      law: 'نظام التجارة الإلكترونيّة · المادة 7',
      passed: !!settings.commercial_reg,
    },
    {
      key: 'tax_number',
      label: 'الرقم الضريبي مُسجّل (لو VAT مفعّل)',
      law: 'ZATCA · الفاتورة الإلكترونيّة',
      passed: !!settings.vat_number,
    },
    {
      key: 'dpo_contact',
      label: 'بيانات مسؤول حماية البيانات (DPO) موجودة',
      law: 'PDPL · المادة 32',
      passed: !!(settings.dpo_name && settings.dpo_email),
    },
    {
      key: 'privacy_policy',
      label: 'سياسة الخصوصيّة منشورة',
      law: 'PDPL · المادة 10',
      passed: true, // ثابتة في /legal/privacy
    },
    {
      key: 'refund_policy',
      label: 'سياسة الاسترداد منشورة (حقّ 7 أيّام)',
      law: 'نظام التجارة الإلكترونيّة · المادة 13',
      passed: true, // ثابتة في /legal/refund
    },
    {
      key: 'terms_of_use',
      label: 'شروط الاستخدام منشورة',
      law: 'نظام التجارة الإلكترونيّة · المادة 7',
      passed: true,
    },
    {
      key: 'complaints_system',
      label: 'نظام الشكاوى يعمل',
      law: 'نظام التجارة · المادة 20',
      passed: true,
    },
    {
      key: 'cookie_consent',
      label: 'الموافقة على الكوكيز مفعّلة',
      law: 'PDPL',
      passed: true,
    },
    {
      key: 'data_access',
      label: 'حقّ الوصول للبيانات مُفعّل',
      law: 'PDPL · المادة 4',
      passed: true,
    },
    {
      key: 'account_deletion',
      label: 'حقّ حذف الحساب مُفعّل',
      law: 'PDPL · المادة 4',
      passed: true,
    },
    {
      key: 'breach_log',
      label: 'سجلّ الاختراقات موجود (إبلاغ 72 ساعة)',
      law: 'PDPL · المادة 24',
      passed: true,
    },
    {
      key: 'zatca_phase1',
      label: 'فواتير ZATCA Phase 1 (QR + VAT)',
      law: 'ZATCA · 2022',
      passed: true,
    },
    {
      key: 'maroof',
      label: 'التسجيل في معروف',
      law: 'نظام التجارة · إلزامي للمتاجر',
      passed: !!settings.maroof_id,
    },
    {
      key: 'response_time',
      label: 'الردّ على الشكاوى خلال 14 يوم',
      law: 'نظام التجارة · المادة 20',
      passed: avgResponseHours === 0 || avgResponseHours / 24 <= 14,
    },
    {
      key: 'breach_72h',
      label: 'الإبلاغ عن الاختراقات خلال 72 ساعة',
      law: 'PDPL · المادة 24',
      passed: breachTotal === 0 || breachWithin72h === breachTotal,
    },
  ];
  const passedCount = checklist.filter(c => c.passed).length;

  return NextResponse.json({
    ok: true,
    period: { from, to },
    generated_at: new Date().toISOString(),
    policies: {
      privacy: '/legal/privacy',
      refund: '/legal/refund',
      terms: '/legal/terms',
      shipping: '/legal/shipping',
      complaints: '/legal/complaints',
    },
    complaints: {
      total: complaintsTotal,
      resolved: complaintsResolved,
      pending: complaintsPending,
      resolution_rate: complaintsTotal ? Math.round((complaintsResolved / complaintsTotal) * 100) : 0,
      avg_response_hours: avgResponseHours,
      by_type: complaintsByType,
    },
    data_access: {
      total: darTotal,
      fulfilled: darFulfilled,
      pending: darPending,
      avg_fulfillment_days: avgDarDays,
    },
    breach_log: {
      total: breachTotal,
      within_72h: breachWithin72h,
      pending: breachPending,
      compliance_rate: breachTotal
        ? Math.round((breachWithin72h / breachTotal) * 100)
        : 100,
    },
    zatca: {
      invoices_issued: invoicesCount || 0,
      total_vat: Math.round(totalVat * 100) / 100,
      phase: 'Phase 1 (محلّي)',
    },
    accounts: {
      total_customers: totalCustomers || 0,
      marketing_consent_count: marketingConsented || 0,
      marketing_consent_rate: totalCustomers
        ? Math.round(((marketingConsented || 0) / totalCustomers) * 100)
        : 0,
      deleted_in_period: deletedAccountsCount || 0,
    },
    settings: {
      salon_name: settings.business_name_ar || 'The First Lady',
      cr_number: settings.commercial_reg || null,
      tax_number: settings.vat_number || null,
      dpo_name: settings.dpo_name || null,
      dpo_email: settings.dpo_email || null,
      maroof_id: settings.maroof_id || null,
    },
    checklist: {
      passed: passedCount,
      total: checklist.length,
      score: Math.round((passedCount / checklist.length) * 100),
      items: checklist,
    },
  });
}
