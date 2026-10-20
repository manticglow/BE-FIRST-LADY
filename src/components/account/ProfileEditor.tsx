/**
 * ProfileEditor — تعديل بيانات العميلة + تغيير كلمة المرور
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User, Phone, Mail, Lock, Loader2, Cake } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/database';

export default function ProfileEditor({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: profile.full_name || '',
    phone: profile.phone || '',
    email: profile.email || '',
    date_of_birth: (profile as any).date_of_birth || '',
  });
  const [passwords, setPasswords] = useState({ newPass: '', confirmPass: '' });
  const [busy, setBusy] = useState<string | null>(null);

  async function saveProfile() {
    setBusy('profile');
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'فشل الحفظ');
        return;
      }
      toast.success('تم تحديث بياناتكِ ✨');
      router.refresh();
    } finally { setBusy(null); }
  }

  async function changePassword() {
    if (passwords.newPass.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 حروف على الأقل');
      return;
    }
    if (passwords.newPass !== passwords.confirmPass) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }
    setBusy('password');
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('تم تغيير كلمة المرور 🔐');
    setPasswords({ newPass: '', confirmPass: '' });
  }

  return (
    <div className="space-y-6">
      {/* البيانات الشخصية */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200">
        <h2 className="font-ar-display text-lg font-bold text-gold-deep mb-5">
          البيانات الشخصية
        </h2>

        <div className="space-y-4">
          <Field label="الاسم الكامل" icon={User}>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="inp"
            />
          </Field>

          <Field label="رقم الجوال" icon={Phone}>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="inp font-en-display"
              placeholder="05xxxxxxxx"
            />
          </Field>

          <Field label="البريد الإلكتروني" icon={Mail}>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="inp font-en-display"
            />
          </Field>

          <Field label="تاريخ ميلادكِ · لكوبون هديّة سنوية 🎂" icon={Cake}>
            <input
              type="date"
              value={form.date_of_birth}
              onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
              className="inp font-en-display"
              max={new Date().toISOString().split('T')[0]}
            />
          </Field>

          <button
            onClick={saveProfile}
            disabled={busy === 'profile'}
            className="btn-primary w-full flex items-center justify-center gap-2 !py-2.5 disabled:opacity-50"
          >
            {busy === 'profile' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            حفظ البيانات
          </button>
        </div>
      </div>

      {/* تغيير كلمة المرور */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200">
        <h2 className="font-ar-display text-lg font-bold text-gold-deep mb-5">
          تغيير كلمة المرور
        </h2>

        <div className="space-y-4">
          <Field label="كلمة المرور الجديدة" icon={Lock}>
            <input
              type="password"
              value={passwords.newPass}
              onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
              placeholder="6 حروف على الأقل"
              className="inp"
            />
          </Field>

          <Field label="تأكيد كلمة المرور" icon={Lock}>
            <input
              type="password"
              value={passwords.confirmPass}
              onChange={(e) => setPasswords({ ...passwords, confirmPass: e.target.value })}
              className="inp"
            />
          </Field>

          <button
            onClick={changePassword}
            disabled={busy === 'password' || !passwords.newPass}
            className="btn-primary w-full flex items-center justify-center gap-2 !py-2.5 disabled:opacity-50"
          >
            {busy === 'password' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            تغيير كلمة المرور
          </button>
        </div>
      </div>

      {/* بطاقة اللوياليتي (للعرض فقط) */}
      {profile.loyalty_tier && (
        <div className="bg-gradient-to-l from-gold-deep to-ink text-cream-50 rounded-2xl p-5">
          <div className="text-xs text-gold-light mb-1">عضويتكِ</div>
          <div className="flex items-center justify-between">
            <div className="font-ar-display text-xl font-bold">
              عضوة {profile.loyalty_tier === 'bronze' ? 'برونزية' : profile.loyalty_tier === 'silver' ? 'فضية' : profile.loyalty_tier === 'gold' ? 'ذهبية' : 'ماسية'}
            </div>
            <div className="font-en-display text-2xl font-bold">
              {profile.loyalty_points || 0} نقطة
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, icon: Icon, children }: { label: string; icon: any; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-soft mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft z-10" />
        <div className="[&>*]:!pr-10">{children}</div>
      </div>
    </div>
  );
}

if (typeof document !== 'undefined' && !document.getElementById('profile-editor-css')) {
  const el = document.createElement('style');
  el.id = 'profile-editor-css';
  el.textContent = `.inp{width:100%;padding:.75rem;border-radius:.75rem;border:1px solid #ece1cc;background:#fbf7ef;outline:none;font-size:.875rem;transition:all .15s}.inp:focus{background:#fff;border-color:#c9a96e}`;
  document.head.appendChild(el);
}
