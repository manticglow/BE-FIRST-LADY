/**
 * PayrollManager — إدارة الرواتب (حساب تلقائي من الحضور)
 */
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { DollarSign, Loader2, Check, Calculator, Edit2, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Record {
  id: string;
  period_month: number;
  period_year: number;
  total_hours: number;
  hourly_rate: number | null;
  base_amount: number;
  bonuses: number;
  deductions: number;
  net_amount: number;
  paid_at: string | null;
  notes: string | null;
  user: { id: string; full_name: string; role: string };
}

const MONTHS = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function PayrollManager() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record | null>(null);
  const [bonuses, setBonuses] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [notes, setNotes] = useState('');

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/payroll?month=${month}&year=${year}`);
    const data = await res.json();
    setRecords(data.records || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [month, year]);

  async function generate() {
    setBusy('generate');
    const res = await fetch('/api/payroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year }),
    });
    const data = await res.json();
    setBusy(null);
    if (res.ok) {
      toast.success(`تم توليد ${data.created} راتب جديد ✨`);
      load();
    } else {
      toast.error('فشل');
    }
  }

  async function markPaid(id: string, paid: boolean) {
    setBusy(id);
    await fetch('/api/payroll', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, paid }),
    });
    setBusy(null);
    toast.success(paid ? 'تم تسجيل الدفع ✓' : 'تم الإلغاء');
    load();
  }

  function openEdit(r: Record) {
    setEditing(r);
    setBonuses(Number(r.bonuses || 0));
    setDeductions(Number(r.deductions || 0));
    setNotes(r.notes || '');
  }

  async function saveEdit() {
    if (!editing) return;
    setBusy('edit');
    await fetch('/api/payroll', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editing.id, bonuses, deductions, notes }),
    });
    setBusy(null);
    toast.success('تم التحديث');
    setEditing(null);
    load();
  }

  const totalNet = records.reduce((s, r) => s + Number(r.net_amount), 0);
  const paidCount = records.filter((r) => r.paid_at).length;

  return (
    <>
      {/* فلتر */}
      <div className="bg-white rounded-2xl p-4 border border-cream-200 mb-5 flex items-center gap-3 flex-wrap">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="px-3 py-2 rounded-xl border border-cream-200 bg-cream-50 text-sm font-bold"
        >
          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-2 rounded-xl border border-cream-200 bg-cream-50 text-sm font-bold font-en-display"
        >
          {[year - 1, year, year + 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        <div className="flex-1"></div>

        {records.length === 0 && (
          <button
            onClick={generate}
            disabled={busy === 'generate'}
            className="btn-primary flex items-center gap-2 !py-2 text-sm disabled:opacity-50"
          >
            {busy === 'generate' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
            احسبي رواتب الشهر تلقائياً
          </button>
        )}
      </div>

      {/* ملخّص */}
      {records.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="bg-white rounded-2xl p-4 border border-cream-200">
            <div className="text-xs text-ink-soft">عدد الموظفات</div>
            <div className="font-en-display text-2xl font-bold text-ink mt-1">{records.length}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-cream-200">
            <div className="text-xs text-ink-soft">إجمالي الصافي</div>
            <div className="font-en-display text-2xl font-bold text-gold-deep mt-1">{formatPrice(totalNet)}</div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-cream-200">
            <div className="text-xs text-ink-soft">تم الدفع</div>
            <div className="font-en-display text-2xl font-bold text-success mt-1">{paidCount}/{records.length}</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" /></div>
      ) : records.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-cream-200">
          <DollarSign className="w-12 h-12 text-ink-soft/50 mx-auto mb-3" />
          <div className="text-ink-soft text-sm mb-2">ما تم توليد رواتب {MONTHS[month - 1]} {year} بعد</div>
          <div className="text-[11px] text-ink-soft mb-4">
            اضغطي الزر أعلاه ليحسب النظام الساعات من الحضور تلقائياً
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 border-b border-cream-200">
              <tr className="text-right text-xs text-ink-soft font-bold">
                <th className="p-3">الموظفة</th>
                <th className="p-3">الساعات</th>
                <th className="p-3">الأساسي</th>
                <th className="p-3">مكافآت</th>
                <th className="p-3">خصومات</th>
                <th className="p-3">الصافي</th>
                <th className="p-3">الحالة</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id} className="border-b border-cream-100 hover:bg-cream-50/50">
                  <td className="p-3">
                    <div className="font-bold text-ink">{r.user.full_name}</div>
                    <div className="text-[10px] text-ink-soft">
                      {r.user.role === 'owner' ? 'المالكة' : r.user.role === 'manager' ? 'مديرة' : 'موظفة'}
                    </div>
                  </td>
                  <td className="p-3 font-en-display">{r.total_hours}س</td>
                  <td className="p-3 font-en-display font-bold">{formatPrice(r.base_amount)}</td>
                  <td className="p-3 font-en-display text-success">+{formatPrice(r.bonuses)}</td>
                  <td className="p-3 font-en-display text-danger">-{formatPrice(r.deductions)}</td>
                  <td className="p-3 font-en-display font-bold text-gold-deep text-base">{formatPrice(r.net_amount)}</td>
                  <td className="p-3">
                    {r.paid_at ? (
                      <span className="text-[10px] bg-success/15 text-success px-2 py-0.5 rounded-full font-bold">
                        ✓ مدفوع
                      </span>
                    ) : (
                      <span className="text-[10px] bg-warning/15 text-warning px-2 py-0.5 rounded-full font-bold">
                        معلّق
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(r)} className="p-1.5 hover:bg-cream-100 rounded text-gold-deep">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => markPaid(r.id, !r.paid_at)}
                        disabled={busy === r.id}
                        className={`p-1.5 rounded ${
                          r.paid_at ? 'hover:bg-cream-100 text-ink-soft' : 'hover:bg-success/10 text-success'
                        }`}
                        title={r.paid_at ? 'إلغاء الدفع' : 'تسجيل الدفع'}
                      >
                        {busy === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal تعديل */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-5 border-b border-cream-200">
              <h3 className="font-ar-display text-lg font-bold text-gold-deep">تعديل راتب {editing.user.full_name}</h3>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-cream-100 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-cream-50 rounded-xl p-3 text-sm">
                الأساسي: <strong className="font-en-display">{formatPrice(editing.base_amount)}</strong>
                <div className="text-xs text-ink-soft mt-1">محسوب من {editing.total_hours} ساعة</div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">المكافآت (ر.س)</label>
                <input type="number" value={bonuses || ''} onChange={(e) => setBonuses(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-cream-200 bg-cream-50 font-en-display" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">الخصومات (ر.س)</label>
                <input type="number" value={deductions || ''} onChange={(e) => setDeductions(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-cream-200 bg-cream-50 font-en-display" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">ملاحظات</label>
                <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-cream-200 bg-cream-50 text-sm resize-none" />
              </div>
              <div className="bg-gold-light/15 rounded-xl p-3 text-center">
                الصافي الجديد: <strong className="font-en-display text-gold-deep text-lg">{formatPrice(Number(editing.base_amount) + bonuses - deductions)}</strong>
              </div>
            </div>
            <div className="p-5 border-t border-cream-200 flex gap-3">
              <button onClick={() => setEditing(null)} className="btn-outline !py-2 flex-1 text-sm">إلغاء</button>
              <button onClick={saveEdit} disabled={busy === 'edit'} className="btn-primary !py-2 flex-1 text-sm disabled:opacity-50">
                {busy === 'edit' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
