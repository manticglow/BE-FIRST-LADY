/**
 * LoyaltyField — استبدال نقاط الولاء في الحجز
 * ═══════════════════════════════════════════════════════════
 * - يظهر فقط للعميلة المسجّلة اللي عندها نقاط ≥ الحد الأدنى
 * - كل 10 نقاط = 1 ريال خصم (قابل للتعديل من الإعدادات)
 * - العميلة تختار كم نقطة تستبدل · أو "استبدلي الكل"
 */
'use client';

import { useState } from 'react';
import { Award, Check, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const POINTS_PER_SAR = 10; // كل 10 نقاط = 1 ريال
const MIN_POINTS_TO_REDEEM = 50; // أقل عدد نقاط يُسمح باستبدالها

interface Props {
  availablePoints: number;
  subtotal: number;
  value: number; // ريال مطبّق حالياً
  onApplied: (sarDiscount: number, pointsUsed: number) => void;
  onCleared: () => void;
}

export default function LoyaltyField({ availablePoints, subtotal, value, onApplied, onCleared }: Props) {
  const [applied, setApplied] = useState<number>(value); // الريال المطبّق

  if (availablePoints < MIN_POINTS_TO_REDEEM) {
    return null; // لا تعرضيه إلا لو عندها نقاط كافية
  }

  // أعلى عدد نقاط يمكن استخدامه (محدود بالفاتورة)
  const maxUsablePoints = Math.min(availablePoints, subtotal * POINTS_PER_SAR);
  const maxSarDiscount = Math.floor(maxUsablePoints / POINTS_PER_SAR);

  function apply(sarAmount: number) {
    const safeAmount = Math.max(0, Math.min(sarAmount, maxSarDiscount));
    const pointsNeeded = safeAmount * POINTS_PER_SAR;
    setApplied(safeAmount);
    onApplied(safeAmount, pointsNeeded);
    toast.success(`تم استبدال ${pointsNeeded} نقطة · خصم ${safeAmount} ر.س 💎`);
  }

  function clear() {
    setApplied(0);
    onCleared();
  }

  if (applied > 0) {
    return (
      <div className="bg-gradient-to-l from-gold-light/15 to-gold-light/5 border border-gold-light/40 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gold-deep" />
          <div>
            <div className="text-sm font-bold text-gold-deep">
              نقاط ولاء مُستخدَمة · خصم {applied.toFixed(0)} ر.س
            </div>
            <div className="text-xs text-ink-soft">
              {(applied * POINTS_PER_SAR).toLocaleString()} نقطة من {availablePoints.toLocaleString()}
            </div>
          </div>
        </div>
        <button onClick={clear} className="text-ink-soft hover:text-danger p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-l from-gold-light/10 to-transparent border border-gold-light/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Award className="w-5 h-5 text-gold-deep" />
        <div className="flex-1">
          <div className="text-sm font-bold text-gold-deep">
            عندكِ {availablePoints.toLocaleString()} نقطة ولاء ✨
          </div>
          <div className="text-[11px] text-ink-soft">
            كل {POINTS_PER_SAR} نقاط = 1 ر.س · ممكن تستبدلي حتى {maxSarDiscount} ر.س هذي المرة
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <QuickButton onClick={() => apply(5)} disabled={maxSarDiscount < 5} label="5 ر.س" sub="50 نقطة" />
        <QuickButton onClick={() => apply(10)} disabled={maxSarDiscount < 10} label="10 ر.س" sub="100 نقطة" />
        <QuickButton onClick={() => apply(25)} disabled={maxSarDiscount < 25} label="25 ر.س" sub="250 نقطة" />
        <button
          onClick={() => apply(maxSarDiscount)}
          disabled={maxSarDiscount < 5}
          className="flex-1 py-2 px-3 rounded-lg bg-gold-deep text-cream-50 text-xs font-bold hover:bg-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          استبدلي الحد الأقصى ({maxSarDiscount} ر.س)
        </button>
      </div>
    </div>
  );
}

function QuickButton({ onClick, disabled, label, sub }: { onClick: () => void; disabled: boolean; label: string; sub: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 py-2 px-2 rounded-lg bg-white border border-gold-light/40 text-gold-deep text-xs font-bold hover:bg-gold-light/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex flex-col items-center"
    >
      <span>{label}</span>
      <span className="text-[9px] text-ink-soft font-normal">{sub}</span>
    </button>
  );
}
