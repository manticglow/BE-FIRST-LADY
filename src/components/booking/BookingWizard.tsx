/**
 * BookingWizard — معالج حجز متعدد الخطوات
 * ═══════════════════════════════════════════════════════════
 * الخطوات:
 *   1) اختيار الخدمات/البكج
 *   2) اختيار التاريخ والوقت
 *   3) البيانات الشخصية (إن لم تكن مسجلة دخول)
 *   4) تأكيد الحجز
 */
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, ChevronLeft, ChevronRight, Clock, Calendar, User, Phone, FileText, Loader2, Gift, Heart } from 'lucide-react';
import type { Category, Service, Package, Profile } from '@/types/database';
import { formatPrice, formatDuration } from '@/lib/utils';
import TimeSlotPicker from './TimeSlotPicker';
import CouponField from './CouponField';
import GiftCardField from './GiftCardField';
import StaffPicker from './StaffPicker';

interface Props {
  categories: Category[];
  services: Service[];
  packages: Package[];
  user: Profile | null;
}

type Step = 1 | 2 | 3 | 4;

interface BookingState {
  selectedServices: string[];     // service ids
  selectedPackageId: string | null;
  booking_date: string;
  booking_time: string;
  customer_name: string;    // اسم المستقبِلة (أو الحاجزة لو حجز عادي)
  customer_phone: string;   // جوال المستقبِلة
  customer_notes: string;
  // الهدية
  is_gift: boolean;
  gift_from_name: string;
  gift_from_phone: string;
  gift_message: string;
  // الكوبون
  coupon_code: string;
  coupon_discount: number;
  // بطاقة الهدية
  gift_card_code: string;
  gift_card_amount: number;
  // الاختصاصية
     staff_id: null,
  });

  // قراءة ?service=xxx أو ?package=xxx من الرابط للـpre-select من زر "أضيفي واحجزي"
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const serviceParam = params.get('service');
    const packageParam = params.get('package');
    if (serviceParam) {
      const ids = serviceParam.split(',').filter((id) => services.some((s) => s.id === id));
      if (ids.length > 0) {
        setState((prev) => ({ ...prev, selectedServices: ids, selectedPackageId: null }));
        toast.success('تم إضافة الخدمة · أكملي حجزك 🌸');
      }
    } else if (packageParam) {
      if (packages.some((p) => p.id === packageParam)) {
        setState((prev) => ({ ...prev, selectedPackageId: packageParam, selectedServices: [] }));
        toast.success('تم اختيار الباقة · أكملي حجزك 🌸');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // الحسابات
  const chosenServices = useMemo(
    () => services.filter((s) => state.selectedServices.includes(s.id)),
    [services, state.selectedServices]
  );
  const chosenPackage = useMemo(
    () => packages.find((p) => p.id === state.selectedPackageId) || null,
    [packages, state.selectedPackageId]
  );

  const subtotal = useMemo(() => {
    if (chosenPackage) return Number(chosenPackage.price);
    return chosenServices.reduce((sum, s) => sum + Number(s.price), 0);
  }, [chosenServices, chosenPackage]);

  const totalDuration = useMemo(() => {
    if (chosenPackage) return 90;  // متوسط مدة البكج (يحسبها الخادم بدقة)
    return chosenServices.reduce((sum, s) => sum + s.duration_min, 0);
  }, [chosenServices, chosenPackage]);

  // --- أفعال ---
  function toggleService(id: string) {
    setState((s) => ({
      ...s,
      selectedPackageId: null,
      selectedServices: s.selectedServices.includes(id)
        ? s.selectedServices.filter((x) => x !== id)
        : [...s.selectedServices, id],
    }));
  }
  function choosePackage(id: string) {
    setState((s) => ({
      ...s,
      selectedServices: [],
      selectedPackageId: s.selectedPackageId === id ? null : id,
    }));
  }

  function canGoNext(): boolean {
    if (step === 1) return state.selectedServices.length > 0 || state.selectedPackageId !== null;
    if (step === 2) return !!state.booking_date && !!state.booking_time;
    if (step === 3) {
      const basic = !!state.customer_name && !!state.customer_phone;
      if (!state.is_gift) return basic;
      return basic && !!state.gift_from_name && !!state.gift_from_phone;
    }
    return true;
  }

  function next() {
    if (!canGoNext()) {
      toast.error('يرجى إكمال البيانات');
      return;
    }
    setStep((s) => Math.min(4, (s + 1) as Step));
  }
  function back() {
    setStep((s) => Math.max(1, (s - 1) as Step));
  }

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_date: state.booking_date,
          booking_time: state.booking_time,
          customer_name: state.customer_name,
          customer_phone: state.customer_phone,
          customer_notes: state.customer_notes || null,
          package_id: state.selectedPackageId,
          service_ids: state.selectedServices,
          is_gift: state.is_gift,
          gift_from_name: state.is_gift ? state.gift_from_name : undefined,
          gift_from_phone: state.is_gift ? state.gift_from_phone : undefined,
          gift_message: state.is_gift ? state.gift_message : undefined,
          coupon_code: state.coupon_code || undefined,
          gift_card_code: state.gift_card_code || undefined,
          staff_id: state.staff_id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ');

      if (data.is_gift) {
        toast.success('تمّت الهدية 🎁 سيتم إرسال الدعوة لها قريباً');
      } else {
        toast.success('تم إرسال طلب الحجز بنجاح 🌸');
      }
      router.push(user ? '/account' : `/?booked=${data.booking_number}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // --- خطوات ---
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-cream-200 overflow-hidden">
      {/* شريط التقدم */}
      <StepIndicator current={step} />

      <div className="p-6 md:p-8">
        {step === 1 && (
          <StepServices
            categories={categories}
            services={services}
            packages={packages}
            state={state}
            toggleService={toggleService}
            choosePackage={choosePackage}
            subtotal={subtotal}
            duration={totalDuration}
          />
        )}

        {step === 2 && (
          <StepDateTime
            state={state}
            setState={setState}
            subtotal={subtotal}
            duration={totalDuration}
          />
        )}

        {step === 3 && (
          <StepContact state={state} setState={setState} />
        )}

        {step === 4 && (
          <StepConfirm
            state={state}
            setState={setState}
            chosenServices={chosenServices}
            chosenPackage={chosenPackage}
            subtotal={subtotal}
            duration={totalDuration}
          />
        )}
      </div>

      {/* أزرار التنقل */}
      <div className="border-t border-cream-200 p-4 md:p-6 flex items-center justify-between gap-3 bg-cream-50/50">
        <button
          onClick={back}
          disabled={step === 1}
          className="btn-outline !py-2 !px-4 text-sm flex items-center gap-1 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-4 h-4" />
          السابق
        </button>

        <div className="text-xs text-ink-soft">
          خطوة <span className="font-en-display font-bold text-gold-deep">{step}</span> من 4
        </div>

        {step < 4 ? (
          <button
            onClick={next}
            disabled={!canGoNext()}
            className="btn-primary !py-2 !px-5 text-sm flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            التالي
            <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={submitting}
            className="btn-primary !py-2 !px-5 text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            تأكيد الحجز
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// شريط الخطوات
// ═══════════════════════════════════════════════════════════
function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: 'الخدمات' },
    { n: 2, label: 'الوقت' },
    { n: 3, label: 'بياناتكِ' },
    { n: 4, label: 'التأكيد' },
  ];

  return (
    <div className="bg-gradient-to-l from-gold-deep/5 to-transparent border-b border-cream-200 p-4 md:p-6">
      <div className="flex items-center justify-between">
        {steps.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-en-display font-bold text-sm transition-all ${
                  current >= s.n
                    ? 'bg-gold-deep text-cream-50 shadow-md'
                    : 'bg-cream-100 text-ink-soft'
                }`}
              >
                {current > s.n ? <Check className="w-4 h-4" /> : s.n}
              </div>
              <div className={`text-[10px] md:text-xs mt-1.5 font-semibold ${current >= s.n ? 'text-gold-deep' : 'text-ink-soft'}`}>
                {s.label}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${current > s.n ? 'bg-gold-deep' : 'bg-cream-200'}`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// الخطوة 1 — اختيار الخدمات
// ═══════════════════════════════════════════════════════════
function StepServices({
  categories, services, packages, state, toggleService, choosePackage, subtotal, duration,
}: {
  categories: Category[]; services: Service[]; packages: Package[];
  state: BookingState;
  toggleService: (id: string) => void;
  choosePackage: (id: string) => void;
  subtotal: number;
  duration: number;
}) {
  return (
    <div>
      <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-1">
        اختاري ما تريدين
      </h2>
      <p className="text-sm text-ink-soft mb-6">
        يمكنكِ اختيار خدمات متعددة أو بكج جاهز
      </p>

      {/* البكجات */}
      {packages.length > 0 && (
        <div className="mb-6">
          <h3 className="font-ar-display text-lg font-bold text-ink mb-3">
            🎁 البكجات الجاهزة
          </h3>
          <div className="grid md:grid-cols-2 gap-3">
            {packages.map((p) => {
              const sel = state.selectedPackageId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => choosePackage(p.id)}
                  className={`text-right border-2 rounded-2xl p-4 transition-all ${
                    sel
                      ? 'border-gold-deep bg-gold-light/10 shadow-md'
                      : 'border-cream-200 bg-white hover:border-gold-light'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-ar-display font-bold text-ink">{p.name_ar}</div>
                    {sel && <Check className="w-5 h-5 text-gold-deep shrink-0" />}
                  </div>
                  {p.description_ar && (
                    <p className="text-xs text-ink-soft mb-3 line-clamp-2">{p.description_ar}</p>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-cream-100">
                    <span className="font-en-display font-bold text-gold-deep text-lg">
                      {formatPrice(p.price)}
                    </span>
                    {p.original_price && Number(p.original_price) > Number(p.price) && (
                      <span className="text-xs text-ink-soft line-through font-en-display">
                        {formatPrice(p.original_price)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* الخدمات المفردة */}
      <div>
        <h3 className="font-ar-display text-lg font-bold text-ink mb-3">
          أو اختاري خدمات مفردة
        </h3>
        <div className="space-y-4">
          {categories.map((cat) => {
            const catServices = services.filter((s) => s.category_id === cat.id);
            if (catServices.length === 0) return null;
            return (
              <div key={cat.id}>
                <div className="font-ar-display font-bold text-gold-deep text-sm mb-2">
                  {cat.name_ar}
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {catServices.map((s) => {
                    const sel = state.selectedServices.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggleService(s.id)}
                        className={`text-right border rounded-xl p-3 transition-all ${
                          sel
                            ? 'border-gold-deep bg-gold-light/10'
                            : 'border-cream-200 bg-white hover:border-gold-light'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-ink truncate">{s.name_ar}</div>
                            <div className="text-xs text-ink-soft mt-0.5">
                              {formatDuration(s.duration_min)}
                            </div>
                          </div>
                          <div className="text-left shrink-0">
                            <div className="font-en-display font-bold text-sm text-gold-deep">
                              {formatPrice(s.price)}
                            </div>
                            {sel && <Check className="w-3 h-3 text-gold-deep inline mt-1" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* الملخص */}
      {(state.selectedServices.length > 0 || state.selectedPackageId) && (
        <SummaryStrip subtotal={subtotal} duration={duration} count={state.selectedServices.length || 1} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// الخطوة 2 — التاريخ والوقت
// ═══════════════════════════════════════════════════════════
function StepDateTime({
  state, setState, subtotal, duration,
}: {
  state: BookingState; setState: (s: any) => void; subtotal: number; duration: number;
}) {
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 60);

  // أي IDs للخدمات لتمريرها لـ staff-picker
  const serviceIds = state.selectedPackageId ? [] : state.selectedServices;

  return (
    <div>
      <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-1">
        التاريخ والاختصاصية والوقت
      </h2>
      <p className="text-sm text-ink-soft mb-6">
        المواعيد المتاحة فقط تظهر حسب جدول الاختصاصية
      </p>

      {/* التاريخ */}
      <div>
        <label className="block text-xs font-semibold text-ink-soft mb-2">
          <Calendar className="w-3.5 h-3.5 inline ml-1" />
          التاريخ
        </label>
        <input
          type="date"
          min={today.toISOString().split('T')[0]}
          max={maxDate.toISOString().split('T')[0]}
          value={state.booking_date}
          onChange={(e) => setState({ ...state, booking_date: e.target.value, booking_time: '', staff_id: null })}
          className="w-full px-3 py-3 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm font-en-display"
        />
      </div>

      {/* الاختصاصية */}
      {state.booking_date && (
        <div className="mt-5">
          <label className="block text-xs font-semibold text-ink-soft mb-2">
            <User className="w-3.5 h-3.5 inline ml-1" />
            الاختصاصية
          </label>
          <StaffPicker
            date={state.booking_date}
            serviceIds={serviceIds}
            value={state.staff_id}
            onChange={(id) => setState({ ...state, staff_id: id, booking_time: '' })}
          />
        </div>
      )}

      {/* الوقت المتاح */}
      {state.booking_date && (
        <div className="mt-5">
          <label className="block text-xs font-semibold text-ink-soft mb-2">
            <Clock className="w-3.5 h-3.5 inline ml-1" />
            الوقت المتاح
            {state.staff_id && <span className="text-gold-deep"> (حسب جدول الاختصاصية المختارة)</span>}
          </label>
          <TimeSlotPicker
            date={state.booking_date}
            duration={duration}
            staffId={state.staff_id}
            value={state.booking_time}
            onChange={(time) => setState({ ...state, booking_time: time })}
          />
        </div>
      )}

      <SummaryStrip subtotal={subtotal} duration={duration} count={state.selectedServices.length || 1} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// الخطوة 3 — البيانات
// ═══════════════════════════════════════════════════════════
function StepContact({ state, setState }: { state: BookingState; setState: (s: any) => void }) {
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
        {/* بيانات المستقبِلة (أو العميلة لو حجز عادي) */}
        <div className={state.is_gift ? 'p-4 border border-gold-light/40 rounded-2xl bg-gold-light/5' : ''}>
          {state.is_gift && (
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gold-light/30">
              <Heart className="w-4 h-4 text-gold-deep" />
              <span className="text-xs font-bold text-gold-deep uppercase tracking-wider">بيانات المستقبِلة</span>
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                {state.is_gift ? 'اسم المستقبِلة الكامل' : 'اسمكِ الكامل'}
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                <input
                  type="text"
                  required
                  value={state.customer_name}
                  onChange={(e) => setState({ ...state, customer_name: e.target.value })}
                  placeholder={state.is_gift ? 'لمن الهدية؟' : 'هيا الزهراني'}
                  className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                {state.is_gift ? 'جوال المستقبِلة (الواتساب)' : 'رقم الجوال (واتساب للتأكيد)'}
              </label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                <input
                  type="tel"
                  required
                  value={state.customer_phone}
                  onChange={(e) => setState({ ...state, customer_phone: e.target.value })}
                  placeholder="05xxxxxxxx"
                  className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none transition-colors text-sm font-en-display"
                />
              </div>
              {state.is_gift && (
                <p className="text-[11px] text-ink-soft mt-1">
                  📱 الدعوة بتُرسل على هذا الرقم بعد تأكيد الدفع
                </p>
              )}
            </div>
          </div>
        </div>

        {/* بيانات المرسِلة — تظهر فقط لو هدية */}
        {state.is_gift && (
          <div className="p-4 border border-gold-light/40 rounded-2xl bg-gold-light/5">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gold-light/30">
              <Gift className="w-4 h-4 text-gold-deep" />
              <span className="text-xs font-bold text-gold-deep uppercase tracking-wider">بياناتكِ (المرسِلة)</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                  اسمكِ (يظهر في الدعوة)
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                  <input
                    type="text"
                    required
                    value={state.gift_from_name}
                    onChange={(e) => setState({ ...state, gift_from_name: e.target.value })}
                    placeholder="مثل: أمها، صديقتها هيا، أم العيال..."
                    className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-white focus:border-gold outline-none transition-colors text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">
                  جوالكِ (للتواصل بخصوص الدفع)
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-soft" />
                  <input
                    type="tel"
                    required
                    value={state.gift_from_phone}
                    onChange={(e) => setState({ ...state, gift_from_phone: e.target.value })}
                    placeholder="05xxxxxxxx"
                    className="w-full pr-10 pl-3 py-3 rounded-xl border border-cream-200 bg-white focus:border-gold outline-none transition-colors text-sm font-en-display"
                  />
                </div>
              </div>

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

        {/* ملاحظات */}
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

// ═══════════════════════════════════════════════════════════
// الخطوة 4 — التأكيد
// ═══════════════════════════════════════════════════════════
function StepConfirm({
  state, setState, chosenServices, chosenPackage, subtotal, duration,
}: {
  state: BookingState;
  setState: (s: any) => void;
  chosenServices: Service[];
  chosenPackage: Package | null;
  subtotal: number;
  duration: number;
}) {
  const total = Math.max(0, subtotal - state.coupon_discount - state.gift_card_amount);
  return (
    <div>
      <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-1">
        راجعي تفاصيل حجزكِ
      </h2>
      <p className="text-sm text-ink-soft mb-6">
        تأكّدي من البيانات قبل التأكيد
      </p>

      <div className="space-y-4">
        {/* الخدمات */}
        <div className="bg-cream-50 rounded-2xl p-4 border border-cream-200">
          <div className="text-xs font-bold text-gold-deep uppercase tracking-wider mb-2">
            الخدمات
          </div>
          <ul className="space-y-1 text-sm">
            {chosenPackage && (
              <li className="flex items-center justify-between">
                <span className="text-ink">🎁 {chosenPackage.name_ar}</span>
                <span className="font-en-display font-bold text-gold-deep">
                  {formatPrice(chosenPackage.price)}
                </span>
              </li>
            )}
            {chosenServices.map((s) => (
              <li key={s.id} className="flex items-center justify-between">
                <span className="text-ink">{s.name_ar}</span>
                <span className="font-en-display font-bold text-gold-deep">
                  {formatPrice(s.price)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* الوقت */}
        <div className="bg-cream-50 rounded-2xl p-4 border border-cream-200 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-gold-deep uppercase tracking-wider mb-1">
              الموعد
            </div>
            <div className="text-sm font-bold text-ink font-en-display">
              {state.booking_date} · {state.booking_time}
            </div>
          </div>
          <Clock className="w-6 h-6 text-gold-deep" />
        </div>

        {/* البيانات */}
        <div className="bg-cream-50 rounded-2xl p-4 border border-cream-200">
          <div className="text-xs font-bold text-gold-deep uppercase tracking-wider mb-2">
            البيانات
          </div>
          <div className="text-sm space-y-1 text-ink">
            <div><span className="text-ink-soft">الاسم:</span> {state.customer_name}</div>
            <div><span className="text-ink-soft">الجوال:</span> <span className="font-en-display">{state.customer_phone}</span></div>
            {state.customer_notes && (
              <div><span className="text-ink-soft">ملاحظات:</span> {state.customer_notes}</div>
            )}
          </div>
        </div>

        {/* الكوبون */}
        <CouponField
          subtotal={subtotal}
          value={state.coupon_code}
          onApplied={(code, discount) => setState({ ...state, coupon_code: code, coupon_discount: discount })}
          onCleared={() => setState({ ...state, coupon_code: '', coupon_discount: 0 })}
        />

        {/* بطاقة الهدية */}
        <GiftCardField
          subtotal={Math.max(0, subtotal - state.coupon_discount)}
          value={state.gift_card_code}
          onApplied={(code, amount) => setState({ ...state, gift_card_code: code, gift_card_amount: amount })}
          onCleared={() => setState({ ...state, gift_card_code: '', gift_card_amount: 0 })}
        />

        {/* الإجمالي */}
        <div className="bg-gradient-to-l from-gold-deep to-ink rounded-2xl p-5 text-cream-50">
          {(state.coupon_discount > 0 || state.gift_card_amount > 0) && (
            <div className="flex items-center justify-between text-sm pb-2 mb-2 border-b border-gold-light/30">
              <span className="text-gold-light">المجموع قبل الخصم</span>
              <span className="font-en-display line-through text-gold-light">
                {formatPrice(subtotal)}
              </span>
            </div>
          )}
          {state.coupon_discount > 0 && (
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-success">خصم ({state.coupon_code})</span>
              <span className="font-en-display text-success">
                - {formatPrice(state.coupon_discount)}
              </span>
            </div>
          )}
          {state.gift_card_amount > 0 && (
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-success">🎁 بطاقة ({state.gift_card_code})</span>
              <span className="font-en-display text-success">
                - {formatPrice(state.gift_card_amount)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gold-light mb-1">الإجمالي النهائي</div>
              <div className="font-en-display text-3xl font-bold">
                {formatPrice(total)}
              </div>
            </div>
            <div className="text-left">
              <div className="text-xs text-gold-light mb-1">المدة</div>
              <div className="font-en-display text-lg font-bold">
                {formatDuration(duration)}
              </div>
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

// ═══════════════════════════════════════════════════════════
// الملخص السفلي
// ═══════════════════════════════════════════════════════════
function SummaryStrip({ subtotal, duration, count }: { subtotal: number; duration: number; count: number }) {
  return (
    <div className="mt-6 bg-gold-deep/5 border border-gold-light/40 rounded-xl p-3 flex items-center justify-between text-sm">
      <div className="text-ink-soft">
        <span className="font-en-display font-bold text-gold-deep">{count}</span>{' '}
        {count === 1 ? 'خدمة' : 'خدمات'} · {formatDuration(duration)}
      </div>
      <div className="font-en-display font-bold text-gold-deep text-lg">
        {formatPrice(subtotal)}
      </div>
    </div>
  );
}
