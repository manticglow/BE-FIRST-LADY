/**
 * StepContact — بيانات التواصل · يدعم وضع الهدية
 */
'use client';

import { User, Phone, FileText, Gift, Heart } from 'lucide-react';
import type { BookingState, SetBookingState } from '../types';

interface Props {
  state: BookingState;
  setState: SetBookingState;
}

export default function StepContact({ state, setState }: Props) {
  return (
    <div>
      <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-1">
        بياناتكِ
      </h2>
      <p className="text-sm text-ink-soft mb-6">
        نحتاجها لتأكيد الحجز
      </p>

      {/* زرار الهدية */}
      <div className="mb-6 max-w-xl">
        <button
          type="button"
          onClick={() => setState({ ...state, is_gift: !state.is_gift })}
          className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
            state.is_gift
              ? 'border-gold-deep bg-gradient-to-l from-gold-deep/5 to-gold-light/10'
              : 'border-cream-200 bg-cream-50 hover:border-gold-light'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-full flex items-center justify-center ${
              state.is_gift ? 'bg-gold-deep text-cream-50' : 'bg-cream-100 text-gold-deep'
            }`}>
              <Gift className="w-5 h-5" />
            </div>
            <div className="text-right">
              <div className="font-ar-display font-bold text-ink">هذه هدية لشخص آخر</div>
              <div className="text-xs text-ink-soft mt-0.5">
                أدفعي أنتِ، وتصلها دعوة فاخرة واتساب 🎁
              </div>
            </div>
          </div>
          <div className={`w-11 h-6 rounded-full relative transition-colors ${
            state.is_gift ? 'bg-gold-deep' : 'bg-cream-300'
          }`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-all ${
              state.is_gift ? 'right-0.5' : 'right-5'
            }`} />
          </div>
        </button>
      </div>

      <div className="space-y-4 max-w-xl">
        {/* بيانات المستقبِلة */}
        <div className={state.is_gift ? 'p-4 border border-gold-light/40 rounded-2xl bg-gold-light/5' : ''}>
          {state.is_gift && (
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gold-light/30">
              <Heart className="w-4 h-4 text-gold-deep" />
              <span className="text-xs font-bold text-gold-deep uppercase tracking-wider">بيانات المستقبِلة</span>
            </div>
          )}
          <div className="space-y-4">
            <Field
              label={state.is_gift ? 'اسم المستقبِلة الكامل' : 'اسمكِ الكامل'}
              icon={<User className="w-4 h-4 text-ink-soft" />}
            >
              <input
                type="text"
                required
                value={state.customer_name}
                onChange={(e) => setState({ ...state, customer_name: e.target.value })}
                placeholder={state.is_gift ? 'لمن الهدية؟' : 'هيا الزهراني'}
                className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm"
              />
            </Field>

            <Field
              label={state.is_gift ? 'جوال المستقبِلة (الواتساب)' : 'رقم الجوال (واتساب للتأكيد)'}
              icon={<Phone className="w-4 h-4 text-ink-soft" />}
              helper={state.is_gift ? '📱 الدعوة بتُرسل على هذا الرقم بعد تأكيد الدفع' : undefined}
            >
              <input
                type="tel"
                required
                value={state.customer_phone}
                onChange={(e) => setState({ ...state, customer_phone: e.target.value })}
                placeholder="05xxxxxxxx"
                className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm font-en-display"
              />
            </Field>
          </div>
        </div>

        {/* بيانات المرسِلة — هدية فقط */}
        {state.is_gift && (
          <div className="p-4 border border-gold-light/40 rounded-2xl bg-gold-light/5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gold-light/30">
              <Gift className="w-4 h-4 text-gold-deep" />
              <span className="text-xs font-bold text-gold-deep uppercase tracking-wider">بياناتكِ (المرسِلة)</span>
            </div>
            <div className="space-y-4">
              <Field label="اسمكِ (يظهر في الدعوة)" icon={<User className="w-4 h-4 text-ink-soft" />}>
                <input
                  type="text"
                  required
                  value={state.gift_from_name}
                  onChange={(e) => setState({ ...state, gift_from_name: e.target.value })}
                  placeholder="مثل: أمها، صديقتها هيا، أم العيال..."
                  className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-white focus:border-gold outline-none transition-colors text-sm"
                />
              </Field>

              <Field label="جوالكِ (للتواصل بخصوص الدفع)" icon={<Phone className="w-4 h-4 text-ink-soft" />}>
                <input
                  type="tel"
                  required
                  value={state.gift_from_phone}
                  onChange={(e) => setState({ ...state, gift_from_phone: e.target.value })}
                  placeholder="05xxxxxxxx"
                  className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-white focus:border-gold outline-none transition-colors text-sm font-en-display"
                />
              </Field>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                  رسالتكِ الشخصية (تظهر في الدعوة)
                </label>
                <div className="relative">
                  <Heart className="absolute right-3 top-3 w-4 h-4 text-gold" />
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={state.gift_message}
                    onChange={(e) => setState({ ...state, gift_message: e.target.value })}
                    placeholder="من قلبي يا غالية 💛 — تستحقين كل جمال"
                    className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-white focus:border-gold outline-none transition-colors text-sm resize-none"
                  />
                </div>
                <p className="text-[10px] text-ink-soft mt-1 text-left font-en-display">
                  {state.gift_message.length}/300
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-ink-soft mb-1.5">
            ملاحظات إضافية <span className="text-ink-soft/60 font-normal">(اختياري)</span>
          </label>
          <div className="relative">
            <FileText className="absolute right-3 top-3 w-4 h-4 text-ink-soft" />
            <textarea
              rows={2}
              value={state.customer_notes}
              onChange={(e) => setState({ ...state, customer_notes: e.target.value })}
              placeholder="أي تفضيلات، حساسيات، أو طلبات خاصة"
              className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, icon, helper, children,
}: {
  label: string;
  icon: React.ReactNode;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-soft mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2">{icon}</span>
        {children}
      </div>
      {helper && <p className="text-[11px] text-ink-soft mt-1">{helper}</p>}
    </div>
  );
}
