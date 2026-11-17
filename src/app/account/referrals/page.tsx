/**
 * /account/referrals — صفحة الإحالة (إدعي صديقاتك)
 */
'use client';

import { useState, useEffect } from 'react';
import { Share2, Gift, Users, Wallet, Copy, Check, Loader2, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Data {
  code: string;
  walletBalance: number;
  stats: { pending: number; joined: number; completed: number; totalEarned: number };
  referrals: any[];
  shareUrl: string;
  whatsappMessage: string;
}

export default function ReferralsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/referrals')
      .then((r) => r.json())
      .then((d) => d.ok && setData(d))
      .finally(() => setLoading(false));
  }, []);

  function copyCode() {
    if (!data) return;
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    toast.success('تمّ نسخ الكود');
    setTimeout(() => setCopied(false), 2000);
  }

  function share() {
    if (!data) return;
    if (navigator.share) {
      navigator.share({
        title: 'السيّدة الأولى',
        text: data.whatsappMessage,
        url: data.shareUrl,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(data.whatsappMessage);
      toast.success('تمّ نسخ الرسالة');
    }
  }

  function shareWhatsapp() {
    if (!data) return;
    const url = `https://wa.me/?text=${encodeURIComponent(data.whatsappMessage)}`;
    window.open(url, '_blank');
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold-deep" /></div>;
  }
  if (!data) {
    return <div className="p-8 text-center">فشل التحميل</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-4 pb-32">
      {/* Header */}
      <div className="text-center mb-6 mt-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gold-light/30 to-rose-soft/30 flex items-center justify-center mb-3">
          <Gift className="w-8 h-8 text-gold-deep" />
        </div>
        <h1 className="font-ar-display text-2xl font-bold text-gold-deep">ادعي صديقاتكِ</h1>
        <p className="text-ink-soft text-sm mt-1">اربحي 100 ريال عن كل صديقة · وهنّ يحصلن 15% خصم</p>
      </div>

      {/* الرصيد */}
      <div className="bg-gradient-to-br from-gold-deep to-gold-light rounded-3xl p-6 text-white mb-5 shadow-lg">
        <div className="flex items-center gap-2 mb-2 opacity-90">
          <Wallet className="w-4 h-4" />
          <span className="text-xs font-bold">رصيد محفظتكِ</span>
        </div>
        <div className="font-en-display text-4xl font-bold">
          {data.walletBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })} <span className="text-lg">ريال</span>
        </div>
        <p className="text-[11px] opacity-80 mt-2">يُستخدم تلقائياً خصماً على فاتورتكِ القادمة</p>
      </div>

      {/* الكود */}
      <div className="bg-white rounded-3xl p-6 border border-cream-200 mb-5 shadow-sm text-center">
        <div className="text-[11px] text-ink-soft font-bold mb-2">كودكِ الشخصي</div>
        <div className="font-en-display text-3xl font-bold text-gold-deep tracking-widest mb-4">{data.code}</div>

        <div className="flex gap-2">
          <button onClick={copyCode} className="flex-1 bg-cream-100 hover:bg-cream-200 text-ink-soft py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold">
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            نسخ
          </button>
          <button onClick={shareWhatsapp} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold">
            <MessageCircle className="w-4 h-4" />
            واتساب
          </button>
          <button onClick={share} className="flex-1 bg-gold-deep hover:bg-gold-light text-white py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold">
            <Share2 className="w-4 h-4" />
            مشاركة
          </button>
        </div>
      </div>

      {/* الإحصائيّات */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <Stat value={data.stats.pending + data.stats.joined} label="بانتظار الزيارة" color="amber" />
        <Stat value={data.stats.completed} label="أكملن" color="emerald" />
        <Stat value={data.stats.totalEarned} label="إجمالي ربحتِ" color="gold" />
      </div>

      {/* كيف تعمل؟ */}
      <div className="bg-white rounded-3xl p-5 border border-cream-200 mb-5">
        <h3 className="font-bold text-sm text-gold-deep mb-3">كيف تعمل؟</h3>
        <ol className="space-y-3 text-xs">
          <Step n={1} text="شاركي كودكِ مع صديقاتكِ" />
          <Step n={2} text="تسجّل صديقتكِ بالكود · تحصل خصم 15% أوّل حجز" />
          <Step n={3} text="بعد ما تُكمل زيارتها · ندفع لكِ 100 ريال في محفظتكِ" />
          <Step n={4} text="تستخدمين الرصيد تلقائياً في فاتورتكِ القادمة" />
        </ol>
      </div>

      {/* قائمة الإحالات */}
      {data.referrals.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-cream-200">
          <h3 className="font-bold text-sm text-gold-deep mb-3">إحالاتكِ ({data.referrals.length})</h3>
          <div className="space-y-2">
            {data.referrals.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-cream-100 last:border-0">
                <div className="text-xs text-ink">
                  {r.referred_phone || r.referred_email || 'ضيفة'}
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: 'amber' | 'emerald' | 'gold' }) {
  const colors = {
    amber: 'from-amber-100 to-amber-50 text-amber-700',
    emerald: 'from-emerald-100 to-emerald-50 text-emerald-700',
    gold: 'from-gold-light/30 to-cream-100 text-gold-deep',
  }[color];
  return (
    <div className={`bg-gradient-to-br ${colors} rounded-2xl p-3 text-center border border-cream-200`}>
      <div className="font-en-display text-xl font-bold">{value}</div>
      <div className="text-[10px] font-semibold mt-1">{label}</div>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex gap-2.5">
      <span className="w-5 h-5 rounded-full bg-gold-deep text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">{n}</span>
      <span className="text-ink-soft leading-relaxed">{text}</span>
    </li>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: 'بانتظار الانضمام', color: 'bg-amber-100 text-amber-700' },
    joined: { label: 'انضمّت', color: 'bg-blue-100 text-blue-700' },
    completed_first_booking: { label: 'أكملت الزيارة', color: 'bg-emerald-100 text-emerald-700' },
    rewarded: { label: '✓ مكافأة', color: 'bg-gold-light/30 text-gold-deep' },
    expired: { label: 'منتهية', color: 'bg-slate-100 text-slate-600' },
  };
  const s = map[status] || { label: status, color: 'bg-slate-100' };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>;
}
