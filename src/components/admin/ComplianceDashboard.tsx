/**
 * ComplianceDashboard — لوحة تقارير الامتثال التفاعليّة
 * ═══════════════════════════════════════════════════════════
 * - بطاقات إحصائيّات PDPL + Commerce + ZATCA
 * - checklist مع ✓/✗ لكل اشتراط + رقم المادة القانونيّة
 * - زرّ طباعة (window.print → PDF)
 * - اختيار الفترة (شهر حالي · شهر سابق · سنة)
 */
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Shield, FileText, AlertTriangle, CheckCircle2, XCircle, Printer,
  Clock, Users, Trash2, Mail, Hash, Gavel, Download, Loader2,
  TrendingUp, Bell, Lock,
} from 'lucide-react';
import { toast } from 'sonner';

interface Report {
  ok: boolean;
  period: { from: string; to: string };
  generated_at: string;
  policies: Record<string, string>;
  complaints: {
    total: number; resolved: number; pending: number;
    resolution_rate: number; avg_response_hours: number;
    by_type: Record<string, number>;
  };
  data_access: {
    total: number; fulfilled: number; pending: number;
    avg_fulfillment_days: number;
  };
  breach_log: {
    total: number; within_72h: number; pending: number;
    compliance_rate: number;
  };
  zatca: {
    invoices_issued: number; total_vat: number; phase: string;
  };
  accounts: {
    total_customers: number; marketing_consent_count: number;
    marketing_consent_rate: number; deleted_in_period: number;
  };
  settings: {
    salon_name: string; cr_number: string | null; tax_number: string | null;
    dpo_name: string | null; dpo_email: string | null; maroof_id: string | null;
  };
  checklist: {
    passed: number; total: number; score: number;
    items: Array<{ key: string; label: string; law: string; passed: boolean }>;
  };
}

function monthRange(offset = 0): { from: string; to: string } {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  const year = d.getFullYear();
  const month = d.getMonth();
  const from = new Date(year, month, 1).toISOString().slice(0, 10);
  const to = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

function yearRange(): { from: string; to: string } {
  const d = new Date();
  const from = `${d.getFullYear()}-01-01`;
  const to = d.toISOString().slice(0, 10);
  return { from, to };
}

type Period = 'current' | 'previous' | 'year';

export default function ComplianceDashboard() {
  const [period, setPeriod] = useState<Period>('current');
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    if (period === 'current') return monthRange(0);
    if (period === 'previous') return monthRange(-1);
    return yearRange();
  }, [period]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/admin/compliance-report?from=${range.from}&to=${range.to}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.ok) setReport(data);
        else toast.error(data.error || 'تعثّر التحميل');
      })
      .catch(() => { if (!cancelled) toast.error('تعثّر الاتّصال'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [range.from, range.to]);

  function handlePrint() {
    window.print();
  }

  function handleJsonExport() {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${range.from}-to-${range.to}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('تمّ التصدير 🤍');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-ink-soft">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="mr-3 text-sm">جاري تحضير التقرير...</span>
      </div>
    );
  }

  if (!report) {
    return <div className="text-center py-20 text-ink-soft">لا يمكن تحميل التقرير</div>;
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* ─── Period selector + Actions · لا تظهر في الطباعة ─── */}
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <div className="flex items-center gap-1 bg-white border border-cream-200 p-1" style={{ borderRadius: '2px' }}>
          <PeriodButton active={period === 'current'} onClick={() => setPeriod('current')}>
            الشهر الحالي
          </PeriodButton>
          <PeriodButton active={period === 'previous'} onClick={() => setPeriod('previous')}>
            الشهر الماضي
          </PeriodButton>
          <PeriodButton active={period === 'year'} onClick={() => setPeriod('year')}>
            السنة
          </PeriodButton>
        </div>
        <div className="flex-1" />
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 bg-ink hover:bg-gold-deep text-cream-50 px-4 py-2.5 text-xs font-bold transition-colors"
          style={{ borderRadius: '2px', letterSpacing: '0.05em' }}
        >
          <Printer className="w-3.5 h-3.5" />
          طباعة PDF
        </button>
        <button
          onClick={handleJsonExport}
          className="flex items-center gap-2 border border-cream-300 hover:bg-cream-50 text-ink-soft px-4 py-2.5 text-xs font-bold transition-colors"
          style={{ borderRadius: '2px' }}
        >
          <Download className="w-3.5 h-3.5" />
          JSON
        </button>
      </div>

      {/* ─── Header للطباعة فقط ─── */}
      <div className="hidden print:block border-b-2 border-gold-deep pb-4 mb-6">
        <div className="text-center">
          <div className="font-en-display italic text-3xl text-gold-deep">The First Lady</div>
          <div className="w-16 h-[1px] bg-gold-deep mx-auto my-2" />
          <h2 className="font-ar-display text-xl font-bold text-ink">تقرير الامتثال القانوني</h2>
          <p className="text-sm text-ink-soft mt-1">
            {report.period.from} إلى {report.period.to}
          </p>
          <p className="text-[10px] text-ink-soft mt-0.5">
            صُدر في {new Date(report.generated_at).toLocaleString('ar-SA')}
          </p>
        </div>
      </div>

      {/* ─── Score Card الرئيسي ─── */}
      <div
        className="bg-gradient-to-br from-ink via-gold-deep to-ink text-cream-50 p-6 md:p-8 print:bg-white print:text-ink print:border-2 print:border-gold-deep"
        style={{ borderRadius: '2px' }}
      >
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mb-1 print:text-gold-deep">
              COMPLIANCE SCORE
            </div>
            <div className="font-ar-display text-lg">درجة الامتثال الإجماليّة</div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="font-en-display text-6xl font-bold">{report.checklist.score}</span>
              <span className="text-2xl opacity-80">%</span>
            </div>
            <div className="text-sm opacity-90 mt-1">
              {report.checklist.passed} من {report.checklist.total} اشتراطاً مستوفى
            </div>
          </div>
          <div className="text-left space-y-1">
            <div className="text-xs opacity-80">{report.settings.salon_name}</div>
            <div className="text-xs opacity-70">
              السجل التجاري: {report.settings.cr_number || <span className="text-rose-200 print:text-rose-600">غير مُسجّل</span>}
            </div>
            {report.settings.tax_number && (
              <div className="text-xs opacity-70">الرقم الضريبي: {report.settings.tax_number}</div>
            )}
            {report.settings.maroof_id && (
              <div className="text-xs opacity-70">معروف: {report.settings.maroof_id}</div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Checklist ─── */}
      <SectionCard
        icon={<Gavel className="w-5 h-5 text-gold-deep" />}
        title="قائمة التحقّق من الاشتراطات"
        subtitle={`${report.checklist.passed} ✓ · ${report.checklist.total - report.checklist.passed} ✗`}
      >
        <div className="space-y-1">
          {report.checklist.items.map((item) => (
            <div
              key={item.key}
              className="flex items-start gap-3 px-3 py-2.5 hover:bg-cream-50 transition-colors border-b border-cream-100 last:border-b-0"
            >
              <div className="shrink-0 mt-0.5">
                {item.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-danger" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ink">{item.label}</div>
                <div className="text-[10px] text-ink-soft mt-0.5 font-en-label tracking-wider">
                  {item.law}
                </div>
              </div>
              <div className="text-[10px] font-bold uppercase shrink-0">
                {item.passed ? (
                  <span className="text-success">مطبّق</span>
                ) : (
                  <span className="text-danger">غير مطبّق</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* ─── 4 بطاقات إحصائيّة ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          icon={<AlertTriangle className="w-4 h-4" />}
          title="الشكاوى"
          law="نظام التجارة · م.20"
          stats={[
            { label: 'المجموع', value: report.complaints.total },
            { label: 'محلولة', value: report.complaints.resolved },
            { label: 'معلّقة', value: report.complaints.pending, highlight: report.complaints.pending > 0 },
            { label: 'نسبة الحلّ', value: `${report.complaints.resolution_rate}%` },
            { label: 'متوسّط الردّ', value: `${report.complaints.avg_response_hours} س` },
          ]}
        />
        <StatCard
          icon={<Shield className="w-4 h-4" />}
          title="طلبات وصول البيانات"
          law="PDPL · م.4"
          stats={[
            { label: 'المجموع', value: report.data_access.total },
            { label: 'منفّذة', value: report.data_access.fulfilled },
            { label: 'معلّقة', value: report.data_access.pending, highlight: report.data_access.pending > 0 },
            { label: 'متوسّط التنفيذ', value: `${report.data_access.avg_fulfillment_days} يوم` },
          ]}
        />
        <StatCard
          icon={<Bell className="w-4 h-4" />}
          title="سجلّ الاختراقات"
          law="PDPL · م.24 · 72 ساعة"
          stats={[
            { label: 'المجموع', value: report.breach_log.total },
            { label: 'بلّغت خلال 72س', value: report.breach_log.within_72h },
            { label: 'معلّقة', value: report.breach_log.pending, highlight: report.breach_log.pending > 0 },
            { label: 'الامتثال', value: `${report.breach_log.compliance_rate}%` },
          ]}
        />
        <StatCard
          icon={<FileText className="w-4 h-4" />}
          title="ZATCA · الفواتير"
          law={`${report.zatca.phase}`}
          stats={[
            { label: 'الفواتير', value: report.zatca.invoices_issued },
            { label: 'مجموع VAT', value: `${report.zatca.total_vat} ر.س` },
          ]}
        />
      </div>

      {/* ─── الحسابات والخصوصيّة ─── */}
      <SectionCard
        icon={<Users className="w-5 h-5 text-gold-deep" />}
        title="الحسابات وخصوصيّة البيانات"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MiniStat label="إجمالي العميلات" value={report.accounts.total_customers} />
          <MiniStat
            label="وافقن على التسويق"
            value={`${report.accounts.marketing_consent_count} (${report.accounts.marketing_consent_rate}%)`}
          />
          <MiniStat label="حُذفت في الفترة" value={report.accounts.deleted_in_period} />
          <MiniStat label="النوع" value="PDPL ✓" good />
        </div>
      </SectionCard>

      {/* ─── السياسات القانونيّة ─── */}
      <SectionCard
        icon={<FileText className="w-5 h-5 text-gold-deep" />}
        title="السياسات القانونيّة المنشورة"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {Object.entries(report.policies).map(([key, href]) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-2 px-3 py-2 border border-cream-200 hover:border-gold-deep hover:bg-cream-50 transition-colors text-sm print:border-cream-300"
              style={{ borderRadius: '2px' }}
            >
              <span className="font-semibold text-ink capitalize">{policyLabel(key)}</span>
              <span className="text-xs text-success">✓ منشورة</span>
            </a>
          ))}
        </div>
      </SectionCard>

      {/* ─── DPO Contact ─── */}
      <SectionCard
        icon={<Lock className="w-5 h-5 text-gold-deep" />}
        title="مسؤول حماية البيانات (DPO)"
        subtitle="PDPL · المادة 32"
      >
        {report.settings.dpo_name && report.settings.dpo_email ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-ink-soft" />
              <span className="font-bold">{report.settings.dpo_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-ink-soft" />
              <a
                href={`mailto:${report.settings.dpo_email}`}
                className="text-gold-deep hover:underline"
                dir="ltr"
              >
                {report.settings.dpo_email}
              </a>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm" style={{ borderRadius: '2px' }}>
            ⚠️ لم تُعيَّن بيانات DPO · ادخلي <a href="/admin/settings" className="underline font-bold">إعدادات المنشأة</a> لتعبئتها
          </div>
        )}
      </SectionCard>

      {/* ─── Footer للطباعة ─── */}
      <div className="hidden print:block mt-8 pt-4 border-t border-cream-300 text-center text-[10px] text-ink-soft">
        <p>هذا التقرير صُدر إلكترونيّاً من نظام The First Lady · {new Date().toLocaleDateString('ar-SA')}</p>
        <p className="mt-1">نظام إدارة الصالون من Shaheen Design</p>
      </div>
    </div>
  );
}

// ──────────── مكوّنات مساعدة ────────────

function PeriodButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs font-bold transition-colors ${
        active ? 'bg-ink text-cream-50' : 'text-ink-soft hover:text-ink hover:bg-cream-50'
      }`}
      style={{ borderRadius: '2px' }}
    >
      {children}
    </button>
  );
}

function SectionCard({
  icon, title, subtitle, children,
}: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-cream-200 p-5 print:border-cream-300" style={{ borderRadius: '2px' }}>
      <div className="flex items-center gap-2.5 mb-4">
        {icon}
        <div>
          <h2 className="font-ar-display text-lg font-bold text-ink">{title}</h2>
          {subtitle && <p className="text-[11px] text-ink-soft mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function StatCard({ icon, title, law, stats }: {
  icon: React.ReactNode; title: string; law: string;
  stats: Array<{ label: string; value: string | number; highlight?: boolean }>;
}) {
  return (
    <div className="bg-white border border-cream-200 p-4 print:border-cream-300" style={{ borderRadius: '2px' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-gold-deep">{icon}</div>
        <div>
          <h3 className="font-bold text-sm text-ink">{title}</h3>
          <p className="text-[10px] text-ink-soft font-en-label tracking-wider">{law}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label} className={`p-2 border border-cream-100 ${s.highlight ? 'bg-rose-50 border-rose-200' : ''}`} style={{ borderRadius: '2px' }}>
            <div className="text-[10px] text-ink-soft">{s.label}</div>
            <div className={`font-bold text-sm mt-0.5 ${s.highlight ? 'text-rose-700' : 'text-ink'}`}>{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value, good }: { label: string; value: string | number; good?: boolean }) {
  return (
    <div className={`p-3 border ${good ? 'border-success/30 bg-success/5' : 'border-cream-200'}`} style={{ borderRadius: '2px' }}>
      <div className="text-[10px] text-ink-soft">{label}</div>
      <div className={`font-bold text-sm mt-1 ${good ? 'text-success' : 'text-ink'}`}>{value}</div>
    </div>
  );
}

function policyLabel(key: string): string {
  const map: Record<string, string> = {
    privacy: 'سياسة الخصوصيّة',
    refund: 'سياسة الاسترداد',
    terms: 'شروط الاستخدام',
    shipping: 'التوصيل/الحجز',
    complaints: 'الشكاوى',
  };
  return map[key] || key;
}
