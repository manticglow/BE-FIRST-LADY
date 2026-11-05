/**
 * BookingWizard — معالج حجز متعدد الخطوات
 * ═══════════════════════════════════════════════════════════
 * الـshell فقط · كل خطوة في ملف منفصل تحت ./steps/
 *   - StepServices
 *   - StepDateTime
 *   - StepContact
 *   - StepConfirm
 */
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  ChevronLeft, ChevronRight, Loader2, CreditCard, Sparkles, Clock, Calendar,
} from 'lucide-react';
import type { Category, Service, Package, Profile } from '@/types/database';
import { formatPrice, formatDuration } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';
import { logger } from '@/lib/logger';

import type { Step, BookingState } from './types';
import StepIndicator from './steps/StepIndicator';
import StepServices from './steps/StepServices';
import StepDateTime from './steps/StepDateTime';
import StepContact from './steps/StepContact';
import StepConfirm from './steps/StepConfirm';

const log = logger.scope('booking-wizard');

interface Props {
  categories: Category[];
  services: Service[];
  packages: Package[];
  user: Profile | null;
  /** 🔁 إعادة حجز سابق · يملأ الخدمات والموظفة تلقائياً */
  prefill?: {
    serviceIds: string[];
    staffId: string | null;
    packageId: string | null;
  } | null;
}

const INITIAL_STATE = (user: Profile | null): BookingState => ({
  selectedServices: [],
  selectedPackageId: null,
  booking_date: '',
  booking_time: '',
  customer_name: user?.full_name || '',
  customer_phone: user?.phone || '',
  customer_notes: '',
  is_gift: false,
  gift_from_name: user?.full_name || '',
  gift_from_phone: user?.phone || '',
  gift_message: '',
  coupon_code: '',
  coupon_discount: 0,
  gift_card_code: '',
  gift_card_amount: 0,
  staff_id: null,
  loyalty_discount: 0,
  loyalty_points_used: 0,
});

const NEXT_LABELS: Record<number, string> = {
  1: 'التالي · اختاري الوقت',
  2: 'التالي · بياناتكِ',
  3: 'التالي · التأكيد',
};

export default function BookingWizard({ categories, services, packages, user, prefill }: Props) {
  const router = useRouter();
  const cart = useCart();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<BookingState>(() => INITIAL_STATE(user));

  // تحميل الخدمات من مصادر متعدّدة
  useEffect(() => {
    if (prefill) {
      const validServices = prefill.serviceIds.filter((id) => services.some((s) => s.id === id));
      setState((prev) => ({
        ...prev,
        selectedServices: validServices,
        selectedPackageId: prefill.packageId,
        staff_id: prefill.staffId,
      }));
      if (validServices.length > 0 || prefill.packageId) setStep(2);
      return;
    }

    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const serviceParam = params.get('service');
    const packageParam = params.get('package');

    if (serviceParam) {
      const ids = serviceParam.split(',').filter((id) => services.some((s) => s.id === id));
      if (ids.length > 0) {
        setState((prev) => ({ ...prev, selectedServices: ids, selectedPackageId: null }));
        setStep(2);
      }
    } else if (packageParam) {
      if (packages.some((p) => p.id === packageParam)) {
        setState((prev) => ({ ...prev, selectedPackageId: packageParam, selectedServices: [] }));
        setStep(2);
      }
    } else if (cart.hydrated && cart.items.length > 0) {
      const validIds = cart.items.filter((id) => services.some((s) => s.id === id));
      if (validIds.length > 0) {
        setState((prev) => ({ ...prev, selectedServices: validIds, selectedPackageId: null }));
        setStep(2);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.hydrated]);

  // ─── حسابات ───
  const chosenServices = useMemo(
    () => services.filter((s) => state.selectedServices.includes(s.id)),
    [services, state.selectedServices],
  );
  const chosenPackage = useMemo(
    () => packages.find((p) => p.id === state.selectedPackageId) || null,
    [packages, state.selectedPackageId],
  );
  const subtotal = useMemo(() => {
    if (chosenPackage) return Number(chosenPackage.price);
    return chosenServices.reduce((sum, s) => sum + Number(s.price), 0);
  }, [chosenServices, chosenPackage]);
  const totalDuration = useMemo(() => {
    if (chosenPackage) return 90;
    return chosenServices.reduce((sum, s) => sum + s.duration_min, 0);
  }, [chosenServices, chosenPackage]);

  // ─── أفعال ───
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
          loyalty_points_used: state.loyalty_points_used || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ');

      cart.clear();

      // 🎁 الهدايا · ما تحتاج دفع من المرسِلة (لاحقاً المستلِمة تدفع لو تبي)
      if (data.is_gift) {
        toast.success('تمّت الهدية 🎁 سيتم إرسال الدعوة لها قريباً');
        router.push(user ? '/account' : `/?booked=${data.booking_number}`);
        router.refresh();
        return;
      }

      // 💳 المجموع = صفر؟ (تمّ الدفع بكوبون/هدية/نقاط) → صفحة التأكيد
      if (!data.total || data.total === 0) {
        toast.success('تم تأكيد حجزكِ بنجاح 🌸');
        router.push(user ? '/account' : `/?booked=${data.booking_number}`);
        router.refresh();
        return;
      }

      // 💰 دفع فوري: تحويل مباشر لصفحة الدفع
      toast.success('جاري تحويلكِ لصفحة الدفع · أمان وسرعة 🔒');
      router.push(`/account/bookings/${data.booking_id}/pay`);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'حدث خطأ';
      log.error('submit failed', err);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-cream-200 overflow-hidden pb-28 md:pb-24">
      <StepIndicator current={step} onJump={(n) => setStep(n)} />

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

        {step === 3 && <StepContact state={state} setState={setState} />}

        {step === 4 && (
          <StepConfirm
            state={state}
            setState={setState}
            chosenServices={chosenServices}
            chosenPackage={chosenPackage}
            subtotal={subtotal}
            duration={totalDuration}
            user={user}
          />
        )}
      </div>

      {/* ═══ شريط الـactions الثابت أسفل الشاشة ═══ */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-gradient-to-t from-cream-50 via-white to-white border-t border-gold-light/30 shadow-[0_-8px_32px_-10px_rgba(201,169,110,0.25)] backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 md:px-6 md:py-3.5">
          {(state.selectedServices.length > 0 || state.selectedPackageId) && (
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-cream-100">
              <div className="flex items-center gap-3 text-[11px] text-ink-soft">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-gold-light" />
                  <strong className="text-ink font-en-display">
                    {state.selectedPackageId ? 1 : state.selectedServices.length}
                  </strong>
                  {state.selectedPackageId ? 'بكج' : 'خدمة'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gold-light" />
                  <strong className="text-ink font-en-display">{formatDuration(totalDuration)}</strong>
                </span>
                {state.booking_time && (
                  <span className="hidden sm:flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gold-light" />
                    <strong className="text-ink font-en-display">
                      {state.booking_date} · {state.booking_time.slice(0, 5)}
                    </strong>
                  </span>
                )}
              </div>
              <div className="font-en-display font-bold text-gold-deep text-base">
                {formatPrice(subtotal)}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={back}
              disabled={step === 1}
              className="w-11 h-11 md:w-auto md:h-auto md:px-4 md:py-2.5 rounded-xl border border-cream-300 bg-white text-ink-soft hover:text-gold-deep hover:border-gold-light disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1 text-sm font-semibold shrink-0"
              aria-label="السابق"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden md:inline">السابق</span>
            </button>

            <div className="hidden md:flex items-center gap-1 px-3 text-[11px] text-ink-soft">
              <span>خطوة</span>
              <span className="font-en-display font-bold text-gold-deep">{step}</span>
              <span>من</span>
              <span className="font-en-display font-bold text-gold-deep">4</span>
            </div>

            {step < 4 ? (
              <button
                onClick={next}
                disabled={!canGoNext()}
                className="btn-shimmer flex-1 py-3 md:py-3 rounded-xl bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50 font-ar-display font-bold text-sm md:text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-[0.98] transition-all overflow-hidden"
              >
                <span className="relative z-10">
                  {NEXT_LABELS[step as 1 | 2 | 3] || 'التالي'}
                </span>
                <ChevronLeft className="w-4 h-4 relative z-10" />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting}
                className="btn-shimmer btn-halo flex-1 py-3 md:py-3 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white font-ar-display font-bold text-sm md:text-base flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg active:scale-[0.98] transition-all overflow-hidden"
              >
                {submitting
                  ? <><Loader2 className="w-5 h-5 animate-spin relative z-10" /> <span className="relative z-10">جارِ التأكيد...</span></>
                  : <>
                      <CreditCard className="w-5 h-5 relative z-10" />
                      <span className="relative z-10">تأكيد الحجز ({formatPrice(subtotal, { showFrom: false })})</span>
                    </>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
