/**
 * StaffManager — إدارة الموظفات + خدماتهن + جدولهن
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Users, Plus, Edit2, Trash2, X, Loader2, Eye, EyeOff,
  Scissors, Calendar, Check,
} from 'lucide-react';
import type { Category, Service } from '@/types/database';

interface Staff {
  id: string;
  name: string;
  job_title: string;
  specialties: string[];
  avatar_url: string | null;
  bio: string | null;
  is_active: boolean;
  display_order: number;
}

const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

type ModalMode = 'edit' | 'services' | 'schedule';

export default function StaffManager({
  staff, categories, services,
}: {
  staff: Staff[];
  categories: Category[];
  services: Service[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Partial<Staff> | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>('edit');
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [busy, setBusy] = useState<string | null>(null);

  // لإدارة الخدمات
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  // لإدارة الجدول
  const [schedule, setSchedule] = useState<any[]>([]);

  // جلب خدمات/جدول عند فتح النافذة الخاصة
  useEffect(() => {
    if (!editing?.id || modalMode === 'edit') return;
    if (modalMode === 'services') {
      fetch(`/api/admin/staff/${editing.id}/services`)
        .then((r) => r.json())
        .then((d) => setSelectedServices(new Set(d.service_ids || [])));
    } else if (modalMode === 'schedule') {
      fetch(`/api/admin/staff/${editing.id}/schedule`)
        .then((r) => r.json())
        .then((d) => {
          const existing = d.schedule || [];
          const full = DAYS.map((_, i) => {
            const found = existing.find((s: any) => s.day_of_week === i);
            return found || {
              day_of_week: i,
              start_time: i === 5 ? '' : '10:00',  // الجمعة إجازة افتراضي
              end_time:   i === 5 ? '' : '22:00',
              is_off:     i === 5,
            };
          });
          setSchedule(full);
        });
    }
  }, [editing?.id, modalMode]);

  function openCreate() {
    setMode('create');
    setModalMode('edit');
    setEditing({ name: '', job_title: '', specialties: [], is_active: true, display_order: staff.length });
  }
  function openEdit(s: Staff) {
    setMode('edit');
    setModalMode('edit');
    setEditing({ ...s });
  }
  function openServices(s: Staff) {
    setModalMode('services');
    setEditing({ ...s });
  }
  function openSchedule(s: Staff) {
    setModalMode('schedule');
    setEditing({ ...s });
  }

  async function save() {
    if (!editing?.name || !editing?.job_title) {
      toast.error('الاسم والمسمى مطلوبان');
      return;
    }
    setBusy('save');
    const res = await fetch('/api/admin/staff', {
      method: mode === 'create' ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    setBusy(null);
    if (!res.ok) {
      toast.error((await res.json()).error || 'فشل');
      return;
    }
    toast.success('تم الحفظ ✨');
    setEditing(null);
    router.refresh();
  }

  async function saveServices() {
    if (!editing?.id) return;
    setBusy('save');
    try {
      const res = await fetch(`/api/admin/staff/${editing.id}/services`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_ids: Array.from(selectedServices) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'فشل الحفظ');
        if (data.details) console.error('API details:', data.details);
        return;
      }
      toast.success(`تم ربط ${selectedServices.size} خدمة ✨`);
      setEditing(null);
    } catch (e: any) {
      toast.error('خطأ في الشبكة: ' + e.message);
    } finally {
      setBusy(null);
    }
  }

  async function saveSchedule() {
    if (!editing?.id) return;
    setBusy('save');
    try {
      const res = await fetch(`/api/admin/staff/${editing.id}/schedule`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'فشل الحفظ');
        if (data.details) console.error('API details:', data.details);
        return;
      }
      toast.success('تم حفظ الجدول 📅');
      setEditing(null);
    } catch (e: any) {
      toast.error('خطأ في الشبكة: ' + e.message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(id: string, name: string) {
    if (!confirm(`متأكدة من حذف "${name}"؟`)) return;
    setBusy(id);
    await fetch(`/api/admin/staff?id=${id}`, { method: 'DELETE' });
    setBusy(null);
    toast.success('تم الحذف');
    router.refresh();
  }

  async function toggleActive(s: Staff) {
    setBusy(s.id);
    await fetch('/api/admin/staff', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    });
    setBusy(null);
    router.refresh();
  }

  function toggleService(id: string) {
    const next = new Set(selectedServices);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedServices(next);
  }

  function toggleCategoryAll(categoryId: string) {
    const catServices = services.filter((s) => s.category_id === categoryId);
    const allSelected = catServices.every((s) => selectedServices.has(s.id));
    const next = new Set(selectedServices);
    catServices.forEach((s) => allSelected ? next.delete(s.id) : next.add(s.id));
    setSelectedServices(next);
  }

  return (
    <>
      {staff.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-cream-200">
          <Users className="w-12 h-12 text-ink-soft/50 mx-auto mb-3" />
          <div className="text-ink-soft text-sm mb-4">ما فيه موظفات مسجّلات بعد</div>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="w-4 h-4" />
            إضافة أول موظفة
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((s) => (
            <div key={s.id} className={`bg-white rounded-2xl border border-cream-200 p-5 ${!s.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-light to-gold-deep text-cream-50 flex items-center justify-center text-xl font-bold shrink-0">
                  {s.avatar_url ? (
                    <img src={s.avatar_url} alt={s.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    s.name.charAt(0)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-ar-display font-bold text-ink">{s.name}</div>
                  <div className="text-xs text-gold-deep">{s.job_title}</div>
                  {s.specialties && s.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {s.specialties.slice(0, 3).map((sp) => (
                        <span key={sp} className="text-[10px] bg-cream-100 text-ink-soft px-2 py-0.5 rounded-full">
                          {sp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* أزرار إدارة الخدمات والجدول */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  onClick={() => openServices(s)}
                  className="flex items-center justify-center gap-1 py-2 bg-gold-light/15 hover:bg-gold-light/30 text-gold-deep rounded-lg text-xs font-bold"
                >
                  <Scissors className="w-3 h-3" />
                  خدماتها
                </button>
                <button
                  onClick={() => openSchedule(s)}
                  className="flex items-center justify-center gap-1 py-2 bg-gold-light/15 hover:bg-gold-light/30 text-gold-deep rounded-lg text-xs font-bold"
                >
                  <Calendar className="w-3 h-3" />
                  جدولها
                </button>
              </div>

              <div className="flex items-center justify-end gap-1 pt-3 border-t border-cream-200">
                <button onClick={() => toggleActive(s)} disabled={busy === s.id} className="p-1.5 hover:bg-cream-100 rounded-md text-ink-soft">
                  {s.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-cream-100 rounded-md text-gold-deep">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => remove(s.id, s.name)} disabled={busy === s.id} className="p-1.5 hover:bg-danger/10 rounded-md text-danger">
                  {busy === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <button onClick={openCreate} className="min-h-[220px] rounded-2xl border-2 border-dashed border-gold-light/50 text-gold-deep hover:bg-gold-light/5 flex items-center justify-center gap-2 font-bold">
            <Plus className="w-5 h-5" />
            موظفة جديدة
          </button>
        </div>
      )}

      {/* Modal — تعديل بيانات */}
      {editing && modalMode === 'edit' && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-cream-200">
              <h3 className="font-ar-display text-lg font-bold text-gold-deep">
                {mode === 'create' ? 'إضافة موظفة' : 'تعديل'}
              </h3>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-cream-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <Field label="الاسم *">
                <input
                  type="text"
                  value={editing.name || ''}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="input"
                />
              </Field>
              <Field label="المسمى الوظيفي *">
                <input
                  type="text"
                  value={editing.job_title || ''}
                  onChange={(e) => setEditing({ ...editing, job_title: e.target.value })}
                  placeholder="أخصائية مساج، مصففة شعر..."
                  className="input"
                />
              </Field>
              <Field label="التخصّصات (مفصولة بفواصل)">
                <input
                  type="text"
                  value={editing.specialties?.join(', ') || ''}
                  onChange={(e) => setEditing({ ...editing, specialties: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                  placeholder="مساج، بشرة، عرايس"
                  className="input"
                />
              </Field>
              <Field label="نبذة (اختياري)">
                <textarea
                  rows={2}
                  value={editing.bio || ''}
                  onChange={(e) => setEditing({ ...editing, bio: e.target.value })}
                  className="input resize-none"
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.is_active ?? true}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })}
                  className="w-4 h-4 accent-gold-deep"
                />
                الموظفة مفعّلة
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

      {/* Modal — إدارة الخدمات */}
      {editing && modalMode === 'services' && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-cream-200">
              <div>
                <h3 className="font-ar-display text-lg font-bold text-gold-deep">خدمات {editing.name}</h3>
                <p className="text-xs text-ink-soft mt-1">اختاري الخدمات التي تقدّمها</p>
              </div>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-cream-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {categories.map((cat) => {
                const catServices = services.filter((s) => s.category_id === cat.id);
                if (catServices.length === 0) return null;
                const allSelected = catServices.every((s) => selectedServices.has(s.id));
                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-ar-display font-bold text-sm text-gold-deep">{cat.name_ar}</h4>
                      <button
                        onClick={() => toggleCategoryAll(cat.id)}
                        className="text-[10px] text-gold-deep font-bold hover:underline"
                      >
                        {allSelected ? 'إلغاء الكل' : 'اختيار الكل'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {catServices.map((s) => {
                        const sel = selectedServices.has(s.id);
                        return (
                          <button
                            key={s.id}
                            onClick={() => toggleService(s.id)}
                            className={`text-right text-xs py-2 px-2.5 rounded-lg border transition-all flex items-center gap-2 ${
                              sel ? 'bg-gold-deep text-cream-50 border-gold-deep' : 'bg-cream-50 border-cream-200 hover:border-gold-light'
                            }`}
                          >
                            {sel && <Check className="w-3 h-3" />}
                            <span className="truncate">{s.name_ar}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-5 border-t border-cream-200 flex items-center gap-3">
              <div className="text-xs text-ink-soft">
                مُختار: <span className="font-bold text-gold-deep">{selectedServices.size}</span>
              </div>
              <div className="flex-1"></div>
              <button onClick={() => setEditing(null)} className="btn-outline !py-2 text-sm">إلغاء</button>
              <button onClick={saveServices} disabled={busy === 'save'} className="btn-primary !py-2 text-sm disabled:opacity-50">
                {busy === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — إدارة الجدول */}
      {editing && modalMode === 'schedule' && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-cream-200">
              <div>
                <h3 className="font-ar-display text-lg font-bold text-gold-deep">جدول {editing.name}</h3>
                <p className="text-xs text-ink-soft mt-1">ساعات العمل الأسبوعية</p>
              </div>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-cream-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {schedule.map((day, i) => (
                <div key={i} className={`p-3 rounded-xl border ${day.is_off ? 'bg-cream-50/50 border-cream-200' : 'bg-white border-gold-light/30'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-bold text-sm text-ink">{DAYS[day.day_of_week]}</div>
                    <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={day.is_off}
                        onChange={(e) => {
                          const next = [...schedule];
                          next[i].is_off = e.target.checked;
                          setSchedule(next);
                        }}
                        className="w-3 h-3 accent-gold-deep"
                      />
                      <span className="text-ink-soft">إجازة</span>
                    </label>
                  </div>
                  {!day.is_off && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-ink-soft mb-1">من</label>
                        <input
                          type="time"
                          value={day.start_time}
                          onChange={(e) => {
                            const next = [...schedule];
                            next[i].start_time = e.target.value;
                            setSchedule(next);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-cream-200 bg-cream-50 text-sm font-en-display"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-ink-soft mb-1">إلى</label>
                        <input
                          type="time"
                          value={day.end_time}
                          onChange={(e) => {
                            const next = [...schedule];
                            next[i].end_time = e.target.value;
                            setSchedule(next);
                          }}
                          className="w-full px-2 py-1.5 rounded-lg border border-cream-200 bg-cream-50 text-sm font-en-display"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-cream-200 flex gap-3">
              <button onClick={() => setEditing(null)} className="btn-outline !py-2 flex-1 text-sm">إلغاء</button>
              <button onClick={saveSchedule} disabled={busy === 'save'} className="btn-primary !py-2 flex-1 text-sm disabled:opacity-50">
                {busy === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ الجدول'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-soft mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// استخراج style موحّد للمدخلات
if (typeof document !== 'undefined') {
  const css = `.input{width:100%;padding:.625rem .75rem;border-radius:.75rem;border:1px solid #ece1cc;background:#fbf7ef;outline:none;font-size:.875rem;transition:all .15s}.input:focus{background:#fff;border-color:#c9a96e}`;
  if (!document.getElementById('staff-mgr-css')) {
    const el = document.createElement('style');
    el.id = 'staff-mgr-css';
    el.textContent = css;
    document.head.appendChild(el);
  }
}
