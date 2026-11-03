/**
 * StepConfirm — ملخّص الحجز + الكوبون + بطاقة الهدية + النقاط
 */
'use client';

import { Clock } from 'lucide-react';
import type { Service, Package, Profile } from '@/types/database';
import { formatPrice, formatDuration } from '@/lib/utils';
import type { BookingState, SetBookingState } from '../types';
import CouponField from '../CouponField';
import GiftCardField from '../GiftCardField';
import LoyaltyField from '../LoyaltyField';

interface Props {
  state: BookingState;
  setState: SetBookingState;
  chosenServices: Service[];
  chosenPackage: Package | null;
  subtotal: number;
  duration: number;
  user: Profile | null;
}

export default function StepConfirm({
  state, setState, chosenServices, chosenPackage, subtotal, duration, user,
}: Props) {
  const total = Math.max(0, subtotal - state.coupon_discount - state.gift_card_amount - state.loyalty_discount);
  const loyaltyPoints = user?.loyalty_points || 0;

  return (
    <div>
      <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-1">
        راجعي تفاصيل حجزكِ
      </h2>
      <p className="text-sm text-ink-soft mb-6">
        تأكّدي من البيانات قبل التأكيد
      </p>

      <div className="space-y-4">
        <div className="bg-cream-50 rounded-2xl p-4 border border-cream-200">
          <div className="text-xs font-bold text-gold-deep uppercase tracking-wider mb-2">الخدمات</div>
          <ul className="space-y-1 text-sm">
            {chosenPackage && (
              <li className="flex items-center justify-between">
                <span className="text-ink">🎁 {chosenPackage.name_ar}</span>
                <span className="font-en-display font-bold text-gold-deep">{formatPrice(chosenPackage.price)}</span>
              </li>
            )}
            {chosenServices.map((s) => (
              <li key={s.id} className="flex items-center justify-between">
                <span className="text-ink">{s.name_ar}</span>
                <span className="font-en-display font-bold text-gold-deep">{formatPrice(s.price)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-cream-50 rounded-2xl p-4 border border-cream-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gold-deep uppercase tracking-wider mb-1">الموعد</div>
            <div className="text-sm font-bold text-ink font-en-display">
              {state.booking_date} · {state.booking_time}
            </div>
          </div>
          <Clock className="w-6 h-6 text-gold-deep" />
        </div>

        <div className="bg-cream-50 rounded-2xl p-4 border border-cream-200">
          <div className="text-xs font-bold text-gold-deep uppercase tracking-wider mb-2">البيانات</div>
          <div className="text-sm space-y-1 text-ink">
            <div><span className="text-ink-soft">الاسم:</span> {state.customer_name}</div>
            <div><span className="text-ink-soft">الجوال:</span> <span className="font-en-display">{state.customer_phone}</span></div>
            {state.customer_notes && (
              <div><span className="text-ink-soft">ملاحظات:</span> {state.customer_notes}</div>
            )}
          </div>
        </div>

        <CouponField
          subtotal={subtotal}
          value={state.coupon_code}
          onApplied={(code, discount) => setState({ ...state, coupon_code: code, coupon_discount: discount })}
          onCleared={() => setState({ ...state, coupon_code: '', coupon_discount: 0 })}
        />

        <GiftCardField
          subtotal={Math.max(0, subtotal - state.coupon_discount)}
          value={state.gift_card_code}
          onApplied={(code, amount) => setState({ ...state, gift_card_code: code, gift_card_amount: amount })}
          onCleared={() => setState({ ...state, gift_card_code: '', gift_card_amount: 0 })}
        />

        {user && !state.is_gift && loyaltyPoints >= 50 && (
          <LoyaltyField
            availablePoints={loyaltyPoints}
            subtotal={Math.max(0, subtotal - state.coupon_discount - state.gift_card_amount)}
            value={state.loyalty_discount}
            onApplied={(sarDiscount, pointsUsed) => setState({ ...state, loyalty_discount: sarDiscount, loyalty_points_used: pointsUsed })}
            onCleared={() => setState({ ...state, loyalty_discount: 0, loyalty_points_used: 0 })}
          />
        )}

        <div className="bg-gradient-to-l from-gold-deep to-ink rounded-2xl p-5 text-cream-50">
          {(state.coupon_discount > 0 || state.gift_card_amount > 0 || state.loyalty_discount > 0) && (
            <div className="flex items-center justify-between text-sm pb-2 mb-2 border-b border-gold-light/30">
              <span className="text-gold-light">المجموع قبل الخصم</span>
              <span className="font-en-display line-through text-gold-light">{formatPrice(subtotal)}</span>
            </div>
          )}
          {state.coupon_discount > 0 && (
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-success">خصم ({state.coupon_code})</span>
              <span className="font-en-display text-success">- {formatPrice(state.coupon_discount)}</span>
            </div>
          )}
          {state.gift_card_amount > 0 && (
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-success">🎁 بطاقة ({state.gift_card_code})</span>
              <span className="font-en-display text-success">- {formatPrice(state.gift_card_amount)}</span>
            </div>
          )}
          {state.loyalty_discount > 0 && (
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-success">✨ نقاط ولاء ({state.loyalty_points_used})</span>
              <span className="font-en-display text-success">- {formatPrice(state.loyalty_discount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gold-light mb-1">الإجمالي النهائي</div>
              <div className="font-en-display text-3xl font-bold">{formatPrice(total)}</div>
            </div>
            <div className="text-left">
              <div className="text-xs text-gold-light mb-1">المدة</div>
              <div className="font-en-display text-lg font-bold">{formatDuration(duration)}</div>
            </div>
          </div>
        </div>

        <p className="text-xs text-ink-soft text-center leading-relaxed">
          سيتم التواصل معكِ على الواتساب خلال 15 دقيقة لتأكيد الحجز 💛
        </p>
      </div>
    </div>
  );
}
