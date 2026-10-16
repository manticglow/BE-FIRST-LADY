/**
 * ReferralCard — بطاقة برنامج الإحالة
 */
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Copy, Share2, Check, MessageCircle, Users, Gift } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface Props {
  code: string;
  credit: number;
  referrals: { full_name: string; created_at: string }[];
  siteUrl: string;
}

export default function ReferralCard({ code, credit, referrals, siteUrl }: Props) {
  const [copied, setCopied] = useState(false);
  const link = `${siteUrl}/signup?ref=${code}`;
  const message = `أهلاً 💛\n\nأدعوكِ لتجربة Be First Lady — سبا وصالون فاخر في المدينة المنوّرة.\n\nاستخدمي كودي ${code} عند التسجيل وبتحصلين على 50 ر.س هدية 🌸\n\n${link}`;

  function copy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('تم نسخ الرابط');
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Be First Lady', text: message, url: link });
      } catch {}
    } else {
      copy();
    }
  }

  return (
    <div className="space-y-5">
      {/* بطاقة الكود الفاخرة */}
      <div className="bg-gradient-to-br from-gold-deep via-gold to-gold-deep text-cream-50 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-cream-50/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-56 h-56 bg-cream-50/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="font-en-label text-[10px] tracking-[0.4em] opacity-80 mb-2">
            YOUR REFERRAL CODE
          </div>
          <div className="text-xs opacity-80 mb-6">كود الإحالة الخاص بكِ</div>

          <div className="bg-cream-50/15 backdrop-blur border border-cream-50/30 rounded-2xl p-5 mb-6">
            <div className="font-en-display text-4xl font-bold tracking-widest text-center">
              {code}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={copy}
              className="flex flex-col items-center gap-1 py-3 bg-cream-50/15 hover:bg-cream-50/25 rounded-xl transition-colors"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              <span className="text-[10px] font-bold">نسخ الرابط</span>
            </button>
            <button
              onClick={shareWhatsapp}
              className="flex flex-col items-center gap-1 py-3 bg-success/80 hover:bg-success rounded-xl transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-[10px] font-bold">واتساب</span>
            </button>
            <button
              onClick={nativeShare}
              className="flex flex-col items-center gap-1 py-3 bg-cream-50/15 hover:bg-cream-50/25 rounded-xl transition-colors"
            >
              <Share2 className="w-5 h-5" />
              <span className="text-[10px] font-bold">مشاركة</span>
            </button>
          </div>
        </div>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-cream-200">
          <div className="flex items-center gap-2 text-xs text-ink-soft mb-2">
            <Users className="w-4 h-4 text-gold-deep" />
            صديقاتكِ المنضمات
          </div>
          <div className="font-en-display text-3xl font-bold text-ink">{referrals.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-cream-200">
          <div className="flex items-center gap-2 text-xs text-ink-soft mb-2">
            <Gift className="w-4 h-4 text-gold-deep" />
            رصيدكِ من الإحالة
          </div>
          <div className="font-en-display text-3xl font-bold text-gold-deep">{formatPrice(credit)}</div>
        </div>
      </div>

      {/* كيف يشتغل */}
      <div className="bg-white rounded-2xl p-5 border border-cream-200">
        <h3 className="font-ar-display font-bold text-gold-deep mb-3">كيف تعمل الإحالة؟</h3>
        <ol className="space-y-3 text-sm text-ink">
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-gold-deep text-cream-50 flex items-center justify-center font-bold shrink-0 text-xs">1</span>
            <div>شاركي كودكِ أو الرابط مع صديقاتكِ</div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-gold-deep text-cream-50 flex items-center justify-center font-bold shrink-0 text-xs">2</span>
            <div>تسجّل صديقتكِ باستخدام الكود</div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-gold-deep text-cream-50 flex items-center justify-center font-bold shrink-0 text-xs">3</span>
            <div>لمّا تحجز أول موعد تدفعه، تحصلين على <strong className="text-gold-deep">50 ر.س</strong> رصيد — ولها <strong className="text-gold-deep">50 ر.س</strong> خصم 🎁</div>
          </li>
        </ol>
      </div>

      {/* قائمة الصديقات */}
      {referrals.length > 0 && (
        <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-cream-200 bg-cream-50">
            <h3 className="font-ar-display font-bold text-gold-deep">صديقاتكِ ({referrals.length})</h3>
          </div>
          <ul className="divide-y divide-cream-100">
            {referrals.map((r, i) => (
              <li key={i} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gold-light/20 text-gold-deep flex items-center justify-center font-bold text-sm">
                    {r.full_name.charAt(0)}
                  </div>
                  <span className="text-sm text-ink">{r.full_name}</span>
                </div>
                <span className="text-xs text-ink-soft font-en-display">
                  {new Date(r.created_at).toLocaleDateString('en-GB')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
