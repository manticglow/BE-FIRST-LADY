/**
 * RedeemGiftCard — واجهة استخدام البطاقة في المحل
 * ═══════════════════════════════════════════════════════════
 * - إدخال الكود يدوياً
 * - أو مسح QR (باستخدام كاميرا الجوال)
 * - عرض تفاصيل البطاقة قبل التأكيد
 * - زر استخدام بالكامل أو جزئي
 */
'use client';

import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import {
  QrCode, ScanLine, Loader2, CheckCircle2, AlertCircle,
  Gift, User, Calendar, Sparkles, X, Camera, Keyboard,
  CircleDollarSign, Trash2,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface CardPreview {
  code: string;
  recipient_name: string;
  initial_amount: number;
  balance: number;
  expires_at: string | null;
  is_active: boolean;
  design: string;
}

export default function RedeemGiftCard({ initialCode }: { initialCode?: string }) {
  const [mode, setMode] = useState<'input' | 'scanner'>('input');
  const [code, setCode] = useState(initialCode || '');
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState<CardPreview | null>(null);
  const [redeemMode, setRedeemMode] = useState<'full' | 'partial'>('full');
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<any>(null);

  // لو جات بـinitialCode من الـURL · افحصي البطاقة تلقائي
  useEffect(() => {
    if (initialCode) fetchCard(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCode]);

  // جلب تفاصيل البطاقة قبل الاستخدام (preview)
  async function fetchCard(codeValue: string) {
    const cleanCode = codeValue.trim().toUpperCase();
    if (!cleanCode) return;
    setLoading(true);
    setCard(null);
    setResult(null);
    try {
      const res = await fetch(`/api/gift-cards?code=${encodeURIComponent(cleanCode)}`);
      const data = await res.json();
      if (!res.ok || !data.card) {
        toast.error(data.error || '❌ البطاقة غير موجودة');
        return;
      }
      const c = data.card;
      setCard({
        code: c.code,
        recipient_name: c.recipient_name || 'بطاقة',
        initial_amount: Number(c.initial_amount),
        balance: Number(c.balance),
        expires_at: c.expires_at,
        is_active: c.is_active,
        design: c.design || 'gold',
      });
      setPartialAmount(Number(c.balance));
    } catch {
      toast.error('خطأ في الاتصال');
    } finally { setLoading(false); }
  }

  // تنفيذ الاستخدام
  async function redeem() {
    if (!card) return;
    setConfirming(true);
    try {
      const res = await fetch('/api/admin/gift-cards/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: card.code,
          mode: redeemMode,
          amount: redeemMode === 'partial' ? partialAmount : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'فشل الاستخدام');
        return;
      }
      toast.success(data.message);
      setResult(data);
    } catch {
      toast.error('خطأ في الاتصال');
    } finally { setConfirming(false); }
  }

  function reset() {
    setCode('');
    setCard(null);
    setResult(null);
    setRedeemMode('full');
    setPartialAmount(0);
  }

  const isExpired = card?.expires_at && new Date(card.expires_at) < new Date();
  const isUsable = card?.is_active && !isExpired && card.balance > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ═══ شريط اختيار الطريقة ═══ */}
      {!card && !result && (
        <div className="bg-white rounded-3xl border border-cream-200 p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-2 bg-cream-100 p-1 rounded-xl mb-5">
            <button
              onClick={() => setMode('input')}
              className={`py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'input' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'
              }`}
            >
              <Keyboard className="w-4 h-4" />
              إدخال يدوي
            </button>
            <button
              onClick={() => setMode('scanner')}
              className={`py-2.5 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'scanner' ? 'bg-white text-ink shadow-sm' : 'text-ink-soft'
              }`}
            >
              <ScanLine className="w-4 h-4" />
              مسح QR
            </button>
          </div>

          {mode === 'input' ? (
            <div>
              <label className="block text-xs font-bold text-ink-soft mb-2 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5" />
                كود البطاقة
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') fetchCard(code); }}
                  placeholder="GC-XXXXXXXX"
                  autoFocus
                  dir="ltr"
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-cream-200 focus:border-gold-deep outline-none font-en-display font-bold text-center text-xl tracking-wider"
                />
                <button
                  onClick={() => fetchCard(code)}
                  disabled={!code.trim() || loading}
                  className="px-6 py-3 bg-gradient-to-br from-gold-deep to-ink text-cream-50 rounded-xl font-bold disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'فحص'}
                </button>
              </div>
              <p className="text-[11px] text-ink-soft mt-2">
                اطلبي من العميلة الكود (مثلاً: GC-XK8D9M2P) · أو امسحي QR
              </p>
            </div>
          ) : (
            <QrScannerPanel onDetected={(c) => { setCode(c); fetchCard(c); setMode('input'); }} />
          )}
        </div>
      )}

      {/* ═══ معاينة البطاقة قبل الاستخدام ═══ */}
      {card && !result && (
        <div className="space-y-4">

          <CardDisplay card={card} />

          {!isUsable ? (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-rose-900 text-sm mb-1">
                  🚫 لا يمكن استخدام هذه البطاقة
                </div>
                <div className="text-xs text-rose-800">
                  {!card.is_active && 'البطاقة مُعطّلة · '}
                  {isExpired && 'البطاقة منتهيّة الصلاحيّة · '}
                  {card.balance <= 0 && 'لا يوجد رصيد متبقّي'}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* اختيار نمط الاستخدام */}
              <div className="bg-white rounded-2xl border border-cream-200 p-4 space-y-3">
                <div className="text-xs font-bold text-ink-soft">طريقة الاستخدام:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setRedeemMode('full')}
                    className={`py-3 rounded-xl font-bold text-sm transition-colors border-2 ${
                      redeemMode === 'full'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-cream-50 text-ink-soft border-cream-200'
                    }`}
                  >
                    🔥 استخدام كامل
                    <div className="text-[10px] mt-0.5 opacity-70">البطاقة تنتهي</div>
                  </button>
                  <button
                    onClick={() => setRedeemMode('partial')}
                    className={`py-3 rounded-xl font-bold text-sm transition-colors border-2 ${
                      redeemMode === 'partial'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-cream-50 text-ink-soft border-cream-200'
                    }`}
                  >
                    💰 جزئي
                    <div className="text-[10px] mt-0.5 opacity-70">يبقى رصيد</div>
                  </button>
                </div>

                {redeemMode === 'partial' && (
                  <div>
                    <label className="block text-xs font-bold text-ink-soft mb-1.5">
                      المبلغ المستخدم (من {card.balance} ر.س)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={card.balance}
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(Math.min(card.balance, Number(e.target.value) || 0))}
                      className="w-full px-4 py-3 rounded-xl border border-cream-200 focus:border-gold-deep outline-none font-en-display text-center text-lg font-bold text-gold-deep"
                    />
                    <div className="text-[11px] text-ink-soft mt-1">
                      الرصيد المتبقّي بعد الاستخدام: <strong className="text-emerald-700">{card.balance - partialAmount} ر.س</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* أزرار الإجراء */}
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="px-4 py-3 rounded-xl bg-cream-100 text-ink font-bold text-sm hover:bg-cream-200 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  إلغاء
                </button>
                <button
                  onClick={redeem}
                  disabled={confirming || (redeemMode === 'partial' && partialAmount <= 0)}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50 font-ar-display font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] transition-transform"
                >
                  {confirming ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                  {confirming
                    ? 'جارِ الاستخدام...'
                    : `تأكيد الاستخدام · ${redeemMode === 'full' ? card.balance : partialAmount} ر.س`}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ نتيجة الاستخدام ═══ */}
      {result && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl p-8 text-center shadow-xl">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="font-ar-display text-2xl font-bold mb-2">
              تمّ الاستخدام بنجاح ✨
            </h3>
            <p className="text-sm opacity-90 mb-5">{result.message}</p>

            <div className="grid grid-cols-2 gap-3 bg-white/15 backdrop-blur-sm rounded-2xl p-4">
              <div>
                <div className="text-[10px] opacity-80 mb-1">المستخدم</div>
                <div className="font-en-display font-bold text-2xl">{result.amount_used} ر.س</div>
              </div>
              <div>
                <div className="text-[10px] opacity-80 mb-1">الرصيد المتبقّي</div>
                <div className="font-en-display font-bold text-2xl">{result.balance_after} ر.س</div>
              </div>
            </div>

            <div className="mt-4 text-xs opacity-80">
              الكود: <span className="font-en-display font-bold">{result.code}</span>
              {' · '}
              {result.status === 'fully_used' ? '🏁 البطاقة انتهت' : '✅ البطاقة لسه فعّالة'}
            </div>
          </div>

          <button
            onClick={reset}
            className="w-full py-3 rounded-xl bg-gradient-to-br from-gold-deep to-ink text-cream-50 font-ar-display font-bold flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform"
          >
            <ScanLine className="w-5 h-5" />
            بطاقة جديدة
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

function CardDisplay({ card }: { card: CardPreview }) {
  const gradients: Record<string, string> = {
    gold: 'from-gold-deep via-ink to-gold-deep',
    pink: 'from-rose-400 via-pink-500 to-rose-600',
    floral: 'from-purple-500 via-pink-500 to-rose-500',
  };
  const bg = gradients[card.design] || gradients.gold;
  const usedPercent = Math.round(((card.initial_amount - card.balance) / card.initial_amount) * 100);
  const isExpired = card.expires_at && new Date(card.expires_at) < new Date();
  const isUsable = card.is_active && !isExpired && card.balance > 0;

  return (
    <div className={`relative bg-gradient-to-br ${bg} text-cream-50 rounded-3xl p-6 shadow-xl overflow-hidden ${
      !isUsable ? 'opacity-60' : ''
    }`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/15 rounded-full blur-2xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className="editorial-eyebrow text-cream-50/70">GIFT CARD</div>
          <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isUsable ? 'bg-emerald-500/80' : 'bg-rose-500/80'
          }`}>
            {isUsable ? '✓ فعّالة' : '✗ غير متاحة'}
          </div>
        </div>

        <div className="text-xs opacity-80">المستلمة</div>
        <div className="font-ar-display text-lg font-bold mb-3">{card.recipient_name}</div>

        {/* الرصيد المرئي */}
        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 mb-3">
          <div className="flex items-end justify-between gap-3 mb-2">
            <div>
              <div className="text-[10px] opacity-80">الرصيد المتبقّي</div>
              <div className="font-en-display font-bold text-3xl leading-none">
                {formatPrice(card.balance, { showFrom: false })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] opacity-80">القيمة الأصليّة</div>
              <div className="font-en-display text-sm opacity-80">
                {formatPrice(card.initial_amount, { showFrom: false })}
              </div>
            </div>
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full"
              style={{ width: `${100 - usedPercent}%` }}
            />
          </div>
          <div className="text-[10px] opacity-70 mt-1">
            {usedPercent > 0 && `مستخدم ${usedPercent}%`}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="font-en-display font-bold tracking-wider">{card.code}</div>
          {card.expires_at && (
            <div className={isExpired ? 'text-rose-200 font-bold' : 'opacity-70'}>
              {isExpired ? 'منتهية' : `تنتهي: ${new Date(card.expires_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QrScannerPanel({ onDetected }: { onDetected: (code: string) => void }) {
  return (
    <div className="text-center py-6">
      <div className="w-20 h-20 mx-auto mb-4 bg-gold-light/15 rounded-full flex items-center justify-center">
        <Camera className="w-10 h-10 text-gold-deep" />
      </div>
      <h3 className="font-bold text-ink mb-2">مسح QR</h3>
      <p className="text-xs text-ink-soft mb-4 max-w-xs mx-auto">
        استخدمي كاميرا جوالكِ لمسح QR من البطاقة · أو ارجعي للإدخال اليدوي
      </p>

      {/* زر فتح كاميرا الجوال (استخدام native) */}
      <label className="inline-block cursor-pointer">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            // 💡 الحل البسيط: نترك المستخدم يصوّر الباركود وتستخدم مكتبة قراءة
            // لكن في الوقت الحالي · نرجع للإدخال اليدوي
            toast('💡 اقرأي الكود واكتبيه يدوياً');
          }}
        />
        <span className="inline-flex items-center gap-2 bg-gold-deep text-cream-50 font-bold px-5 py-2.5 rounded-xl text-sm">
          <Camera className="w-4 h-4" />
          افتحي الكاميرا
        </span>
      </label>

      <p className="text-[10px] text-ink-soft mt-3">
        💡 لمسح QR مباشر · ننصح بتطبيق كاميرا الجوال (يفتح الكود تلقائياً)
      </p>
    </div>
  );
}
