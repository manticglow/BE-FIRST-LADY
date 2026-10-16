/**
 * InventoryManager — إدارة المخزون
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Package, Plus, Edit2, Trash2, X, Loader2, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Item {
  id: string;
  name_ar: string;
  name_en: string | null;
  sku: string | null;
  category: string | null;
  unit: string;
  cost_price: number;
  sell_price: number;
  stock_qty: number;
  low_stock_alert: number;
  is_active: boolean;
}

export default function InventoryManager({ items }: { items: Item[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Partial<Item> | null>(null);
  const [adjusting, setAdjusting] = useState<Item | null>(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustType, setAdjustType] = useState<'purchase' | 'adjustment'>('purchase');
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [busy, setBusy] = useState<string | null>(null);

  const lowStock = items.filter((i) => i.stock_qty <= i.low_stock_alert && i.is_active).length;
  const totalValue = items.reduce((s, i) => s + Number(i.sell_price) * i.stock_qty, 0);

  function openCreate() {
    setMode('create');
    setEditing({
      name_ar: '', unit: 'قطعة', cost_price: 0, sell_price: 0,
      stock_qty: 0, low_stock_alert: 5, is_active: true,
    });
  }

  function openEdit(i: Item) {
    setMode('edit');
    setEditing({ ...i });
  }

  async function save() {
    if (!editing?.name_ar) { toast.error('الاسم مطلوب'); return; }
    setBusy('save');
    const res = await fetch('/api/inventory', {
      method: mode === 'create' ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    setBusy(null);
    if (!res.ok) { toast.error('فشل'); return; }
    toast.success('تم الحفظ ✨');
    setEditing(null);
    router.refresh();
  }

  async function adjust() {
    if (!adjusting || adjustQty === 0) return;
    setBusy('adjust');
    const res = await fetch('/api/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: adjusting.id,
        adjustStock: { qty: adjustQty, type: adjustType, reason: adjustReason },
      }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) { toast.error(data.error); return; }
    toast.success(`الرصيد الجديد: ${data.new_qty}`);
    setAdjusting(null); setAdjustQty(0); setAdjustReason('');
    router.refresh();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`متأكدة من حذف "${name}"؟`)) return;
    setBusy(id);
    await fetch(`/api/inventory?id=${id}`, { method: 'DELETE' });
    setBusy(null);
    toast.success('تم الحذف');
    router.refresh();
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-cream-200">
          <div className="text-xs text-ink-soft">إجمالي المنتجات</div>
          <div className="font-en-display text-2xl font-bold text-ink mt-1">{items.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-cream-200">
          <div className="text-xs text-ink-soft">قيمة المخزون</div>
          <div className="font-en-display text-2xl font-bold text-gold-deep mt-1">{formatPrice(totalValue)}</div>
        </div>
        <div className={`rounded-2xl p-4 border ${lowStock > 0 ? 'bg-warning/10 border-warning/30' : 'bg-white border-cream-200'}`}>
          <div className="text-xs text-ink-soft flex items-center gap-1">
            {lowStock > 0 && <AlertTriangle className="w-3 h-3 text-warning" />}
            قارب على النفاد
          </div>
          <div className={`font-en-display text-2xl font-bold mt-1 ${lowStock > 0 ? 'text-warning' : 'text-ink'}`}>{lowStock}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-ink-soft text-sm">{items.length} منتج</p>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 !py-2 text-sm">
          <Plus className="w-4 h-4" /> منتج جديد
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-cream-200">
          <Package className="w-12 h-12 text-ink-soft/50 mx-auto mb-3" />
          <div className="text-ink-soft text-sm mb-4">ما فيه منتجات</div>
          <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> أضيفي أول منتج</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 border-b border-cream-200">
              <tr className="text-right text-xs text-ink-soft font-bold">
                <th className="p-3">المنتج</th>
                <th className="p-3">SKU</th>
                <th className="p-3">المخزون</th>
                <th className="p-3">السعر</th>
                <th className="p-3">الربح</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => {
                const low = i.stock_qty <= i.low_stock_alert;
                const profit = Number(i.sell_price) - Number(i.cost_price);
                return (
                  <tr key={i.id} className={`border-b border-cream-100 hover:bg-cream-50/50 ${!i.is_active ? 'opacity-50' : ''}`}>
                    <td className="p-3">
                      <div className="font-bold text-ink">{i.name_ar}</div>
                      {i.category && <div className="text-[10px] text-ink-soft mt-0.5">{i.category}</div>}
                    </td>
                    <td className="p-3 text-xs text-ink-soft font-en-display">{i.sku || '—'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => { setAdjusting(i); setAdjustQty(0); setAdjustReason(''); setAdjustType('purchase'); }}
                        className={`font-en-display font-bold text-sm px-3 py-1 rounded-lg ${
                          low ? 'bg-warning/15 text-warning' : 'bg-cream-100 text-ink hover:bg-cream-200'
                        }`}
                      >
                        {i.stock_qty} {i.unit}
                        {low && ' ⚠'}
                      </button>
                    </td>
                    <td className="p-3 font-en-display font-bold text-gold-deep">{formatPrice(i.sell_price)}</td>
                    <td className="p-3 font-en-display text-xs text-success">+{formatPrice(profit)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(i)} className="p-1.5 hover:bg-cream-100 rounded text-gold-deep">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => remove(i.id, i.name_ar)} disabled={busy === i.id} className="p-1.5 hover:bg-danger/10 rounded text-danger">
                          {busy === i.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal CRUD */}
      {editing && (
        <Modal onClose={() => setEditing(null)} title={mode === 'create' ? 'منتج جديد' : 'تعديل'}>
          <div className="p-5 space-y-3">
            <F label="الاسم *"><input type="text" value={editing.name_ar || ''} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} className="inp" /></F>
            <div className="grid grid-cols-2 gap-3">
              <F label="SKU"><input type="text" value={editing.sku || ''} onChange={(e) => setEditing({ ...editing, sku: e.target.value })} className="inp font-en-display" /></F>
              <F label="الفئة"><input type="text" value={editing.category || ''} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="inp" placeholder="شامبو، كريم..." /></F>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <F label="سعر التكلفة"><input type="number" step="0.01" value={editing.cost_price || ''} onChange={(e) => setEditing({ ...editing, cost_price: Number(e.target.value) })} className="inp font-en-display" /></F>
              <F label="سعر البيع"><input type="number" step="0.01" value={editing.sell_price || ''} onChange={(e) => setEditing({ ...editing, sell_price: Number(e.target.value) })} className="inp font-en-display" /></F>
            </div>
            {mode === 'create' && (
              <F label="الكمية الأولية"><input type="number" value={editing.stock_qty || ''} onChange={(e) => setEditing({ ...editing, stock_qty: Number(e.target.value) })} className="inp font-en-display" /></F>
            )}
            <div className="grid grid-cols-2 gap-3">
              <F label="الوحدة"><input type="text" value={editing.unit || ''} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} className="inp" /></F>
              <F label="تنبيه نفاد عند"><input type="number" value={editing.low_stock_alert || ''} onChange={(e) => setEditing({ ...editing, low_stock_alert: Number(e.target.value) })} className="inp font-en-display" /></F>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="w-4 h-4 accent-gold-deep" />
              المنتج مفعّل
            </label>
          </div>
          <div className="p-5 border-t border-cream-200 flex gap-3">
            <button onClick={() => setEditing(null)} className="btn-outline !py-2 flex-1 text-sm">إلغاء</button>
            <button onClick={save} disabled={busy === 'save'} className="btn-primary !py-2 flex-1 text-sm disabled:opacity-50">
              {busy === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal تعديل المخزون */}
      {adjusting && (
        <Modal onClose={() => setAdjusting(null)} title={`تعديل مخزون ${adjusting.name_ar}`}>
          <div className="p-5 space-y-4">
            <div className="bg-cream-50 rounded-xl p-3 text-sm">
              الرصيد الحالي: <strong className="font-en-display">{adjusting.stock_qty}</strong> {adjusting.unit}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAdjustType('purchase')}
                className={`py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${
                  adjustType === 'purchase' ? 'bg-success text-white' : 'bg-cream-100 text-ink'
                }`}
              >
                <TrendingUp className="w-4 h-4" /> دخول (شراء)
              </button>
              <button
                onClick={() => setAdjustType('adjustment')}
                className={`py-2 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${
                  adjustType === 'adjustment' ? 'bg-warning text-white' : 'bg-cream-100 text-ink'
                }`}
              >
                <TrendingDown className="w-4 h-4" /> تعديل
              </button>
            </div>

            <F label={adjustType === 'purchase' ? 'الكمية المضافة' : 'التغيير (+ أو -)'}>
              <input type="number" value={adjustQty || ''} onChange={(e) => setAdjustQty(Number(e.target.value))} className="inp font-en-display text-center text-xl" />
            </F>

            <F label="السبب / الملاحظة">
              <input type="text" value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} className="inp" placeholder="مثل: شراء من المورّد" />
            </F>

            <div className="bg-gold-light/15 rounded-xl p-3 text-center">
              الرصيد الجديد: <strong className="font-en-display text-gold-deep">{adjusting.stock_qty + adjustQty}</strong>
            </div>
          </div>
          <div className="p-5 border-t border-cream-200 flex gap-3">
            <button onClick={() => setAdjusting(null)} className="btn-outline !py-2 flex-1 text-sm">إلغاء</button>
            <button onClick={adjust} disabled={busy === 'adjust' || adjustQty === 0} className="btn-primary !py-2 flex-1 text-sm disabled:opacity-50">
              {busy === 'adjust' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-cream-200">
          <h3 className="font-ar-display text-lg font-bold text-gold-deep">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-cream-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-soft mb-1.5">{label}</label>
      {children}
    </div>
  );
}

if (typeof document !== 'undefined' && !document.getElementById('inv-css')) {
  const el = document.createElement('style');
  el.id = 'inv-css';
  el.textContent = `.inp{width:100%;padding:.625rem .75rem;border-radius:.75rem;border:1px solid #ece1cc;background:#fbf7ef;outline:none;font-size:.875rem}.inp:focus{background:#fff;border-color:#c9a96e}`;
  document.head.appendChild(el);
}
