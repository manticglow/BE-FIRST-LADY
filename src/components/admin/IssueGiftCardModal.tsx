/**
 * IssueGiftCardModal — إصدار بطاقة هديّة يدوياً + إرسال واتساب
 * ═══════════════════════════════════════════════════════════
 * خطوتان:
 *   1. إدخال البيانات (المبلغ · المستلمة · الرسالة)
 *   2. عرض البطاقة (كود + QR + زر واتساب)
 */
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  X, User, Phone, Gift, Loader2, CheckCircle2,
  Copy, MessageCircle, Download, Calendar, Sparkles,
} from 'lucide-react';
import { waLink, formatPrice } from '@/lib/utils';
import GiftCardPreview from './GiftCardPreview';

interface IssuedCard {
  id: string;
  code: string;
  amount: number;
  recipient_name: string;
  recipient_phone: string;
  message: string | null;
  design: string;
  expires_at: string | null;
}

interface Props {
  onClose: () => void;
  onIssued?: () => void;
}

const DESIGNS = [
  { value: 'gold',   label: 'ذهبي كلاسيك', bg: 'from-gold-deep via-ink to-gold-deep' },
  { value: 'pink',   label: 'ورديّ ناعم',  bg: 'from-rose-400 via-pink-500 to-rose-600' },
  { value: 'floral', label: 'زهريّ',        bg: 'from-purple-500 via-pink-500 to-rose-500' },
] as const;

const EXPIRY_OPTIONS = [
  { value: 90,  label: '3 أشهر' },
  { value: 180, label: '6 أشهر' },
  { value: 365, label: 'سنة' },
  { value: 730, label: 'سنتين' },
  { value: 0,   label: 'ما تنتهي' },
];

const QUICK_AMOUNTS = [100, 200, 300, 500, 1000, 2000];

export default function IssueGiftCardModal({ onClose, onIssued }: Props) {
  const [step, setStep] = useState<'form' | 'issued'>('form');
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState<number>(300);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [message, setMessage] = useState('');
  const [design, setDesign] = useState<'gold' | 'pink' | 'floral'>('gold');
  const [expiresDays, setExpiresDays] = useState(365);
  const [purchaser, setPurchaser] = useState('');  // اختياري · من دفع

  const [issuedCard, setIssuedCard] = useState<IssuedCard | null>(null);

  async function submit() {
    if (recipientName.trim().length < 2) { toast.error('اسم المستلمة مطلوب'); return; }
    if (!/^0?5\d{8}$/.test(recipientPhone.replace(/\s/g, ''))) {
      toast.error('رقم جوال غير صحيح'); return;
    }
    if (amount < 10) { toast.error('أقل مبلغ 10 ر.س'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/gift-cards/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          recipient_name: recipientName.trim(),
          recipient_phone: recipientPhone.replace(/\s/g, ''),
          message: message || null,
          design,
          expires_days: expiresDays,
          purchaser_name: purchaser || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'فشل الإصدار');
        return;
      }
      toast.success('🎁 البطاقة جاهزة');
      setIssuedCard(data.card);
      setStep('issued');
      onIssued?.();
    } catch {
      toast.error('خطأ في الاتصال');
    } finally { setSubmitting(false); }
  }

  function copyCode() {
    if (!issuedCard) return;
    navigator.clipboard.writeText(issuedCard.code);
    toast.success('نُسخ الكود');
  }

  function sendWhatsApp() {
    if (!issuedCard) return;
    const text = buildWhatsAppMessage(issuedCard);
    const url = waLink(text, issuedCard.recipient_phone);
    window.open(url, '_blank');
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in max-h-[95vh] flex flex-col">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50 p-5 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="editorial-eyebrow text-gold-light/80 mb-1">GIFT CARD</div>
          <h2 className="font-ar-display text-xl md:text-2xl font-bold flex items-center gap-2">
            <Gift className="w-6 h-6" />
            {step === 'form' ? 'إصدار بطاقة هديّة جديدة' : 'البطاقة جاهزة ✨'}
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {step === 'form' ? (
            <>
              {/* ─── المبلغ ─── */}
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-2">قيمة البطاقة</label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {QUICK_AMOUNTS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAmount(a)}
                      className={`py-2.5 rounded-xl font-bold font-en-display text-sm border-2 transition-all ${
                        amount === a
                          ? 'bg-gold-deep text-cream-50 border-gold-deep'
                          : 'bg-cream-50 text-ink-soft border-cream-200 hover:border-gold-light'
                      }`}
                    >
                      {a} ر.س
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="10"
                  max="20000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  placeholder="أو مبلغ محدّد"
                  className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-gold-deep outline-none font-en-display text-center text-xl font-bold text-gold-deep"
                />
              </div>

              {/* ─── المستلمة ─── */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">
                    <User className="w-3.5 h-3.5 inline ml-1" />
                    اسم المستلمة *
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="مثال: نورة الزهراني"
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:border-gold-deep outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">
                    <Phone className="w-3.5 h-3.5 inline ml-1" />
                    جوال المستلمة *
                  </label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:border-gold-deep outline-none font-en-display text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">
                    رسالة شخصيّة (اختياري)
                  </label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="مثلاً · كل عام وأنتِ بخير..."
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:border-gold-deep outline-none text-sm resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-soft mb-1.5">
                    اسم المشترية (اختياري · من دفع)
                  </label>
                  <input
                    type="text"
                    value={purchaser}
                    onChange={(e) => setPurchaser(e.target.value)}
                    placeholder="اتركيه فارغ لو مجّانيّة من الصالون"
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:border-gold-deep outline-none text-sm"
                  />
                </div>
              </div>

              {/* ─── التصميم ─── */}
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-2">التصميم</label>
                <div className="grid grid-cols-3 gap-2">
                  {DESIGNS.map((d) => (
                    <button
                      key={d.value}
                      onClick={() => setDesign(d.value as any)}
                      className={`relative aspect-[3/2] rounded-xl bg-gradient-to-br ${d.bg} overflow-hidden transition-all ${
                        design === d.value ? 'ring-2 ring-gold-deep ring-offset-2' : ''
                      }`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">
                        {d.label}
                      </div>
                      {design === d.value && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                          <CheckCircle2 className="w-4 h-4 text-gold-deep" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─── الصلاحيّة ─── */}
              <div>
                <label className="block text-xs font-bold text-ink-soft mb-2">
                  <Calendar className="w-3.5 h-3.5 inline ml-1" />
                  صلاحيّة البطاقة
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {EXPIRY_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setExpiresDays(o.value)}
                      className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                        expiresDays === o.value
                          ? 'bg-gold-deep text-cream-50 border-gold-deep'
                          : 'bg-cream-50 text-ink-soft border-cream-200'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : issuedCard && (
            <IssuedCardView card={issuedCard} />
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cream-200 bg-cream-50/50 shrink-0 flex items-center gap-2">
          {step === 'form' ? (
            <button
              onClick={submit}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50 font-ar-display font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] transition-transform"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Gift className="w-5 h-5" />}
              {submitting ? 'جارِ الإصدار...' : 'إصدار البطاقة'}
            </button>
          ) : (
            <>
              <button
                onClick={copyCode}
                className="px-4 py-3 rounded-xl bg-cream-100 text-ink font-bold text-sm hover:bg-cream-200 transition-colors flex items-center gap-1.5"
              >
                <Copy className="w-4 h-4" />
                نسخ
              </button>
              <button
                onClick={sendWhatsApp}
                className="flex-1 py-3 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white font-ar-display font-bold text-base flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform"
              >
                <MessageCircle className="w-5 h-5" />
                أرسلي عبر واتساب
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

function IssuedCardView({ card }: { card: IssuedCard }) {
  return (
    <div className="space-y-4">
      <GiftCardPreview
        card={{
          code: card.code,
          amount: card.amount,
          recipient_name: card.recipient_name,
          recipient_phone: card.recipient_phone,
          message: card.message,
          design: card.design as 'gold' | 'pink' | 'floral',
          expires_at: card.expires_at,
        }}
      />

      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 text-[11px] text-stone-700">
        <div className="font-bold mb-1 text-stone-900">💡 تنبيه:</div>
        احفظي ملف PNG أو PDF أول · ثم أرفقيه مع رسالة الواتساب حتى تصل العميلة
        بتصميم فاخر بدل الكود فقط.
      </div>
    </div>
  );
}

/* ═══ Helpers ═══ */

function buildQrCodeUrl(code: string): string {
  // استخدام خدمة QR مجّانيّة · ما تحتاج مكتبة
  const data = encodeURIComponent(code);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${data}&margin=0&bgcolor=ffffff&color=000000`;
}

function buildWhatsAppMessage(card: IssuedCard): string {
  const expiryLine = card.expires_at
    ? `📅 صالحة حتى: ${new Date(card.expires_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}`
    : '';

  return `🎁 *هديّتكِ من Be First Lady*

مرحباً ${card.recipient_name} 💛

تم إصدار بطاقة هديّة لكِ بقيمة:
💰 *${card.amount} ر.س*

🔖 كود البطاقة:
*${card.code}*

${card.message ? `💌 رسالة شخصيّة:\n"${card.message}"\n` : ''}
${expiryLine}

✨ استخدمي الكود عند أي حجز في المركز · أو ذكريه عند الاستقبال.

نتشرّف باستقبالكِ 🌸
Be First Lady · المدينة المنوّرة`;
}
