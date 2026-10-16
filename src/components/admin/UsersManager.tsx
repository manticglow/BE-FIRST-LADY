/**
 * UsersManager — إدارة اليوزرات (owner فقط)
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Users, Plus, Shield, Trash2, X, Loader2, Mail, Phone, User as UserIcon, Lock } from 'lucide-react';

interface User {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: 'owner' | 'manager' | 'staff' | 'customer';
  created_at: string;
}

const ROLE_INFO: Record<string, { label: string; color: string; description: string }> = {
  owner:    { label: 'مالكة',   color: 'bg-gold-deep text-cream-50', description: 'كل الصلاحيات' },
  manager:  { label: 'مديرة',   color: 'bg-blue-700 text-white',     description: 'إدارة محتوى + حجوزات' },
  staff:    { label: 'موظفة',   color: 'bg-success/80 text-white',   description: 'عرض الحجوزات + حضور وانصراف' },
};

// العميلات يسجّلن بأنفسهن — لا يُنشأن من لوحة الإدارة

export default function UsersManager({ users }: { users: User[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Partial<User> & { password?: string } | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [busy, setBusy] = useState<string | null>(null);

  function openCreate() {
    setMode('create');
    setEditing({ full_name: '', email: '', phone: '', role: 'staff', password: '' });
  }

  function openEdit(u: User) {
    setMode('edit');
    setEditing({ id: u.id, full_name: u.full_name, phone: u.phone || '', role: u.role });
  }

  async function save() {
    if (!editing?.full_name || !editing?.role) {
      toast.error('الاسم والدور مطلوبان');
      return;
    }
    if (mode === 'create' && (!editing.email || !editing.password)) {
      toast.error('البريد وكلمة المرور مطلوبان');
      return;
    }
    setBusy('save');
    const res = await fetch('/api/admin/users', {
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
    toast.success(mode === 'create' ? 'تم إنشاء اليوزر 👤' : 'تم الحفظ');
    setEditing(null);
    router.refresh();
  }

  async function remove(u: User) {
    if (u.role === 'owner') {
      toast.error('ما يمكن حذف المالكة');
      return;
    }
    if (!confirm(`متأكدة من حذف "${u.full_name}"؟`)) return;
    setBusy(u.id);
    await fetch(`/api/admin/users?id=${u.id}`, { method: 'DELETE' });
    setBusy(null);
    toast.success('تم الحذف');
    router.refresh();
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-ink-soft text-sm">
          {users.length} يوزر · إدارة الصلاحيات
        </p>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 !py-2 text-sm">
          <Plus className="w-4 h-4" />
          يوزر جديد
        </button>
      </div>

      {users.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-cream-200">
          <Users className="w-12 h-12 text-ink-soft/50 mx-auto mb-3" />
          <div className="text-ink-soft text-sm">ما فيه يوزرات بعد</div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 border-b border-cream-200">
              <tr className="text-right text-xs text-ink-soft font-bold">
                <th className="p-3">المستخدمة</th>
                <th className="p-3">الاتصال</th>
                <th className="p-3">الدور</th>
                <th className="p-3">تاريخ الإنشاء</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const info = ROLE_INFO[u.role] || ROLE_INFO.customer;
                return (
                  <tr key={u.id} className="border-b border-cream-100 hover:bg-cream-50/50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-light to-gold-deep text-cream-50 flex items-center justify-center font-bold">
                          {u.full_name.charAt(0)}
                        </div>
                        <div className="font-bold text-ink">{u.full_name}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      {u.email && (
                        <div className="text-xs text-ink flex items-center gap-1 font-en-display">
                          <Mail className="w-3 h-3" />{u.email}
                        </div>
                      )}
                      {u.phone && (
                        <div className="text-xs text-ink-soft flex items-center gap-1 font-en-display mt-0.5">
                          <Phone className="w-3 h-3" />{u.phone}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${info.color}`}>
                        {info.label}
                      </span>
                      <div className="text-[10px] text-ink-soft mt-1">{info.description}</div>
                    </td>
                    <td className="p-3 text-xs text-ink-soft font-en-display">
                      {new Date(u.created_at).toLocaleDateString('en-GB')}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-cream-100 rounded text-gold-deep">
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => remove(u)}
                          disabled={busy === u.id || u.role === 'owner'}
                          className="p-1.5 hover:bg-danger/10 rounded text-danger disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {busy === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-cream-200">
              <h3 className="font-ar-display text-lg font-bold text-gold-deep">
                {mode === 'create' ? 'إنشاء يوزر جديد' : 'تعديل صلاحيات'}
              </h3>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-cream-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">الاسم الكامل *</label>
                <div className="relative">
                  <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                  <input
                    type="text"
                    value={editing.full_name || ''}
                    onChange={(e) => setEditing({ ...editing, full_name: e.target.value })}
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm"
                  />
                </div>
              </div>

              {mode === 'create' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft mb-1.5">البريد الإلكتروني *</label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                      <input
                        type="email"
                        value={editing.email || ''}
                        onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                        className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm font-en-display"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-soft mb-1.5">كلمة المرور *</label>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                      <input
                        type="text"
                        value={editing.password || ''}
                        onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                        placeholder="6 حروف على الأقل"
                        className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm font-en-display"
                      />
                    </div>
                    <p className="text-[10px] text-ink-soft mt-1">ارسلي هذي الكلمة لليوزرة بشكل آمن</p>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">رقم الجوال</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                  <input
                    type="tel"
                    value={editing.phone || ''}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                    placeholder="05xxxxxxxx"
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm font-en-display"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-2">الدور *</label>
                <div className="space-y-2">
                  {Object.entries(ROLE_INFO).map(([key, info]) => (
                    <label
                      key={key}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        editing.role === key ? 'border-gold-deep bg-gold-light/10' : 'border-cream-200 hover:border-gold-light'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        checked={editing.role === key}
                        onChange={() => setEditing({ ...editing, role: key as any })}
                        className="mt-1 accent-gold-deep"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${info.color}`}>
                            {info.label}
                          </span>
                        </div>
                        <div className="text-xs text-ink-soft mt-1">{info.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-cream-200 flex gap-3">
              <button onClick={() => setEditing(null)} className="btn-outline !py-2 flex-1 text-sm">إلغاء</button>
              <button onClick={save} disabled={busy === 'save'} className="btn-primary !py-2 flex-1 text-sm disabled:opacity-50">
                {busy === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === 'create' ? 'إنشاء' : 'حفظ')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
