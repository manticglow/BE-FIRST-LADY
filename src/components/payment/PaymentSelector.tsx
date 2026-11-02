'use client';

/**
 * PaymentSelector — اختيار طريقة الدفع للعميلة
 * ═══════════════════════════════════════════════════════════
 * - 3 بوّابات (موياسر · تابي · تمارا)
 * - خيار العربون (deposit)
 * - صرف نقاط الولاء
 * - استخدام بطاقة هديّة
 * - عرض ملخّص الحساب لحظيّاً
 */
import { useState, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import {
  CreditCard, Smartphone, Wallet, Gift, Star, Loader2,
  CheckCircle2, Info, Clock, TrendingDown, ChevronLeft,
} from 'lucide-react';

export interface PaymentOptions {
  bookingId: string;
  totalAmount: number;
  loyaltyPointsAvailable: number;
  loyaltyPointValue: number;    // 0.10 = 1 نقطة = 10 هللة
  depositEnabled: boolean;      // هل العربون متاح
  depositPct: number;           // 25% عادةً
  depositThreshold: number;     // ما يظهر إلا لو الحجز ≥ هذا
  gateways: {
    moyasar: boolean;
    tabby: boolean;
    tamara: boolean;
  };
}

export default function PaymentSelector({ opts }: { opts: PaymentOptions }) {
  const [gateway, setGateway] = useState<'moyasar' | 'tabby' | 'tamara' | null>(null);
  const [depositOnly, setDepositOnly] = useState(false);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [giftCode, setGiftCode] = useState('');
  const [giftValid, setGiftValid] = useState<{ amount: number } | null>(null);
  const [checkingGift, setCheckingGift] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canDeposit = opts.depositEnabled && opts.totalAmount >= opts.depositThreshold;

  // ─── الحسابات ───
  const loyaltyDiscount = loyaltyPoints * opts.loyaltyPointValue;
  const giftDiscount = giftValid?.amount || 0;
  const totalDiscount = loyaltyDiscount + giftDiscount;
  const afterDiscount = Math.max(0, opts.totalAmount - totalDiscount);
  const payableNow = depositOnly && canDeposit
    ? Math.round(afterDiscount * (opts.depositPct / 100) * 100) / 100
    : afterDiscount;

  const isFree = payableNow <= 0;

  // ─── التحقّق من بطاقة الهديّة ───
  async function validateGift() {
    if (!giftCode.trim()) {
      setGiftValid(null);
      return;
    }
    setCheckingGift(true);
    try {
      const res = await fetch(`/api/gift-cards?code=${encodeURIComponent(giftCode.trim())}`);
      const data = await res.json();
      if (data?.ok && data.card?.is_active && Number(data.card.balance) > 0) {
        const usable = Math.min(Number(data.card.balance), opts.totalAmount);
        setGiftValid({ amount: usable });
        toast.success(`✅ البطاقة صالحة · ${usable} ر.س`);
      } else {
        setGiftValid(null);
        toast.error('البطاقة غير صالحة');
      }
    } catch {
      setGiftValid(null);
      toast.error('خطأ في فحص البطاقة');
    } finally { setCheckingGift(false); }
  }

  // ─── الـeligible gateways حسب المبلغ ───
  const tabbyEligible = payableNow >= 300 && payableNow <= 30000;
  const tamaraEligible = payableNow >= 100 && payableNow <= 15000;

  async function proceed() {
    if (isFree) {
      // دفع صفري · ما نحتاج gateway
      await submitPayment('moyasar'); // أي gateway · ما تهم
      return;
    }
    if (!gateway) {
      toast.error('اختاري طريقة الدفع');
      return;
    }
    await submitPayment(gateway);
  }

  async function submitPayment(gw: 'moyasar' | 'tabby' | 'tamara') {
    setSubmitting(true);
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: opts.bookingId,
          gateway: gw,
          deposit_only: depositOnly && canDeposit,
          loyalty_points_used: loyaltyPoints,
          gift_card_code: giftValid ? giftCode.trim().toUpperCase() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'فشل الدفع');
        return;
      }
      if (data.free) {
        toast.success('🎉 الحجز مؤكّد · تمّت تغطيّة المبلغ بالكامل');
        // redirect for success
        setTimeout(() => window.location.reload(), 1500);
        return;
      }
      if (data.checkout_url) {
        toast.success('جارِ تحويلك إلى بوّابة الدفع...');
        window.location.href = data.checkout_url;
      }
    } catch (e) {
      toast.error('خطأ في الاتصال');
    } finally { setSubmitting(false); }
  }

  return (
    <div className="space-y-5">

      {/* ─── Hero: المبلغ ─── */}
      <div className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 rounded-3xl p-5 md:p-6 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="editorial-eyebrow text-white/60 mb-1">TOTAL DUE</div>
          <div className="text-xs opacity-70">المطلوب دفعه الآن</div>
          <div className="flex items-end gap-2 mt-2">
            <div className="font-en-display font-bold text-5xl leading-none">
              {payableNow.toLocaleString('ar-SA', { maximumFractionDigits: 2 })}
            </div>
            <div className="font-en-display opacity-80 text-sm mb-1">ر.س</div>
          </div>
          {totalDiscount > 0 && (
            <div className="mt-3 pt-3 border-t border-white/15 text-[11px] opacity-80 space-y-0.5">
              <div className="flex justify-between">
                <span>قيمة الحجز الأصليّة</span>
                <span className="font-en-display">{opts.totalAmount.toFixed(2)} ر.س</span>
              </div>
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-emerald-300">
                  <span>- نقاط ولاء ({loyaltyPoints} نقطة)</span>
                  <span className="font-en-display">-{loyaltyDiscount.toFixed(2)}</span>
                </div>
              )}
              {giftDiscount > 0 && (
                <div className="flex justify-between text-emerald-300">
                  <span>- بطاقة هديّة</span>
                  <span className="font-en-display">-{giftDiscount.toFixed(2)}</span>
                </div>
              )}
              {depositOnly && canDeposit && (
                <div className="flex justify-between text-amber-300">
                  <span>عربون {opts.depositPct}%</span>
                  <span className="font-en-display">
                    (الباقي {(afterDiscount - payableNow).toFixed(2)} في الصالون)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── خيار العربون ─── */}
      {canDeposit && (
        <label className="flex items-start gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl cursor-pointer hover:bg-amber-100/50 transition-colors">
          <input
            type="checkbox"
            checked={depositOnly}
            onChange={(e) => setDepositOnly(e.target.checked)}
            className="w-5 h-5 mt-0.5 accent-amber-600"
          />
          <div className="flex-1">
            <div className="font-bold text-amber-900 text-sm flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              ادفعي عربون {opts.depositPct}% فقط
            </div>
            <div className="text-xs text-amber-700 mt-1">
              احجزي موعدك بـ{Math.round(opts.totalAmount * opts.depositPct / 100)} ر.س فقط
              والباقي ادفعيه عند الزيارة في الصالون
            </div>
          </div>
        </label>
      )}

      {/* ─── نقاط الولاء ─── */}
      {opts.loyaltyPointsAvailable >= 10 && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
              <Star className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              نقاط الولاء
            </div>
            <div className="text-xs text-emerald-700 font-en-display">
              المتاح: {opts.loyaltyPointsAvailable} نقطة ({(opts.loyaltyPointsAvailable * opts.loyaltyPointValue).toFixed(2)} ر.س)
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={opts.loyaltyPointsAvailable}
              step={10}
              value={loyaltyPoints}
              onChange={(e) => setLoyaltyPoints(Number(e.target.value))}
              className="flex-1 accent-emerald-600"
            />
            <div className="w-20 text-center font-en-display font-bold text-emerald-700 text-sm">
              {loyaltyPoints}
            </div>
          </div>
          {loyaltyPoints > 0 && (
            <div className="text-[11px] text-emerald-700 mt-1 text-center">
              سيتم خصم <strong>{loyaltyDiscount.toFixed(2)} ر.س</strong> من المبلغ
            </div>
          )}
        </div>
      )}

      {/* ─── بطاقة هديّة ─── */}
      <div className="p-4 border border-stone-200 rounded-2xl">
        <div className="flex items-center gap-2 mb-2 text-stone-700 font-bold text-sm">
          <Gift className="w-4 h-4 text-rose-500" />
          بطاقة هديّة
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={giftCode}
            onChange={(e) => { setGiftCode(e.target.value); setGiftValid(null); }}
            placeholder="GC-XXXXXXXX"
            dir="ltr"
            className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 focus:border-rose-400 outline-none text-sm font-en-display text-right uppercase"
          />
          <button
            type="button"
            onClick={validateGift}
            disabled={checkingGift || !giftCode.trim()}
            className="px-4 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 disabled:opacity-50"
          >
            {checkingGift ? <Loader2 className="w-4 h-4 animate-spin" /> : 'فحص'}
          </button>
        </div>
        {giftValid && (
          <div className="mt-2 text-[11px] text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            ستُخصم {giftValid.amount.toFixed(2)} ر.س من البطاقة
          </div>
        )}
      </div>

      {/* ─── اختيار البوّابة ─── */}
      {!isFree && (
        <div>
          <div className="editorial-eyebrow text-stone-500 mb-3">PAYMENT METHOD</div>

          <div className="space-y-2">
            {/* Moyasar */}
            {opts.gateways.moyasar && (
              <GatewayCard
                active={gateway === 'moyasar'}
                onClick={() => setGateway('moyasar')}
                icon={CreditCard}
                title="بطاقة · مدى / Visa / Mastercard"
                sub="Apple Pay · STC Pay · فيزا · ماستر"
                badge="فوري"
                badgeColor="emerald"
              />
            )}

            {/* Tabby */}
            {opts.gateways.tabby && (
              <GatewayCard
                active={gateway === 'tabby'}
                onClick={() => setGateway('tabby')}
                disabled={!tabbyEligible}
                icon={Smartphone}
                title="تابي · قسّمي على 4 دفعات"
                sub={tabbyEligible
                  ? `كل دفعة ${(payableNow / 4).toFixed(2)} ر.س · بلا فوائد`
                  : 'متاحة من 300 إلى 30,000 ر.س'}
                badge="تقسيط"
                badgeColor="violet"
              />
            )}

            {/* Tamara */}
            {opts.gateways.tamara && (
              <GatewayCard
                active={gateway === 'tamara'}
                onClick={() => setGateway('tamara')}
                disabled={!tamaraEligible}
                icon={Wallet}
                title="تمارا · قسّمي على 3 دفعات"
                sub={tamaraEligible
                  ? `كل دفعة ${(payableNow / 3).toFixed(2)} ر.س · بلا فوائد`
                  : 'متاحة من 100 إلى 15,000 ر.س'}
                badge="تقسيط"
                badgeColor="pink"
              />
            )}
          </div>
        </div>
      )}

      {/* ─── CTA ─── */}
      <button
        onClick={proceed}
        disabled={submitting || (!isFree && !gateway)}
        className="w-full py-4 rounded-2xl bg-gradient-to-br from-stone-900 via-amber-900 to-stone-900 text-white font-ar-display font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-xl transition-all"
      >
        {submitting
          ? <><Loader2 className="w-5 h-5 animate-spin" /> جارِ التحويل...</>
          : isFree
            ? <><CheckCircle2 className="w-5 h-5" /> تأكيد الحجز بالمجّان</>
            : <>
                <ChevronLeft className="w-5 h-5" />
                ادفعي {payableNow.toFixed(2)} ر.س الآن
              </>}
      </button>

      <div className="text-[10px] text-stone-500 text-center">
        🔒 عمليّة الدفع آمنة ومُشفّرة · لا نحفظ بيانات بطاقتكِ
      </div>
    </div>
  );
}

function GatewayCard({
  active, onClick, disabled, icon: Icon, title, sub, badge, badgeColor,
}: {
  active: boolean; onClick: () => void; disabled?: boolean;
  icon: any; title: string; sub: string; badge: string;
  badgeColor: 'emerald' | 'violet' | 'pink';
}) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    pink: 'bg-pink-50 text-pink-700 border-pink-200',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 rounded-2xl border-2 flex items-center gap-3 text-right transition-all ${
        disabled
          ? 'bg-stone-50 border-stone-100 opacity-50 cursor-not-allowed'
          : active
            ? 'bg-amber-50 border-amber-500 shadow-md'
            : 'bg-white border-stone-200 hover:border-amber-200'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
        active ? 'bg-amber-500 text-white' : 'bg-stone-100 text-stone-600'
      }`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <div className="font-bold text-sm text-stone-900">{title}</div>
        <div className="text-[11px] text-stone-500 mt-0.5">{sub}</div>
      </div>
      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${colors[badgeColor]}`}>
        {badge}
      </span>
      {active && (
        <CheckCircle2 className="w-5 h-5 text-amber-600" />
      )}
    </button>
  );
}
