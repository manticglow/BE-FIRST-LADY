/**
 * PackagesManager — إدارة البكجات الكاملة (CRUD + ربط خدمات)
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Package as PackageIcon, Plus, Edit2, Trash2, X, Loader2,
  Scissors, Clock, Check, Eye, EyeOff,
} from 'lucide-react';
import { formatPrice, formatDuration } from '@/lib/utils';
import type { Category, Service, Package } from '@/types/database';

type Mode = 'edit' | 'services';

export default function PackagesManager({
  packages, categories, services,
}: {
  packages: Package[];
  categories: Category[];
  services: Service[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Partial<Package> | null>(null);
  const [mode, setMode] = useState<Mode>('edit');
  const [action, setAction] = useState<'create' | 'edit'>('create');
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!editing?.id || mode !== 'services') return;
    fetch(`/api/admin/packages/${editing.id}/services`)
      .then((r) => r.json())
      .then((d) => setSelectedServices(new Set(d.service_ids || [])));
  }, [editing?.id, mode]);

  function openCreate() {
    setAction('create');
    setMode('edit');
    setEditing({
      name_ar: '', name_en: '', description_ar: '',
      price: 299, original_price: null, is_active: true,
    });
  }

  function openEdit(p: Package) {
    setAction('edit');
    setMode('edit');
    setEditing({
      ...p,
      valid_from: p.valid_from?.split('T')[0] || null,
      valid_until: p.valid_until?.split('T')[0] || null,
    });
  }

  function openServices(p: Package) {
    setMode('services');
    setEditing(p);
  }

  async function save() {
    if (!editing?.name_ar || !editing?.price) {
      toast.error('الاسم والسعر مطلوبان');
      return;
    }
    setBusy('save');
    try {
      const res = await fetch('/api/admin/packages', {
        method: action === 'create' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'فشل'); return; }
      toast.success('تم ✨');
      setEditing(null);
      router.refresh();
    } finally { setBusy(null); }
  }

  async function saveServices() {
    if (!editing?.id) return;
    setBusy('save');
    try {
      const res = await fetch(`/api/admin/packages/${editing.id}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_ids: Array.from(selectedServices) }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'فشل'); return; }
      toast.success(`تم ربط ${selectedServices.size} خدمة`);
      setEditing(null);
    } finally { setBusy(null); }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`متأكدة من حذف "${name}"؟`)) return;
    setBusy(id);
    await fetch(`/api/admin/packages?id=${id}`, { method: 'DELETE' });
    setBusy(null);
    toast.success('تم الحذف');
    router.refresh();
  }

  async function toggleActive(p: Package) {
    setBusy(p.id);
    await fetch('/api/admin/packages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, is_active: !p.is_active }),
    });
    setBusy(null);
    router.refresh();
  }

  function toggleService(id: string) {
    const next = new Set(selectedServices);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedServices(next);
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-ink-soft text-sm">{packages.length} بكج · اضغطي "خدمات البكج" لربط الخدمات</p>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 !py-2 text-sm">
          <Plus className="w-4 h-4" /> بكج جديد
        </button>
      </div>

      {packages.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-cream-200">
          <PackageIcon className="w-12 h-12 text-ink-soft/50 mx-auto mb-3" />
          <div className="text-ink-soft text-sm mb-4">ما فيه بكجات بعد</div>
          <button onClick={openCreate} className="btn-primary"><Plus className="w-4 h-4" /> إنشاء بكج</button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((p) => (
            <div key={p.id} className={`bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-sm ${!p.is_active ? 'opacity-60' : ''}`}>
              <div className="bg-gradient-to-l from-gold-deep to-ink p-5 text-cream-50">
                <div className="font-ar-display text-xl font-bold">{p.name_ar}</div>
                {p.description_ar && (
                  <div className="text-xs text-gold-light mt-1 line-clamp-2">{p.description_ar}</div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-en-display text-3xl font-bold text-gold-deep">{formatPrice(p.price)}</div>
                  {p.original_price && Number(p.original_price) > Number(p.price) && (
                    <div className="font-en-display text-sm text-ink-soft line-through">{formatPrice(p.original_price)}</div>
                  )}
                </div>
                {p.valid_until && (
                  <div className="text-xs text-ink-soft flex items-center gap-1 mb-3">
                    <Clock className="w-3 h-3" />
                    <span className="font-en-display">ساري حتى {p.valid_until.split('T')[0]}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => openServices(p)} className="py-2 bg-gold-light/15 text-gold-deep rounded-lg text-xs font-bold hover:bg-gold-light/30 flex items-center justify-center gap-1">
                    <Scissors className="w-3 h-3" /> خدمات البكج
                  </button>
                  <button onClick={() => openEdit(p)} className="py-2 bg-cream-100 text-ink rounded-lg text-xs font-bold hover:bg-cream-200 flex items-center justify-center gap-1">
                    <Edit2 className="w-3 h-3" /> تعديل
                  </button>
                </div>
                <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t border-cream-200">
                  <button onClick={() => toggleActive(p)} disabled={busy === p.id} className="p-1.5 hover:bg-cream-100 rounded text-ink-soft">
                    {p.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => remove(p.id, p.name_ar)} disabled={busy === p.id} className="p-1.5 hover:bg-danger/10 rounded text-danger">
                    {busy === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal — تعديل البيانات */}
      {editing && mode === 'edit' && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-cream-200">
              <h3 className="font-ar-display text-lg font-bold text-gold-deep">
                {action === 'create' ? 'بكج جديد' : 'تعديل بكج'}
              </h3>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-cream-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <F label="اسم البكج (عربي) *">
                <input type="text" value={editing.name_ar || ''} onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })} className="inp" placeholder="مثل: بكج الصيف" />
              </F>
              <F label="اسم البكج (English)">
                <input type="text" value={editing.name_en || ''} onChange={(e) => setEditing({ ...editing, name_en: e.target.value })} className="inp font-en-display" placeholder="Summer Package" />
              </F>
              <F label="الوصف">
                <textarea rows={2} value={editing.description_ar || ''} onChange={(e) => setEditing({ ...editing, description_ar: e.target.value })} className="inp resize-none" />
              </F>
              <div className="grid grid-cols-2 gap-3">
                <F label="السعر (ر.س) *">
                  <input type="number" step="0.01" value={editing.price || ''} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className="inp font-en-display" />
                </F>
                <F label="السعر قبل الخصم">
                  <input type="number" step="0.01" value={editing.original_price || ''} onChange={(e) => setEditing({ ...editing, original_price: e.target.value ? Number(e.target.value) : null })} className="inp font-en-display" />
                </F>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="ساري من">
                  <input type="date" value={editing.valid_from || ''} onChange={(e) => setEditing({ ...editing, valid_from: e.target.value || null })} className="inp font-en-display" />
                </F>
                <F label="ساري حتى">
                  <input type="date" value={editing.valid_until || ''} onChange={(e) => setEditing({ ...editing, valid_until: e.target.value || null })} className="inp font-en-display" />
                </F>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="w-4 h-4 accent-gold-deep" />
                البكج مفعّل
              </label>
            </div>
            <div className="p-5 border-t border-cream-200 flex gap-3">
              <button onClick={() => setEditing(null)} className="btn-outline !py-2 flex-1 text-sm">إلغاء</button>
              <button onClick={save} disabled={busy === 'save'} className="btn-primary !py-2 flex-1 text-sm disabled:opacity-50">
                {busy === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : (action === 'create' ? 'إنشاء' : 'حفظ')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — إدارة خدمات البكج */}
      {editing && mode === 'services' && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-cream-200">
              <div>
                <h3 className="font-ar-display text-lg font-bold text-gold-deep">خدمات {editing.name_ar}</h3>
                <p className="text-xs text-ink-soft mt-1">اختاري الخدمات المضمّنة في البكج</p>
              </div>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-cream-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {categories.map((cat) => {
                const catServices = services.filter((s) => s.category_id === cat.id);
                if (catServices.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <h4 className="font-ar-display font-bold text-sm text-gold-deep mb-2">{cat.name_ar}</h4>
                    <div className="grid grid-cols-2 gap-1.5">
                      {catServices.map((s) => {
                        const sel = selectedServices.has(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={() => toggleService(s.id)}
                            className={`text-right text-xs py-2 px-2.5 rounded-lg border transition-all flex items-center justify-between gap-2 ${
                              sel ? 'bg-gold-deep text-cream-50 border-gold-deep' : 'bg-cream-50 border-cream-200 hover:border-gold-light'
                            }`}
                          >
                            <div className="flex items-center gap-1 min-w-0">
                              {sel && <Check className="w-3 h-3 shrink-0" />}
                              <span className="truncate">{s.name_ar}</span>
                            </div>
                            <span className="text-[10px] opacity-70 shrink-0 font-en-display">{formatDuration(s.duration_min)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-5 border-t border-cream-200 flex items-center gap-3">
              <div className="text-xs text-ink-soft">مُختار: <span className="font-bold text-gold-deep">{selectedServices.size}</span></div>
              <div className="flex-1"></div>
              <button onClick={() => setEditing(null)} className="btn-outline !py-2 text-sm">إلغاء</button>
              <button onClick={saveServices} disabled={busy === 'save'} className="btn-primary !py-2 text-sm disabled:opacity-50">
                {busy === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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

if (typeof document !== 'undefined' && !document.getElementById('pkg-mgr-css')) {
  const el = document.createElement('style');
  el.id = 'pkg-mgr-css';
  el.textContent = `.inp{width:100%;padding:.625rem .75rem;border-radius:.75rem;border:1px solid #ece1cc;background:#fbf7ef;outline:none;font-size:.875rem;transition:all .15s}.inp:focus{background:#fff;border-color:#c9a96e}`;
  document.head.appendChild(el);
}
