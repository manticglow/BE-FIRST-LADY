/**
 * Signup Page — صفحة إنشاء حساب
 * ═══════════════════════════════════════════════════════════
 * - يسوّي profile تلقائياً بعد التسجيل (trigger في supabase أو client-side)
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Mail, Lock, User, Phone, Loader2 } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm({ ...form, [k]: v });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 حروف على الأقل');
      return;
    }

    setLoading(true);
    const supabase = createClient();

    // أنشئ المستخدم
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.full_name,
          phone: form.phone,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    // أنشئ البروفايل
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: form.full_name,
        phone: form.phone,
        email: form.email,
        role: 'customer',
      });
    }

    toast.success('تم إنشاء حسابكِ 🌸');
    router.refresh()
   setTimeout(() => router.push('/account'), 100);
  }

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="font-en-display italic text-3xl text-gold-deep">Be First Lady</div>
            <div className="font-en-label text-[10px] tracking-[0.3em] text-gold mt-1">MADINAH, KSA</div>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-cream-200">
          <h1 className="font-ar-display text-2xl font-bold text-gold-deep mb-1 text-center">
            انضمي إلينا
          </h1>
          <p className="text-sm text-ink-soft text-center mb-6">
            أنشئي حسابكِ لحجز أسرع ومتابعة طلباتكِ
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* الاسم */}
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                اسمكِ الكامل
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => update('full_name', e.target.value)}
                  placeholder="هيا الزهراني"
                  className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm"
                />
              </div>
            </div>

            {/* الجوال */}
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                رقم الجوال
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  placeholder="05xxxxxxxx"
                  className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm font-en-display"
                />
              </div>
            </div>

            {/* البريد */}
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm font-en-display"
                />
              </div>
            </div>

            {/* كلمة المرور */}
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="6 حروف على الأقل"
                  className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإنشاء...</>
              ) : (
                'إنشاء حساب'
              )}
            </button>

            <p className="text-xs text-ink-soft text-center leading-relaxed">
              بإنشاء حسابكِ توافقين على سياسة الخصوصية وشروط الاستخدام
            </p>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cream-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-ink-soft">أو</span>
            </div>
          </div>

          <p className="text-center text-sm text-ink-soft">
            عندكِ حساب؟{' '}
            <Link href="/login" className="text-gold-deep font-bold hover:text-gold">
              سجّلي دخول
            </Link>
          </p>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-ink-soft hover:text-gold-deep">
            ← العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
