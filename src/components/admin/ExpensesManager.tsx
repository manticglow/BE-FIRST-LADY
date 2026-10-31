/**
 * ExpensesManager — إدارة المصروفات
 * ═══════════════════════════════════════════════════════════
 * - إضافة مصروف جديد (modal)
 * - جدول بكل المصروفات
 * - فلترة بالشهر والفئة
 * - ملخّص إجمالي
 */
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Plus, Trash2, Loader2, X, Receipt, Calendar,
  Home, Users, Package, Zap, Megaphone, Wrench,
  Monitor, MoreHorizontal, Filter, TrendingDown,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

const CATEGORIES = [
  { value: 'rent',        label: 'إيجار',           icon: Home,       color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'salaries',    label: 'رواتب',           icon: Users,      color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'supplies',    label: 'مستلزمات/منتجات', icon: Package,    color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'utilities',   label: 'كهرباء/ماء/نت',   icon: Zap,        color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'marketing',   label: 'تسويق',           icon: Megaphone,  color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'maintenance', label: 'صيانة',           icon: Wrench,     color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'equipment',   label: 'معدّات/أجهزة',    icon: Monitor,    color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'other',       label: 'أخرى',            icon: MoreHorizontal, color: 'bg-slate-50 text-slate-700 border-slate-200' },
];

interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
}

export default function ExpensesManager() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  // Filters
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (month) params.set('month', month);
      if (categoryFilter) params.set('category', categoryFilter);
      const res = await fetch(`/api/admin/expenses?${params}`);
      const data = await res.json();
      setExpenses(data.expenses || []);
      setSummary(data.summary || {});
      setTotal(data.total || 0);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [month, categoryFilter]);

  async function deleteExpense(id: string) {
    if (!confirm('متأكّدة من حذف هذا المصروف؟')) return;
    await fetch(`/api/admin/expenses?id=${id}`, { method: 'DELETE' });
    toast.success('تم الحذف');
    load();
  }

  return (
    <div className="space-y-5">

      {/* ═══ Hero · إجمالي المصروفات ═══ */}
      <div className="relative bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900 text-white rounded-3xl p-6 shadow-xl overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="editorial-eyebrow text-white/70 mb-1">TOTAL EXPENSES</div>
            <div className="text-xs opacity-80 mb-2">
              {month === new Date().toISOString().slice(0, 7) ? 'هذا الشهر' : month}
            </div>
            <div className="font-en-display font-bold text-5xl md:text-6xl leading-none">
              {formatPrice(total, { showFrom: false })}
            </div>
            <div className="text-sm opacity-80 mt-2">
              {expenses.length} معاملة
            </div>
          </div>

          <button
            onClick={() => setAddOpen(true)}
            className="bg-white text-rose-900 font-ar-display font-bold px-5 py-3 rounded-xl shadow-lg hover:scale-[1.03] transition-transform flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            سجّلي مصروف
          </button>
        </div>
      </div>

      {/* ═══ Filters ═══ */}
      <div className="bg-white rounded-2xl border border-cream-200 p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-ink-soft shrink-0">
          <Filter className="w-4 h-4" />
          فلترة:
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 rounded-xl border border-cream-200 focus:border-gold-deep outline-none text-sm bg-white"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-cream-200 focus:border-gold-deep outline-none text-sm bg-white"
        >
          <option value="">كل الفئات</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* ═══ ملخّص حسب الفئة ═══ */}
      {Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CATEGORIES.map((cat) => {
            const value = summary[cat.value] || 0;
            if (value === 0) return null;
            const Icon = cat.icon;
            return (
              <div key={cat.value} className={`${cat.color} rounded-2xl p-3 border`}>
                <Icon className="w-4 h-4 mb-1.5 opacity-80" />
                <div className="text-[10px] font-semibold opacity-80">{cat.label}</div>
                <div className="font-en-display font-bold text-lg mt-0.5">
                  {formatPrice(value, { showFrom: false })}
                </div>
                <div className="text-[9px] opacity-70 mt-0.5">
                  {Math.round((value / total) * 100)}% من الإجمالي
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ قائمة المصروفات ═══ */}
      <div className="bg-white rounded-3xl border border-cream-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-cream-200 bg-gradient-to-l from-rose-50/50 to-transparent flex items-center justify-between">
          <h3 className="font-ar-display text-lg font-bold text-gold-deep flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            المصروفات
          </h3>
          <span className="text-xs text-ink-soft">
            {expenses.length} معاملة
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <Loader2 className="w-6 h-6 text-gold-deep animate-spin mx-auto" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-10 text-center">
            <Receipt className="w-10 h-10 text-ink-soft/40 mx-auto mb-3" />
            <div className="font-ar-display font-bold text-ink mb-1">ما فيه مصروفات</div>
            <div className="text-sm text-ink-soft">سجّلي أول مصروف بالزر فوق</div>
          </div>
        ) : (
          <ul className="divide-y divide-cream-100 max-h-[600px] overflow-y-auto">
            {expenses.map((e) => <ExpenseRow key={e.id} expense={e} onDelete={() => deleteExpense(e.id)} />)}
          </ul>
        )}
      </div>

      {/* ═══ Modal إضافة ═══ */}
      {addOpen && (
        <AddExpenseModal
          onClose={() => setAddOpen(false)}
          onAdded={() => { setAddOpen(false); load(); }}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

function ExpenseRow({ expense, onDelete }: { expense: Expense; onDelete: () => void }) {
  const cat = CATEGORIES.find((c) => c.value === expense.category) || CATEGORIES[CATEGORIES.length - 1];
  const Icon = cat.icon;

  return (
    <li className="px-4 py-3 flex items-center gap-3 hover:bg-cream-50/50 transition-colors group">
      <div className={`w-11 h-11 rounded-xl ${cat.color.replace(/border-\S+/, '')} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-ink truncate">{expense.description}</div>
        <div className="text-[11px] text-ink-soft flex items-center gap-2 mt-0.5">
          <span>{cat.label}</span>
          <span>·</span>
          <span className="font-en-display">
            {new Date(expense.date).toLocaleDateString('en-GB')}
          </span>
          {expense.payment_method && (
            <>
              <span>·</span>
              <span>{paymentMethodLabel(expense.payment_method)}</span>
            </>
          )}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="font-en-display font-bold text-lg text-rose-600">
          -{formatPrice(expense.amount, { showFrom: false })}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-all"
        aria-label="حذف"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </li>
  );
}

function AddExpenseModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'supplies' as string,
    amount: 0,
    description: '',
    payment_method: 'cash' as string,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.description.trim() || form.amount <= 0) {
      toast.error('البيانات ناقصة');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'فشل الحفظ');
        return;
      }
      toast.success('✅ تم تسجيل المصروف');
      onAdded();
    } finally { setSaving(false); }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[95vh] flex flex-col animate-in">

        <div className="relative bg-gradient-to-br from-rose-600 to-rose-900 text-white p-5 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="editorial-eyebrow text-white/80 mb-1">NEW EXPENSE</div>
          <h2 className="font-ar-display text-xl font-bold flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            تسجيل مصروف جديد
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          <div>
            <label className="block text-xs font-bold text-ink-soft mb-2">الفئة</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.value}
                    onClick={() => setForm({ ...form, category: c.value })}
                    className={`p-2.5 rounded-xl border-2 transition-all text-center ${
                      form.category === c.value
                        ? `${c.color} border-current`
                        : 'bg-cream-50 border-cream-200 text-ink-soft'
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1" />
                    <div className="text-[9px] font-bold leading-tight">{c.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-soft mb-1.5">المبلغ *</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={form.amount || ''}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-cream-200 focus:border-rose-500 outline-none font-en-display font-bold text-xl text-center"
                placeholder="0"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink-soft font-bold">ر.س</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-soft mb-1.5">الوصف *</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="مثلاً: شراء منتجات صبغ من محل..."
              className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:border-rose-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ink-soft mb-1.5">التاريخ</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-cream-200 focus:border-rose-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-soft mb-1.5">طريقة الدفع</label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-cream-200 focus:border-rose-500 outline-none"
              >
                <option value="cash">نقدي</option>
                <option value="mada">مدى</option>
                <option value="card">بطاقة</option>
                <option value="transfer">تحويل</option>
                <option value="other">أخرى</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-soft mb-1.5">ملاحظات (اختياري)</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-cream-200 focus:border-rose-500 outline-none text-sm resize-none"
            />
          </div>
        </div>

        <div className="p-4 border-t border-cream-200 bg-cream-50/50 shrink-0">
          <button
            onClick={save}
            disabled={saving}
            className="w-full py-3 rounded-xl bg-gradient-to-br from-rose-600 to-rose-900 text-white font-ar-display font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Receipt className="w-5 h-5" />}
            حفظ المصروف
          </button>
        </div>
      </div>
    </div>
  );
}

function paymentMethodLabel(m: string): string {
  return {
    cash: 'نقدي',
    mada: 'مدى',
    card: 'بطاقة',
    transfer: 'تحويل',
    other: 'أخرى',
  }[m] || m;
}
