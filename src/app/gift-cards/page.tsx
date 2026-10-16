/**
 * صفحة شراء بطاقات هدية — عامة
 */
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Gift, Heart, Loader2, Check, Copy, Sparkles } from 'lucide-react';

const AMOUNTS = [100, 200, 300, 500, 1000, 2000];
const DESIGNS = [
  { id: 'gold', label: 'ذهبي كلاسيكي', bg: 'from-gold-deep to-ink', badge: '👑' },
  { id: 'pink', label: 'وردي ناعم', bg: 'from-rose-300 to-pink-500', badge: '🌸' },
  { id: 'floral', label: 'ورود', bg: 'from-amber-300 to-orange-500', badge: '🌺' },
];

export default function GiftCardsPage() {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [form, setForm] = useState({
    amount: 300,
    customAmount: '',
    purchaser_name: '',
    purchaser_phone: '',
    recipient_name: '',
    recipient_phone: '',
    message: '',
    design: 'gold' as 'gold' | 'pink' | 'floral',
  });
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState<any>(null);

  async function submit() {
    const amount = form.customAmount ? Number(form.customAmount) : form.amount;
    if (!amount || amount < 50) {
      toast.error('الحد الأدنى 50 ر.س');
      return;
    }
    if (!form.purchaser_name || !form.purchaser_phone) {
      toast.error('اسمكِ وجوالكِ مطلوبان');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/gift-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          purchaser_name: form.purchaser_name,
          purchaser_phone: form.purchaser_phone,
          recipient_name: form.recipient_name || undefined,
          recipient_phone: form.recipient_phone || undefined,
          message: form.message || undefined,
          design: form.design,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'فشل');
        return;
      }
      setCard({ ...data, amount, design: form.design, message: form.message, recipient_name: form.recipient_name });
      setStep('success');
    } finally { setBusy(false); }
  }

  function copyCode() {
    if (!card) return;
    navigator.clipboard.writeText(card.code);
    toast.success('تم نسخ الكود');
  }

  if (step === 'success' && card) {
    const design = DESIGNS.find((d) => d.id === card.design) || DESIGNS[0];
    return (
      <>
        <Header />
        <main className="min-h-screen bg-cream-50 pt-20 md:pt-24">
          <div className="max-w-md mx-auto px-4 py-8 md:py-12">
            {/* بطاقة الهدية الفاخرة */}
            <div className={`bg-gradient-to-br ${design.bg} text-white rounded-3xl p-8 shadow-2xl mb-6 relative overflow-hidden`}>
              <div className="absolute top-4 right-4 text-6xl opacity-20">{design.badge}</div>
              <div className="relative z-10">
                <div className="font-en-label text-[10px] tracking-[0.4em] opacity-90">GIFT CARD</div>
                <div className="font-ar-display text-xl font-bold mt-1">Be First Lady</div>

                <div className="my-8 text-center">
                  <div className="text-xs opacity-80 mb-2">قيمة البطاقة</div>
                  <div className="font-en-display text-5xl font-bold">{card.amount} ر.س</div>
                </div>

                <div className="bg-white/15 backdrop-blur rounded-xl p-4 border border-white/30">
                  <div className="text-[10px] opacity-80 mb-1">كود البطاقة</div>
                  <div className="flex items-center justify-between">
                    <div className="font-en-display text-xl font-bold tracking-wider">{card.code}</div>
                    <button onClick={copyCode} className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {card.recipient_name && (
                  <div className="mt-6 text-center">
                    <div className="text-xs opacity-80">لـ</div>
                    <div className="font-ar-display text-lg font-bold">{card.recipient_name}</div>
                  </div>
                )}

                {card.message && (
                  <div className="mt-4 bg-white/10 rounded-xl p-3 text-sm italic text-center">
                    "{card.message}"
                  </div>
                )}
              </div>
            </div>

            <div className="bg-success/10 border border-success/30 rounded-2xl p-5 text-center">
              <Check className="w-10 h-10 text-success mx-auto mb-2" />
              <div className="font-ar-display text-lg font-bold text-success">تم إنشاء البطاقة ✨</div>
              <p className="text-sm text-ink-soft mt-2">
                احفظي الكود وأرسليه للمستلمة.
                <br />
                تستخدم عند الحجز في الصالون.
              </p>
            </div>

            <button
              onClick={() => { setStep('form'); setCard(null); }}
              className="btn-outline w-full mt-4"
            >
              شراء بطاقة أخرى
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24">
        <div className="max-w-xl mx-auto px-4 py-8 md:py-12">
          {/* الهيدر */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gold-deep text-cream-50 mx-auto flex items-center justify-center mb-4">
              <Gift className="w-8 h-8" />
            </div>
            <div className="font-en-label text-[10px] tracking-[0.3em] text-gold mb-2">
              GIFT CARDS
            </div>
            <h1 className="font-ar-display text-3xl font-bold text-gold-deep">
              بطاقات هدية فاخرة
            </h1>
            <p className="text-sm text-ink-soft mt-2 leading-relaxed">
              أهدي من تحبّين تجربة ملكية من Be First Lady 💛
              <br />
              تختار الخدمة بنفسها، وتستخدم الكود عند الحجز.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-cream-200 p-6 md:p-8 space-y-6">
            {/* المبلغ */}
            <div>
              <label className="block text-sm font-bold text-gold-deep mb-3">
                اختاري قيمة البطاقة
              </label>
              <div className="grid grid-cols-3 gap-2">
                {AMOUNTS.map((a) => (
                  <button
                    key={a}
                    onClick={() => setForm({ ...form, amount: a, customAmount: '' })}
                    className={`py-3 rounded-xl border-2 transition-all font-en-display font-bold text-lg ${
                      form.amount === a && !form.customAmount
                        ? 'border-gold-deep bg-gold-light/15 text-gold-deep'
                        : 'border-cream-200 bg-cream-50 text-ink hover:border-gold-light'
                    }`}
                  >
                    {a}
                    <div className="text-[10px] font-normal mt-0.5 opacity-70">ر.س</div>
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <input
                  type="number"
                  min="50"
                  max="10000"
                  value={form.customAmount}
                  onChange={(e) => setForm({ ...form, customAmount: e.target.value })}
                  placeholder="أو اكتبي مبلغاً مخصصاً (50 - 10,000)"
                  className="w-full px-3 py-2 rounded-xl border border-cream-200 bg-cream-50 text-sm font-en-display"
                />
              </div>
            </div>

            {/* التصميم */}
            <div>
              <label className="block text-sm font-bold text-gold-deep mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> اختاري التصميم
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DESIGNS.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setForm({ ...form, design: d.id as any })}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      form.design === d.id ? 'border-gold-deep' : 'border-cream-200 hover:border-gold-light'
                    }`}
                  >
                    <div className={`h-12 rounded-lg bg-gradient-to-br ${d.bg} flex items-center justify-center text-2xl mb-1`}>
                      {d.badge}
                    </div>
                    <div className="text-[10px] font-bold text-ink">{d.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* بياناتكِ */}
            <div className="border-t border-cream-200 pt-6">
              <label className="block text-sm font-bold text-gold-deep mb-3">بياناتكِ (المُهدية)</label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={form.purchaser_name}
                  onChange={(e) => setForm({ ...form, purchaser_name: e.target.value })}
                  placeholder="اسمكِ"
                  className="w-full px-3 py-3 rounded-xl border border-cream-200 bg-cream-50 text-sm"
                />
                <input
                  type="tel"
                  value={form.purchaser_phone}
                  onChange={(e) => setForm({ ...form, purchaser_phone: e.target.value })}
                  placeholder="جوالكِ"
                  className="w-full px-3 py-3 rounded-xl border border-cream-200 bg-cream-50 text-sm font-en-display"
                />
              </div>
            </div>

            {/* بيانات المستلمة (اختياري) */}
            <div className="border-t border-cream-200 pt-6">
              <label className="block text-sm font-bold text-gold-deep mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4" /> بيانات المستلمة (اختياري)
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={form.recipient_name}
                  onChange={(e) => setForm({ ...form, recipient_name: e.target.value })}
                  placeholder="اسم المستلمة"
                  className="w-full px-3 py-3 rounded-xl border border-cream-200 bg-cream-50 text-sm"
                />
                <input
                  type="tel"
                  value={form.recipient_phone}
                  onChange={(e) => setForm({ ...form, recipient_phone: e.target.value })}
                  placeholder="جوالها (ترسلي لها الكود بنفسكِ)"
                  className="w-full px-3 py-3 rounded-xl border border-cream-200 bg-cream-50 text-sm font-en-display"
                />
                <textarea
                  rows={2}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="رسالة شخصية (تظهر على البطاقة)"
                  maxLength={300}
                  className="w-full px-3 py-3 rounded-xl border border-cream-200 bg-cream-50 text-sm resize-none"
                />
              </div>
            </div>

            <button
              onClick={submit}
              disabled={busy}
              className="btn-primary w-full !py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Gift className="w-5 h-5" />}
              شراء البطاقة ({form.customAmount || form.amount} ر.س)
            </button>

            <p className="text-[10px] text-ink-soft text-center">
              📱 ستتواصل معكِ المالكة لتأكيد الدفع وتفعيل البطاقة
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
