/**
 * LeavesManager — طلبات إجازات الموظفة
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, X, Loader2, Calendar, Check, XCircle, Clock } from 'lucide-react';

interface Leave {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  review_note: string | null;
  created_at: string;
}

const TYPE_LABEL: Record<string, { label: string; color: string }> = {
  annual:    { label: 'سنوية',    color: 'bg-success/15 text-success' },
  sick:      { label: 'مرضية',    color: 'bg-blue-100 text-blue-700' },
  emergency: { label: 'طارئة',    color: 'bg-warning/15 text-warning' },
  unpaid:    { label: 'بدون راتب', color: 'bg-cream-200 text-ink' },
  other:     { label: 'أخرى',     color: 'bg-cream-100 text-ink-soft' },
};

const STATUS_INFO: Record<string, { label: string; color: string; icon: any }> = {
  pending:   { label: 'بانتظار الموافقة', color: 'bg-warning/15 text-warning', icon: Clock },
  approved:  { label: 'مُوافق عليها',    color: 'bg-success/15 text-success', icon: Check },
  rejected:  { label: 'مرفوضة',          color: 'bg-danger/15 text-danger',   icon: XCircle },
  cancelled: { label: 'ملغاة',            color: 'bg-cream-200 text-ink-soft', icon: X },
};

export default function LeavesManager() {
  const router = useRouter();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [form, setForm] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
  });

  async function load() {
    const res = await fetch('/api/leaves');
    const data = await res.json();
    setLeaves(data.leaves || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function submit() {
    if (!form.start_date || !form.end_date) {
      toast.error('حدّدي التاريخ');
      return;
    }
    setBusy('submit');
    const res = await fetch('/api/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setBusy(null);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'فشل');
      return;
    }
    toast.success('تم تقديم الطلب — بانتظار الموافقة 🌸');
    setShowForm(false);
    setForm({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
    load();
  }

  async function cancel(id: string) {
    if (!confirm('متأكدة من إلغاء الطلب؟')) return;
    setBusy(id);
    await fetch(`/api/leaves?id=${id}`, { method: 'DELETE' });
    setBusy(null);
    toast.success('تم الإلغاء');
    load();
  }

  if (loading) {
    return <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" /></div>;
  }

  return (
    <div className="space-y-5">
      <button
        onClick={() => setShowForm(!showForm)}
        className="btn-primary w-full flex items-center justify-center gap-2 !py-3"
      >
        {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        {showForm ? 'إلغاء' : 'طلب إجازة جديد'}
      </button>

      {/* نموذج الطلب */}
      {showForm && (
        <div className="bg-white rounded-2xl p-5 border-2 border-gold-light shadow-md space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-2">نوع الإجازة</label>
            <div className="grid grid-cols-5 gap-1.5">
              {Object.entries(TYPE_LABEL).map(([k, v]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setForm({ ...form, leave_type: k })}
                  className={`py-2 rounded-lg text-xs font-bold transition-colors ${
                    form.leave_type === k ? v.color + ' ring-2 ring-gold-deep' : 'bg-cream-50 text-ink-soft hover:bg-cream-100'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">من</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-cream-50 text-sm font-en-display"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1">إلى</label>
              <input
                type="date"
                min={form.start_date || new Date().toISOString().split('T')[0]}
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-cream-50 text-sm font-en-display"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1">السبب (اختياري)</label>
            <textarea
              rows={2}
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              maxLength={500}
              className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-cream-50 text-sm resize-none"
            />
          </div>

          <button
            onClick={submit}
            disabled={busy === 'submit'}
            className="btn-primary w-full !py-2.5 disabled:opacity-50"
          >
            {busy === 'submit' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تقديم الطلب'}
          </button>
        </div>
      )}

      {/* القائمة */}
      {leaves.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-cream-200 text-sm text-ink-soft">
          ما قدّمتِ طلبات إجازة بعد
        </div>
      ) : (
        <ul className="space-y-3">
          {leaves.map((l) => {
            const typeInfo = TYPE_LABEL[l.leave_type] || TYPE_LABEL.other;
            const statusInfo = STATUS_INFO[l.status];
            const Icon = statusInfo.icon;
            const days = Math.round((new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / 86400000) + 1;
            return (
              <li key={l.id} className="bg-white rounded-2xl p-4 border border-cream-200">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${statusInfo.color}`}>
                      <Icon className="w-3 h-3" />
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="text-xs text-ink-soft">
                    <span className="font-en-display font-bold">{days}</span> يوم
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-ink">
                  <Calendar className="w-3.5 h-3.5 text-gold-deep" />
                  <span className="font-en-display">{l.start_date}</span>
                  <span>←</span>
                  <span className="font-en-display">{l.end_date}</span>
                </div>

                {l.reason && (
                  <div className="text-xs text-ink-soft mt-2 pt-2 border-t border-cream-100">
                    {l.reason}
                  </div>
                )}

                {l.review_note && (
                  <div className="bg-cream-50 rounded-lg p-2 mt-2 text-xs">
                    <strong className="text-gold-deep">ملاحظة المالكة:</strong> {l.review_note}
                  </div>
                )}

                {l.status === 'pending' && (
                  <button
                    onClick={() => cancel(l.id)}
                    disabled={busy === l.id}
                    className="mt-3 text-xs text-danger hover:underline flex items-center gap-1"
                  >
                    {busy === l.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                    إلغاء الطلب
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
