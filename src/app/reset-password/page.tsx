/**
 * صفحة إعادة تعيين كلمة المرور (بعد النقر على رابط البريد)
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Lock, Loader2 } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 حروف على الأقل');
      return;
    }
    if (password !== confirm) {
      toast.error('كلمتا المرور غير متطابقتين');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('تم تحديث كلمة المرور 🔐');
    router.push('/account');
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
            كلمة مرور جديدة
          </h1>
          <p className="text-sm text-ink-soft text-center mb-6">
            اختاري كلمة مرور جديدة لحسابكِ
          </p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 حروف على الأقل"
                  className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full !py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              حفظ كلمة المرور الجديدة
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
