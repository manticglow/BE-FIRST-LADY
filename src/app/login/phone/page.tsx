/**
 * /login/phone — تسجيل الدخول برقم الجوال عبر واتساب
 * ═══════════════════════════════════════════════════════════
 * خطوتين:
 *   1. أدخلي رقم الجوال → يوصلك كود 6 أرقام على واتساب
 *   2. أدخلي الكود → دخلت
 */
'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  Phone, MessageCircle, ArrowLeft, Loader2, CheckCircle2,
  Mail, RefreshCw,
} from 'lucide-react';

function PhoneLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || searchParams.get('next') || '/';

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  // عدّاد إعادة الإرسال
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((n) => n - 1), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  // تركيز تلقائي على خانة الكود عند الانتقال
  useEffect(() => {
    if (step === 'code') codeInputRef.current?.focus();
  }, [step]);

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (loading) return;

    // تنظيف الرقم
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 9) {
      toast.error('رقم الجوال غير صحيح');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleaned, purpose: 'login' }),
      });
      const data = await res.json();

      if (!data.ok) {
        toast.error(data.error || 'فشل إرسال الرمز');
        return;
      }

      // في وضع التطوير · إذا الـAPI ما مُفعّلة
      if (data._devCode) {
        setDevCode(data._devCode);
        toast('🔧 DEV: الرمز معروض على الشاشة', { duration: 8000 });
      } else {
        toast.success('✅ تم إرسال الرمز لواتساب');
      }

      setStep('code');
      setResendIn(60);
    } catch (err: any) {
      toast.error('خطأ في الاتصال · حاولي مجدداً');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e?: React.FormEvent) {
    e?.preventDefault();
    if (loading || code.length !== 6) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.replace(/\D/g, ''),
          code,
          fullName: fullName.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!data.ok) {
        toast.error(data.error || 'فشل التحقّق');
        setCode('');
        return;
      }

      toast.success('🌸 أهلاً بكِ في بي فيرست ليدي');
      // Full page reload حتى تتفعّل الجلسة
      setTimeout(() => (window.location.href = redirect), 500);
    } catch (err: any) {
      toast.error('خطأ في الاتصال · حاولي مجدداً');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-white to-cream-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* ═══ الهيدر ═══ */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gold-deep to-ink mb-4 shadow-lg shadow-gold-deep/20">
            <MessageCircle className="w-10 h-10 text-cream-50" />
          </div>
          <h1 className="font-ar-display text-3xl font-bold text-gold-deep mb-2">
            {step === 'phone' ? 'تسجيل برقم الجوال' : 'أدخلي الرمز'}
          </h1>
          <p className="text-sm text-ink-soft">
            {step === 'phone'
              ? 'راح يوصلك رمز عبر واتساب'
              : `أرسلنا رمزاً على ${phone}`}
          </p>
        </div>

        {/* ═══ بطاقة النموذج ═══ */}
        <div className="bg-white rounded-3xl border border-gold-light/20 shadow-xl shadow-gold-deep/5 p-6 md:p-8">
          {step === 'phone' ? (
            <form onSubmit={sendCode} className="space-y-5">
              {/* الاسم (اختياري · للمستخدمات الجدد) */}
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-2">
                  الاسم (اختياري)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="اسمكِ الكريم"
                  className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-gold-deep focus:ring-2 focus:ring-gold-deep/20 outline-none transition-all text-sm bg-white"
                  disabled={loading}
                />
              </div>

              {/* رقم الجوال */}
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-2">
                  رقم الجوال <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-3 flex items-center text-ink-soft">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    required
                    autoFocus
                    dir="ltr"
                    className="w-full ps-10 pe-4 py-3 rounded-xl border border-cream-200 focus:border-gold-deep focus:ring-2 focus:ring-gold-deep/20 outline-none transition-all text-sm bg-white text-right"
                    disabled={loading}
                  />
                </div>
                <p className="text-[11px] text-ink-soft mt-1.5">
                  مثال: 0504389329 · الرمز يصلك على واتساب
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 9}
                className="w-full bg-gradient-to-br from-gold-deep to-ink text-cream-50 font-ar-display font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-gold-deep/20 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جارِ الإرسال...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4" />
                    أرسلي الرمز
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="space-y-5">
              {/* ═══ خانة الكود ═══ */}
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-2">
                  الرمز المكوّن من 6 أرقام
                </label>
                <input
                  ref={codeInputRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="● ● ● ● ● ●"
                  dir="ltr"
                  className="w-full px-4 py-5 rounded-xl border-2 border-cream-200 focus:border-gold-deep focus:ring-2 focus:ring-gold-deep/20 outline-none transition-all text-center text-3xl font-bold tracking-[0.6em] bg-white"
                  disabled={loading}
                />

                {/* عرض الكود في وضع التطوير فقط */}
                {devCode && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                    <p className="text-[10px] text-amber-700 mb-1">🔧 DEV MODE · الـAPI ما مُفعّلة بعد</p>
                    <p className="font-en-display font-bold text-2xl text-amber-900 tracking-[0.3em]">
                      {devCode}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full bg-gradient-to-br from-gold-deep to-ink text-cream-50 font-ar-display font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-gold-deep/20 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    جارِ التحقّق...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    تحقّقي ودخلي
                  </>
                )}
              </button>

              {/* ═══ إعادة الإرسال ═══ */}
              <div className="flex items-center justify-between gap-3 pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setCode('');
                    setDevCode(null);
                  }}
                  className="text-ink-soft hover:text-gold-deep flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="w-3 h-3 rotate-180" />
                  رقم آخر
                </button>

                <button
                  type="button"
                  disabled={resendIn > 0 || loading}
                  onClick={() => sendCode()}
                  className="text-gold-deep hover:text-ink font-bold flex items-center gap-1 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  {resendIn > 0 ? `إعادة الإرسال خلال ${resendIn} ثانية` : 'إعادة إرسال الرمز'}
                </button>
              </div>
            </form>
          )}

          {/* ═══ Divider ═══ */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cream-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-ink-soft">أو</span>
            </div>
          </div>

          {/* ═══ الدخول بالإيميل ═══ */}
          <Link
            href={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}
            className="w-full inline-flex items-center justify-center gap-2 bg-cream-50 text-gold-deep border border-gold-light/40 font-bold py-3 rounded-xl hover:bg-gold-light/10 transition-colors text-sm"
          >
            <Mail className="w-4 h-4" />
            الدخول بالإيميل
          </Link>
        </div>

        {/* ═══ رابط التسجيل ═══ */}
        <p className="text-center text-xs text-ink-soft mt-6">
          لسه ما عندك حساب؟{' '}
          <Link href="/signup" className="font-bold text-gold-deep hover:text-ink">
            أنشئي حساب الآن
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function PhoneLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream-50 flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-gold-deep" /></div>}>
      <PhoneLoginForm />
    </Suspense>
  );
}
