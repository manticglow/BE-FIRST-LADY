/**
 * /account/bookings/[id] — تفاصيل الحجز + حالة الدفع
 * ═══════════════════════════════════════════════════════════
 * - يعرض ملخّص الحجز
 * - يفهم ?payment=success / cancelled / failed من Moyasar callback
 * - زر "ادفع الآن" لو مش مدفوع
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle2, XCircle, AlertCircle, Calendar, Clock,
  Scissors, CreditCard, ChevronRight, Home, Sparkles,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

type BookingDetail = {
  id: string;
  booking_number: string;
  customer_id: string | null;
  customer_phone: string | null;
  customer_name: string | null;
  total: number;
  subtotal: number;
  discount: number;
  status: string;
  payment_status: string;
  booking_date: string;
  booking_time: string | null;
  duration_min: number | null;
  is_gift: boolean;
};

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { id } = await params;
  const { payment } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/account/bookings/${id}`);

  // admin client لتجاوز RLS (نتحقّق من الصلاحيّة يدوياً)
  const admin = createAdminClient();
  const { data: bookingRaw } = await admin
    .from('bookings')
    .select('id, booking_number, customer_id, customer_phone, customer_name, total, subtotal, discount, status, payment_status, booking_date, booking_time, duration_min, is_gift')
    .eq('id', id)
    .single();
  const booking = bookingRaw as BookingDetail | null;

  if (!booking) notFound();

  // تحقّق ملكيّة
  const { data: userProfile } = await admin
    .from('profiles')
    .select('phone, full_name')
    .eq('id', user.id)
    .single();
  const userPhone = (userProfile as { phone: string | null; full_name: string | null } | null)?.phone;
  const isOwner = booking.customer_id === user.id;
  const isPhoneMatch = !booking.customer_id && booking.customer_phone === userPhone;

  if (!isOwner && !isPhoneMatch) {
    redirect('/account');
  }

  // ربط الحجز بالحساب لو guest
  if (!booking.customer_id && isPhoneMatch) {
    await (admin as any)
      .from('bookings')
      .update({ customer_id: user.id })
      .eq('id', booking.id);
  }

  // لو payment=success · نتأكّد من حالة الدفع (Webhook قد يكون متأخّر)
  const isPaid = booking.payment_status === 'paid' || payment === 'success';

  // بنرات حسب حالة الـcallback من بوّابة الدفع
  const statusBanner = (() => {
    if (payment === 'success' || isPaid) {
      return {
        type: 'success' as const,
        icon: CheckCircle2,
        title: 'تم تأكيد حجزكِ بنجاح 🌸',
        message: 'استلمتِ تأكيداً عبر الواتساب · نشوفكِ قريباً!',
      };
    }
    if (payment === 'cancelled') {
      return {
        type: 'warning' as const,
        icon: AlertCircle,
        title: 'تم إلغاء عمليّة الدفع',
        message: 'حجزكِ محفوظ · تقدرين تدفعين لاحقاً',
      };
    }
    if (payment === 'failed') {
      return {
        type: 'error' as const,
        icon: XCircle,
        title: 'لم تنجح عمليّة الدفع',
        message: 'جرّبي مرّة ثانية أو اختاري طريقة دفع أخرى',
      };
    }
    if (payment === 'already_paid') {
      return {
        type: 'info' as const,
        icon: CheckCircle2,
        title: 'هذا الحجز مدفوع بالفعل',
        message: 'لا داعي للدفع مرّة ثانية',
      };
    }
    return null;
  })();

  const dateFormatted = new Date(booking.booking_date).toLocaleDateString('ar-SA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const bannerColors = {
    success: 'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-900',
    warning: 'from-amber-50 to-orange-50 border-amber-200 text-amber-900',
    error:   'from-rose-50 to-pink-50 border-rose-200 text-rose-900',
    info:    'from-blue-50 to-sky-50 border-blue-200 text-blue-900',
  };

  const iconColors = {
    success: 'bg-emerald-500 text-white',
    warning: 'bg-amber-500 text-white',
    error:   'bg-rose-500 text-white',
    info:    'bg-blue-500 text-white',
  };

  return (
    <div className="min-h-screen bg-cream-50 py-6">
      <div className="max-w-md mx-auto px-4 space-y-4">
        {/* Back */}
        <Link
          href="/account"
          className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800"
        >
          <ChevronRight className="w-4 h-4" />
          عودة لحسابكِ
        </Link>

        {/* Status banner (لو فيه payment status) */}
        {statusBanner && (
          <div className={`bg-gradient-to-br ${bannerColors[statusBanner.type]} rounded-3xl p-5 border-2 shadow-lg animate-in fade-in zoom-in-95`}>
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconColors[statusBanner.type]}`}>
                <statusBanner.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 pt-0.5">
                <div className="font-ar-display font-bold text-lg mb-0.5">{statusBanner.title}</div>
                <div className="text-sm opacity-90">{statusBanner.message}</div>
              </div>
            </div>
          </div>
        )}

        {/* ملخّص الحجز */}
        <div className="bg-white rounded-3xl shadow-sm border border-cream-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-gold-deep/5 via-gold-light/10 to-cream-50 p-5 border-b border-cream-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold-deep" />
                <span className="font-ar-display font-bold text-gold-deep">Be First Lady</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                isPaid
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {isPaid ? '✓ مدفوع' : '⏳ غير مدفوع'}
              </span>
            </div>
            <div className="text-xs text-stone-500 font-en-display">
              #{booking.booking_number}
            </div>
          </div>

          {/* Body */}
          <div className="p-5 space-y-3">
            {/* التاريخ والوقت */}
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gold-deep shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs text-stone-500">الموعد</div>
                <div className="font-bold text-ink">{dateFormatted}</div>
                {booking.booking_time && (
                  <div className="text-sm text-stone-600 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    {booking.booking_time}
                  </div>
                )}
              </div>
            </div>

            {/* المدّة */}
            {booking.duration_min && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gold-deep shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs text-stone-500">المدّة المتوقّعة</div>
                  <div className="font-bold text-ink">{booking.duration_min} دقيقة</div>
                </div>
              </div>
            )}

            {/* المبلغ */}
            <div className="border-t border-cream-100 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>المجموع الفرعي</span>
                <span className="font-en-display">{Number(booking.subtotal || 0).toFixed(2)} ر.س</span>
              </div>
              {Number(booking.discount) > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>الخصم</span>
                  <span className="font-en-display">− {Number(booking.discount).toFixed(2)} ر.س</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-gold-deep pt-2 border-t border-cream-100">
                <span>الإجمالي</span>
                <span className="font-en-display">{Number(booking.total).toFixed(2)} ر.س</span>
              </div>
            </div>
          </div>
        </div>

        {/* زر الدفع (لو غير مدفوع) */}
        {!isPaid && booking.total > 0 && (
          <Link
            href={`/account/bookings/${booking.id}/pay`}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 text-white font-ar-display font-bold text-base shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            <CreditCard className="w-5 h-5" />
            ادفعي الآن · {Number(booking.total).toFixed(2)} ر.س
          </Link>
        )}

        {/* أزرار إضافيّة */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/account"
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-cream-200 text-ink hover:border-gold-light transition-colors text-sm font-bold"
          >
            <Home className="w-4 h-4" />
            حسابي
          </Link>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-cream-200 text-ink hover:border-gold-light transition-colors text-sm font-bold"
          >
            <Sparkles className="w-4 h-4" />
            الرئيسيّة
          </Link>
        </div>
      </div>
    </div>
  );
}
