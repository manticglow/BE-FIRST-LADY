/**
 * ServicesManager — إدارة تفاعلية للخدمات
 * ═══════════════════════════════════════════════════════════
 * - عرض الفئات والخدمات
 * - زر إضافة خدمة (Modal)
 * - زر تعديل سريع (Modal)
 * - حذف
 * - تفعيل/إيقاف
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Scissors, Plus, Clock, Edit2, Trash2, X, Loader2, Eye, EyeOff } from 'lucide-react';
import type { Category, Service } from '@/types/database';
import { formatPrice, formatDuration } from '@/lib/utils';

interface Props {
  categories: Category[];
  services: Service[];
}

interface EditState {
  mode: 'create' | 'edit';
  service: Partial<Service>;
}

export default function ServicesManager({ categories, services }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<EditState | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  function openCreate(category_id: string) {
    setEditing({
      mode: 'create',
      service: {
        category_id,
        name_ar: '',
        name_en: '',
        description_ar: '',
        price: 0,
        price_from: false,
        duration_min: 60,
        is_active: true,
        display_order: 0,
      },
    });
  }

  function openEdit(s: Service) {
    setEditing({ mode: 'edit', service: { ...s } });
  }

  async function save() {
    if (!editing) return;
    const s = editing.service;
    if (!s.name_ar || !s.price || !s.duration_min) {
      toast.error('عبّئي الاسم والسعر والمدة');
      return;
    }

    setBusy('save');
    const method = editing.mode === 'create' ? 'POST' : 'PATCH';
    const res = await fetch('/api/admin/services', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
    });
    setBusy(null);

    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || 'فشل الحفظ');
      return;
    }
    toast.success(editing.mode === 'create' ? 'تمت الإضافة ✨' : 'تم الحفظ');
    setEditing(null);
    router.refresh();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`متأكدة من حذف "${name}"؟`)) return;
    setBusy(id);
    const res = await fetch(`/api/admin/services?id=${id}`, { method: 'DELETE' });
    setBusy(null);
    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error || 'فشل الحذف');
      return;
    }
    toast.success('تم الحذف');
    router.refresh();
  }

  async function toggleActive(s: Service) {
    setBusy(s.id);
    const res = await fetch('/api/admin/services', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    });
    setBusy(null);
    if (!res.ok) return toast.error('فشل التحديث');
    toast.success(s.is_active ? 'تم إيقاف الخدمة' : 'تم تفعيل الخدمة');
    router.refresh();
  }

  return (
    <>
      <div className="space-y-6">
        {categories.map((cat) => {
          const catServices = services.filter((s) => s.category_id === cat.id);
          return (
            <div key={cat.id} className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
              <div className="bg-cream-50 px-5 py-3 border-b border-cream-200 flex items-center justify-between">
                <h2 className="font-ar-display font-bold text-gold-deep">
                  <span className="ml-2">{cat.icon}</span>
                  {cat.name_ar}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-soft">{catServices.length} خدمة</span>
                  <button
                    onClick={() => openCreate(cat.id)}
                    className="text-xs font-bold text-gold-deep hover:text-gold flex items-center gap-1 px-2 py-1 border border-gold-light rounded-md"
                  >
                    <Plus className="w-3 h-3" />
                    إضافة
                  </button>
                </div>
              </div>
              {catServices.length === 0 ? (
                <div className="p-6 text-center text-ink-soft text-sm">
                  ما فيه خدمات — أضيفي أول وحدة
                </div>
              ) : (
                <ul className="divide-y divide-cream-100">
                  {catServices.map((s) => (
                    <li
                      key={s.id}
                      className={`px-5 py-3 flex items-center justify-between gap-3 hover:bg-cream-50/50 ${
                        !s.is_active ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-ink">{s.name_ar}</div>
                        <div className="text-xs text-ink-soft flex items-center gap-3 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span className="font-en-display">{formatDuration(s.duration_min)}</span>
                          </span>
                          {s.description_ar && <span className="truncate max-w-xs">{s.description_ar}</span>}
                        </div>
                      </div>
                      <div className="text-left shrink-0 flex items-center gap-2">
                        <span className="font-en-display font-bold text-gold-deep">
                          {s.price_from && <span className="text-xs text-ink-soft ml-1">من</span>}
                          {formatPrice(s.price)}
                        </span>
                        <div className="flex items-center gap-1 border-r border-cream-200 pr-2 mr-1">
                          <button
                            onClick={() => toggleActive(s)}
                            disabled={busy === s.id}
                            className="p-1.5 hover:bg-cream-100 rounded-md text-ink-soft"
                            title={s.is_active ? 'إيقاف' : 'تفعيل'}
                          >
                            {s.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => openEdit(s)}
                            className="p-1.5 hover:bg-cream-100 rounded-md text-gold-deep"
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => remove(s.id, s.name_ar)}
                            disabled={busy === s.id}
                            className="p-1.5 hover:bg-danger/10 rounded-md text-danger"
                            title="حذف"
                          >
                            {busy === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        {categories.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-cream-200">
            <Scissors className="w-12 h-12 text-ink-soft/50 mx-auto mb-3" />
            <div className="text-ink-soft text-sm">لا توجد فئات بعد</div>
          </div>
        )}
      </div>

      {/* Modal تعديل/إضافة */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-cream-200">
              <h3 className="font-ar-display text-lg font-bold text-gold-deep">
                {editing.mode === 'create' ? 'إضافة خدمة' : 'تعديل خدمة'}
              </h3>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-cream-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <Field label="اسم الخدمة (عربي)" required>
                <input
                  type="text"
                  value={editing.service.name_ar || ''}
                  onChange={(e) => setEditing({ ...editing, service: { ...editing.service, name_ar: e.target.value } })}
                  className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm"
                  placeholder="مثل: مساج سويدي"
                />
              </Field>

              <Field label="اسم الخدمة (English)">
                <input
                  type="text"
                  value={editing.service.name_en || ''}
                  onChange={(e) => setEditing({ ...editing, service: { ...editing.service, name_en: e.target.value } })}
                  className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm font-en-display"
                  placeholder="Swedish Massage"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="السعر (ر.س)" required>
                  <input
                    type="number"
                    step="0.01"
                    value={editing.service.price || ''}
                    onChange={(e) => setEditing({ ...editing, service: { ...editing.service, price: Number(e.target.value) } })}
                    className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm font-en-display"
                  />
                </Field>
                <Field label="المدة (دقيقة)" required>
                  <input
                    type="number"
                    value={editing.service.duration_min || ''}
                    onChange={(e) => setEditing({ ...editing, service: { ...editing.service, duration_min: Number(e.target.value) } })}
                    className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm font-en-display"
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={editing.service.price_from || false}
                  onChange={(e) => setEditing({ ...editing, service: { ...editing.service, price_from: e.target.checked } })}
                  className="w-4 h-4 accent-gold-deep"
                />
                السعر يبدأ من (مثل "من 300 ر.س")
              </label>

              <Field label="الفئة" required>
                <select
                  value={editing.service.category_id || ''}
                  onChange={(e) => setEditing({ ...editing, service: { ...editing.service, category_id: e.target.value } })}
                  className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_ar}</option>
                  ))}
                </select>
              </Field>

              <Field label="وصف الخدمة (اختياري)">
                <textarea
                  rows={3}
                  value={editing.service.description_ar || ''}
                  onChange={(e) => setEditing({ ...editing, service: { ...editing.service, description_ar: e.target.value } })}
                  className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm resize-none"
                  placeholder="وصف قصير يظهر للعميلة"
                />
              </Field>

              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={editing.service.is_active ?? true}
                  onChange={(e) => setEditing({ ...editing, service: { ...editing.service, is_active: e.target.checked } })}
                  className="w-4 h-4 accent-gold-deep"
                />
                الخدمة مفعّلة (تظهر للعميلات)
              </label>
            </div>

            <div className="p-5 border-t border-cream-200 flex items-center gap-3">
              <button
                onClick={() => setEditing(null)}
                className="btn-outline !py-2 flex-1 text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={save}
                disabled={busy === 'save'}
                className="btn-primary !py-2 flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {busy === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {editing.mode === 'create' ? 'إضافة' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}

// ينسخ هذا الصنف من globals.css أو تضيفه هناك — نستعمله هنا كـ className مباشر

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-soft mb-1.5">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      {children}
    </div>
  );
}
