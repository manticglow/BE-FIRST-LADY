/**
 * Login Page — صفحة تسجيل الدخول
 */
'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Mail, Lock, Loader2 } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('redirect') || params.get('next') || '/account';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message === 'Invalid login credentials' ? 'البريد أو كلمة المرور خاطئة' : error.message);
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
    toast.success('أهلاً بكِ 💛');
    if (profile?.role === 'owner' || profile?.role === 'manager' || profile?.role === 'staff') {
      router.push('/admin');
    } else {
      router.push(next);
    }
    router.refresh();
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
          <h1 className="font-ar-display text-2xl font-bold text-gold-deep mb-1 text-center">أهلاً بعودتكِ</h1>
          <p className="text-sm text-ink-soft text-center mb-6">سجّلي دخولكِ لإدارة حجوزاتكِ</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm font-en-display" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full !py-3 flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> جاري الدخول...</>) : ('تسجيل الدخول')}
            </button>
          </form>
          <div className="text-center mt-4">
            <Link href="/forgot-password" className="text-xs text-ink-soft hover:text-gold-deep">نسيتِ كلمة المرور؟</Link>
          </div>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-cream-200"></div></div>
            <div className="relative flex justify-center text-xs"><span className="bg-white px-3 text-ink-soft">أو</span></div>
          </div>
          <p className="text-center text-sm text-ink-soft">
            ما عندكِ حساب؟{' '}
            <Link href="/signup" className="text-gold-deep font-bold hover:text-gold">أنشئي حساباً</Link>
          </p>
        </div>
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-ink-soft hover:text-gold-deep">← العودة للرئيسية</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream-50" />}>
      <LoginForm />
    </Suspense>
  );
}
