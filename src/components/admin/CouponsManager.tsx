/**
 * CouponsManager — إدارة الكوبونات
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Tag, Plus, Edit2, Trash2, X, Loader2, Copy, Check } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_total: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
}

export default function CouponsManager({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Partial<Coupon> | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [busy, setBusy] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function openCreate() {
    setMode('create');
    setEditing({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_total: 0,
      is_active: true,
    });
  }

  function openEdit(c: Coupon) {
    setMode('edit');
    setEditing({ ...c, expires_at: c.expires_at ? c.expires_at.split('T')[0] : null });
  }

  async function save() {
    if (!editing?.code || !editing?.discount_value) {
      toast.error('الكود وقيمة الخصم مطلوبان');
      return;
    }
    setBusy('save');
    const res = await fetch('/api/admin/coupons', {
      method: mode === 'create' ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    setBusy(null);
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || 'فشل');
      return;
    }
    toast.success('تم الحفظ');
    setEditing(null);
    router.refresh();
  }

  async function remove(id: string, code: string) {
    if (!confirm(`متأكدة من حذف "${code}"؟`)) return;
    setBusy(id);
    await fetch(`/api/admin/coupons?id=${id}`, { method: 'DELETE' });
    setBusy(null);
    toast.success('تم الحذف');
    router.refresh();
  }

  async function copyCode(code: string, id: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {}
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-ink-soft text-sm">
            {coupons.length} كوبون · استُخدم {coupons.reduce((s, c) => s + c.used_count, 0)} مرة
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 !py-2 text-sm">
          <Plus className="w-4 h-4" />
          كوبون جديد
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-cream-200">
          <Tag className="w-12 h-12 text-ink-soft/50 mx-auto mb-3" />
          <div className="text-ink-soft text-sm mb-4">ما فيه كوبونات بعد</div>
          <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" />كوبون جديد</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => {
            const expired = c.expires_at && new Date(c.expires_at) < new Date();
            const exhausted = c.max_uses && c.used_count >= c.max_uses;
            const inactive = !c.is_active || expired || exhausted;
            return (
              <div key={c.id} className={`bg-white rounded-2xl border-2 border-dashed p-5 relative ${
                inactive ? 'border-cream-200 opacity-60' : 'border-gold-light'
              }`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="font-en-display text-xl font-bold text-gold-deep tracking-wider">
                    {c.code}
                  </div>
                  <button onClick={() => copyCode(c.code, c.id)} className="p-1 hover:bg-cream-100 rounded">
                    {copiedId === c.id ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-ink-soft" />}
                  </button>
                </div>

                <div className="font-en-display text-3xl font-bold text-ink">
                  {c.discount_type === 'percentage' ? `${c.discount_value}%` : `${c.discount_value} ر.س`}
                </div>

                {c.description && (
                  <p className="text-xs text-ink-soft mt-2">{c.description}</p>
                )}

                <div className="mt-3 pt-3 border-t border-cream-200 space-y-1 text-xs text-ink-soft">
                  {c.min_total > 0 && (
                    <div>الحد الأدنى: <span className="font-en-display font-bold">{c.min_total} ر.س</span></div>
                  )}
                  <div>الاستخدام: <span className="font-en-display font-bold">
                    {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}
                  </span></div>
                  {c.expires_at && (
                    <div className={expired ? 'text-danger' : ''}>
                      ينتهي: <span className="font-en-display">{c.expires_at.split('T')[0]}</span>
                    </div>
                  )}
                  {expired && <div className="text-danger font-bold">⚠ منتهي</div>}
                  {exhausted && <div className="text-danger font-bold">⚠ استُنفد</div>}
                  {!c.is_active && <div className="text-danger font-bold">⚠ معطّل</div>}
                </div>

                <div className="flex items-center justify-end gap-1 mt-3">
                  <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-cream-100 rounded text-gold-deep">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(c.id, c.code)} disabled={busy === c.id} className="p-1.5 hover:bg-danger/10 rounded text-danger">
                    {busy === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-cream-200">
              <h3 className="font-ar-display text-lg font-bold text-gold-deep">
                {mode === 'create' ? 'كوبون جديد' : 'تعديل'}
              </h3>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-cream-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">الكود *</label>
                <input
                  type="text"
                  value={editing.code || ''}
                  onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
                  placeholder="SUMMER20"
                  className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm font-en-display uppercase font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">الوصف</label>
                <input
                  type="text"
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="عرض الصيف — خصم 20%"
                  className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5">نوع الخصم</label>
                  <select
                    value={editing.discount_type || 'percentage'}
                    onChange={(e) => setEditing({ ...editing, discount_type: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm"
                  >
                    <option value="percentage">نسبة %</option>
                    <option value="fixed">مبلغ ثابت</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5">القيمة *</label>
                  <input
                    type="number"
                    step="1"
                    value={editing.discount_value || ''}
                    onChange={(e) => setEditing({ ...editing, discount_value: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm font-en-display"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5">الحد الأدنى (ر.س)</label>
                  <input
                    type="number"
                    value={editing.min_total || 0}
                    onChange={(e) => setEditing({ ...editing, min_total: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm font-en-display"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink-soft mb-1.5">عدد مرات الاستخدام</label>
                  <input
                    type="number"
                    value={editing.max_uses || ''}
                    onChange={(e) => setEditing({ ...editing, max_uses: e.target.value ? Number(e.target.value) : null })}
                    placeholder="بلا حد"
                    className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm font-en-display"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">تاريخ الانتهاء (اختياري)</label>
                <input
                  type="date"
                  value={editing.expires_at || ''}
                  onChange={(e) => setEditing({ ...editing, expires_at: e.target.value || null })}
                  className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm font-en-display"
                />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.is_active ?? true}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  className="w-4 h-4 accent-gold-deep"
                />
                الكوبون مفعّل
              </label>
            </div>
            <div className="p-5 border-t border-cream-200 flex gap-3">
              <button onClick={() => setEditing(null)} className="btn-outline !py-2 flex-1 text-sm">إلغاء</button>
              <button onClick={save} disabled={busy === 'save'} className="btn-primary !py-2 flex-1 text-sm disabled:opacity-50">
                {busy === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
