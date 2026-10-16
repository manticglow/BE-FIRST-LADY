/**
 * صفحة "نسيت كلمة المرور"
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-cream-200 text-center">
          <div className="w-16 h-16 rounded-full bg-success/20 mx-auto mb-4 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
          <h1 className="font-ar-display text-2xl font-bold text-gold-deep mb-2">
            تحقّقي من بريدكِ 💛
          </h1>
          <p className="text-sm text-ink-soft mb-6">
            أرسلنا رابط إعادة تعيين كلمة المرور إلى:
            <br />
            <strong className="text-ink font-en-display">{email}</strong>
            <br /><br />
            اضغطي الرابط من البريد لإنشاء كلمة مرور جديدة.
          </p>
          <Link href="/login" className="text-sm text-gold-deep font-bold hover:text-gold">
            ← العودة لتسجيل الدخول
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="font-en-display italic text-3xl text-gold-deep">Be First Lady</div>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-cream-200">
          <h1 className="font-ar-display text-2xl font-bold text-gold-deep mb-1 text-center">
            نسيتِ كلمة المرور؟
          </h1>
          <p className="text-sm text-ink-soft text-center mb-6">
            لا بأس، ندخّلكِ من البريد
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm font-en-display"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              أرسلي رابط إعادة التعيين
            </button>
          </form>

          <p className="text-center text-sm text-ink-soft mt-6">
            <Link href="/login" className="text-gold-deep font-bold hover:text-gold">
              ← العودة لتسجيل الدخول
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
