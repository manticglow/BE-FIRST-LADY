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
import Image from 'next/image';
import { toast } from 'sonner';
import { Check, ChevronLeft, ChevronRight, Clock, Calendar, User, Phone, FileText, Loader2, Gift, Heart, Sparkles, CreditCard, ArrowLeft } from 'lucide-react';
import type { Category, Service, Package, Profile } from '@/types/database';
import { formatPrice, formatDuration } from '@/lib/utils';
import TimeSlotPicker from './TimeSlotPicker';
import CouponField from './CouponField';
import GiftCardField from './GiftCardField';
import LoyaltyField from './LoyaltyField';
import StaffPicker from './StaffPicker';
import { useCart } from '@/hooks/useCart';

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
  staff_id: string | null;
  // نقاط الولاء
  loyalty_discount: number;
  loyalty_points_used: number;
}

export default function BookingWizard({ categories, services, packages, user, prefill }: Props) {
  const router = useRouter();
  const cart = useCart();
  const [step, setStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  const [state, setState] = useState<BookingState>({
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

  // تحميل الخدمات من: prefill (كرّري آخر حجز) أولاً · ثم URL · ثم السلة
  // ✨ لو الخدمات جاءت محمّلة من أي مصدر خارجي · نتخطّى الخطوة 1 مباشرة للخطوة 2
  useEffect(() => {
    // 🔁 إعادة حجز سابق · له الأولوية
    if (prefill) {
      const validServices = prefill.serviceIds.filter((id) => services.some((s) => s.id === id));
      setState((prev) => ({
        ...prev,
        selectedServices: validServices,
        selectedPackageId: prefill.packageId,
        staff_id: prefill.staffId,
      }));
      // تخطّي خطوة الخدمات → الوقت مباشرة
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
        // ✨ تخطّي خطوة الخدمات (العميلة اختارتها بالفعل في السلة أو الرابط)
        setStep(2);
      }
    } else if (packageParam) {
      if (packages.some((p) => p.id === packageParam)) {
        setState((prev) => ({ ...prev, selectedPackageId: packageParam, selectedServices: [] }));
        // ✨ تخطّي خطوة الخدمات (البكج مُختار)
        setStep(2);
      }
    } else if (cart.hydrated && cart.items.length > 0) {
      // لو ما فيه URL param · حمّلي من السلة
      const validIds = cart.items.filter((id) => services.some((s) => s.id === id));
      if (validIds.length > 0) {
        setState((prev) => ({ ...prev, selectedServices: validIds, selectedPackageId: null }));
        // ✨ تخطّي خطوة الخدمات (السلة ليست فارغة)
        setStep(2);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.hydrated]);

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
          loyalty_points_used: state.loyalty_points_used || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'حدث خطأ');

      if (data.is_gift) {
        toast.success('تمّت الهدية 🎁 سيتم إرسال الدعوة لها قريباً');
      } else {
        toast.success('تم إرسال طلب الحجز بنجاح 🌸');
      }
      // أفرغي السلة بعد الحجز الناجح
      cart.clear();
      router.push(user ? '/account' : `/?booked=${data.booking_number}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // --- خطوات ---
  // عناوين الأزرار حسب الخطوة
  const NEXT_LABELS: Record<number, string> = {
    1: 'التالي · اختاري الوقت',
    2: 'التالي · بياناتكِ',
    3: 'التالي · التأكيد',
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-cream-200 overflow-hidden pb-28 md:pb-24">
      {/* شريط التقدم */}
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
            user={user}
          />
        )}
      </div>

      {/* ═══ شريط الـactions الثابت أسفل الشاشة ═══ */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-gradient-to-t from-cream-50 via-white to-white border-t border-gold-light/30 shadow-[0_-8px_32px_-10px_rgba(201,169,110,0.25)] backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-3 md:px-6 md:py-3.5">
          {/* الملخّص الصغير (يظهر لمّا فيه خدمات محدّدة) */}
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
                  <span className="flex items-center gap-1 hidden sm:flex">
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

          {/* الأزرار */}
          <div className="flex items-center gap-2">
            {/* زر السابق · داكن أذهب */}
            <button
              onClick={back}
              disabled={step === 1}
              className="w-11 h-11 md:w-auto md:h-auto md:px-4 md:py-2.5 rounded-xl border border-cream-300 bg-white text-ink-soft hover:text-gold-deep hover:border-gold-light disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1 text-sm font-semibold shrink-0"
              aria-label="السابق"
            >
              <ChevronRight className="w-4 h-4" />
              <span className="hidden md:inline">السابق</span>
            </button>

            {/* مؤشّر الخطوة · ديسكتوب فقط */}
            <div className="hidden md:flex items-center gap-1 px-3 text-[11px] text-ink-soft">
              <span>خطوة</span>
              <span className="font-en-display font-bold text-gold-deep">{step}</span>
              <span>من</span>
              <span className="font-en-display font-bold text-gold-deep">4</span>
            </div>

            {/* زر التالي / تأكيد */}
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

// ═══════════════════════════════════════════════════════════
// شريط الخطوات
// ═══════════════════════════════════════════════════════════
function StepIndicator({
  current, onJump,
}: {
  current: Step;
  onJump?: (n: Step) => void;
}) {
  const steps = [
    { n: 1 as Step, label: 'الخدمات' },
    { n: 2 as Step, label: 'الوقت' },
    { n: 3 as Step, label: 'بياناتكِ' },
    { n: 4 as Step, label: 'التأكيد' },
  ];

  return (
    <div className="bg-gradient-to-l from-gold-deep/5 to-transparent border-b border-cream-200 p-4 md:p-6">
      <div className="flex items-center justify-between">
        {steps.map((s, i) => {
          // الخطوات اللي تمّت أو الحاليّة · قابلة للضغط للرجوع
          const canJump = onJump && s.n <= current;
          const Tag: any = canJump ? 'button' : 'div';
          return (
            <div key={s.n} className="flex items-center flex-1">
              <Tag
                type={canJump ? 'button' : undefined}
                onClick={canJump ? () => onJump!(s.n) : undefined}
                className={`flex flex-col items-center ${canJump ? 'cursor-pointer group' : ''}`}
                title={canJump ? `الرجوع لخطوة "${s.label}"` : undefined}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-en-display font-bold text-sm transition-all ${
                    current >= s.n
                      ? 'bg-gold-deep text-cream-50 shadow-md group-hover:scale-110'
                      : 'bg-cream-100 text-ink-soft'
                  }`}
                >
                  {current > s.n ? <Check className="w-4 h-4" /> : s.n}
                </div>
                <div className={`text-[10px] md:text-xs mt-1.5 font-semibold ${
                  current >= s.n ? 'text-gold-deep group-hover:underline' : 'text-ink-soft'
                }`}>
                  {s.label}
                </div>
              </Tag>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${current > s.n ? 'bg-gold-deep' : 'bg-cream-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// الخطوة 1 — اختيار الخدمات
// ═══════════════════════════════════════════════════════════
// أيقونات التصنيفات حسب slug · من /public/images/icons/
const CATEGORY_ICONS: Record<string, string> = {
  'massage':    '/images/icons/massage.png',
  'bath':       '/images/icons/bath.png',
  'facial':     '/images/icons/facial.png',
  'nails':      '/images/icons/nails.png',
  'brows':      '/images/icons/facial.png',
  'hair-color': '/images/icons/hair-color.png',
  'hair-cut':   '/images/icons/hair-cut.png',
  'blow-dry':   '/images/icons/blow-dry.png',
  'hair-style': '/images/icons/hair-style.png',
  'hair-treat': '/images/icons/hair-treat.png',
  'makeup':     '/images/icons/facial.png',
};

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
  // التصنيف المختار · null = عرض شبكة التصنيفات
  const [activeCat, setActiveCat] = useState<string | null>(null);

  // خدمات التصنيف المختار
  const activeCatObj = activeCat ? categories.find((c) => c.id === activeCat) : null;
  const activeServices = activeCat ? services.filter((s) => s.category_id === activeCat) : [];

  // عدد الخدمات لكل تصنيف
  const countByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    services.forEach((s) => {
      m[s.category_id] = (m[s.category_id] || 0) + 1;
    });
    return m;
  }, [services]);

  // التصنيفات اللي عندها خدمات نشطة فقط
  const availableCategories = categories.filter((c) => (countByCategory[c.id] || 0) > 0);

  return (
    <div>
      {/* ═══ البكجات · دائماً مرئيّة ═══ */}
      {packages.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-gold-deep" />
            <h3 className="font-ar-display text-lg font-bold text-gold-deep">
              البكجات الجاهزة
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
              وفّري أكثر
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {packages.map((p) => {
              const sel = state.selectedPackageId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => choosePackage(p.id)}
                  className={`text-right border-2 rounded-2xl p-4 transition-all ${
                    sel
                      ? 'border-gold-deep bg-gradient-to-br from-gold-light/15 to-amber-50 shadow-md'
                      : 'border-cream-200 bg-white hover:border-gold-light hover:shadow-sm'
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

      {/* ═══ عرض شبكة التصنيفات · default view ═══ */}
      {!activeCat && (
        <div>
          <div className="mb-5">
            <h2 className="font-ar-display text-2xl font-bold text-gold-deep mb-1">
              اختاري تصنيفاً
            </h2>
            <p className="text-sm text-ink-soft">
              تصفّحي خدماتنا حسب التصنيف · واختاري ما يناسبكِ
            </p>
          </div>

          {/* شبكة التصنيفات · بطاقات فاخرة */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableCategories.map((cat) => {
              // كم خدمة من هذا التصنيف محدّدة؟
              const selectedCount = services.filter(
                (s) => s.category_id === cat.id && state.selectedServices.includes(s.id)
              ).length;
              const total = countByCategory[cat.id];
              const iconSrc = CATEGORY_ICONS[cat.slug] || CATEGORY_ICONS['facial'];

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
                  className={`group relative text-right rounded-2xl p-4 transition-all overflow-hidden ${
                    selectedCount > 0
                      ? 'bg-gradient-to-br from-gold-light/15 to-amber-50 border-2 border-gold-deep shadow-md'
                      : 'bg-white border-2 border-cream-200 hover:border-gold-light hover:shadow-md'
                  }`}
                >
                  {/* زينة الخلفيّة · لمعة ذهبيّة */}
                  <div className="absolute top-0 left-0 w-20 h-20 bg-gold-light/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* badge · عدد المحدّد */}
                  {selectedCount > 0 && (
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-gradient-to-br from-gold-deep to-ink text-cream-50 flex items-center justify-center text-[11px] font-bold shadow-md">
                      {selectedCount}
                    </div>
                  )}

                  {/* أيقونة */}
                  <div className="relative w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-cream-100 to-cream-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Image
                      src={iconSrc}
                      alt=""
                      width={36}
                      height={36}
                      className="object-contain"
                    />
                  </div>

                  {/* اسم التصنيف */}
                  <div className="text-center">
                    <div className="font-ar-display font-bold text-sm text-ink mb-0.5">
                      {cat.name_ar}
                    </div>
                    <div className="text-[10px] text-ink-soft">
                      {total} خدم{total === 1 ? 'ة' : total === 2 ? 'تين' : total > 10 ? 'ة' : 'ات'}
                    </div>
                  </div>

                  {/* سهم في الزاوية */}
                  <ChevronLeft className="absolute bottom-3 left-3 w-4 h-4 text-gold-light opacity-40 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
                </button>
              );
            })}
          </div>

          {/* نصيحة */}
          <div className="mt-6 bg-cream-50 border border-cream-200 rounded-xl p-3 flex items-center gap-2 text-[11px] text-ink-soft">
            <Sparkles className="w-3.5 h-3.5 text-gold-light shrink-0" />
            <span>تقدرين تختارين خدمات من <strong>أكثر من تصنيف</strong> · كل الاختيارات تتجمّع في الحجز</span>
          </div>
        </div>
      )}

      {/* ═══ عرض خدمات التصنيف ═══ */}
      {activeCat && activeCatObj && (
        <div>
          {/* Breadcrumb + Back */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => setActiveCat(null)}
              className="group flex items-center gap-1.5 text-sm text-ink-soft hover:text-gold-deep transition-colors"
            >
              <ChevronLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
              <span>كل التصنيفات</span>
            </button>
            {state.selectedServices.length > 0 && (
              <span className="text-[11px] text-gold-deep font-bold bg-gold-light/15 px-3 py-1 rounded-full">
                {state.selectedServices.length} مُحدّدة من جميع التصنيفات
              </span>
            )}
          </div>

          {/* Header التصنيف */}
          <div className="flex items-center gap-3 mb-5 pb-5 border-b border-cream-200">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-light/20 to-amber-100/50 flex items-center justify-center shrink-0">
              <Image
                src={CATEGORY_ICONS[activeCatObj.slug] || CATEGORY_ICONS['facial']}
                alt=""
                width={28}
                height={28}
              />
            </div>
            <div>
              <h2 className="font-ar-display text-xl font-bold text-ink">
                {activeCatObj.name_ar}
              </h2>
              {activeCatObj.description_ar && (
                <p className="text-xs text-ink-soft mt-0.5">{activeCatObj.description_ar}</p>
              )}
            </div>
          </div>

          {/* شبكة الخدمات */}
          <div className="grid sm:grid-cols-2 gap-2.5">
            {activeServices.map((s) => {
              const sel = state.selectedServices.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleService(s.id)}
                  className={`relative text-right border-2 rounded-2xl p-3.5 transition-all ${
                    sel
                      ? 'border-gold-deep bg-gradient-to-br from-gold-light/15 to-amber-50 shadow-md'
                      : 'border-cream-200 bg-white hover:border-gold-light hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm text-ink mb-1">{s.name_ar}</div>
                      {s.description_ar && (
                        <p className="text-[11px] text-ink-soft line-clamp-2 mb-2 leading-relaxed">
                          {s.description_ar}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-ink-soft">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gold-light" />
                          <span className="font-en-display">{formatDuration(s.duration_min)}</span>
                        </span>
                        {s.is_featured && (
                          <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                            <Sparkles className="w-2.5 h-2.5" />
                            مميّزة
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-left shrink-0 flex flex-col items-end gap-1">
                      <div className="font-en-display font-bold text-base text-gold-deep">
                        {s.price_from && (
                          <span className="text-[10px] font-normal text-ink-soft ml-1">من</span>
                        )}
                        {formatPrice(s.price, { showFrom: false })}
                      </div>
                      {sel ? (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-deep to-ink text-cream-50 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-cream-300" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* زر الرجوع للتصنيفات أسفل */}
          <button
            onClick={() => setActiveCat(null)}
            className="mt-5 w-full py-3 border-2 border-dashed border-cream-300 text-ink-soft rounded-xl hover:border-gold-light hover:text-gold-deep transition-colors text-sm font-semibold flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            اختاري من تصنيف آخر
          </button>
        </div>
      )}

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
  state, setState, chosenServices, chosenPackage, subtotal, duration, user,
}: {
  state: BookingState;
  setState: (s: any) => void;
  chosenServices: Service[];
  chosenPackage: Package | null;
  subtotal: number;
  duration: number;
  user: Profile | null;
}) {
  const total = Math.max(0, subtotal - state.coupon_discount - state.gift_card_amount - state.loyalty_discount);
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

        {/* نقاط الولاء — للعميلات المسجّلات فقط */}
        {user && !state.is_gift && (user.loyalty_points || 0) >= 50 && (
          <LoyaltyField
            availablePoints={user.loyalty_points || 0}
            subtotal={Math.max(0, subtotal - state.coupon_discount - state.gift_card_amount)}
            value={state.loyalty_discount}
            onApplied={(sarDiscount, pointsUsed) => setState({ ...state, loyalty_discount: sarDiscount, loyalty_points_used: pointsUsed })}
            onCleared={() => setState({ ...state, loyalty_discount: 0, loyalty_points_used: 0 })}
          />
        )}

        {/* الإجمالي */}
        <div className="bg-gradient-to-l from-gold-deep to-ink rounded-2xl p-5 text-cream-50">
          {(state.coupon_discount > 0 || state.gift_card_amount > 0 || state.loyalty_discount > 0) && (
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
          {state.loyalty_discount > 0 && (
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-success">✨ نقاط ولاء ({state.loyalty_points_used})</span>
              <span className="font-en-display text-success">
                - {formatPrice(state.loyalty_discount)}
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
