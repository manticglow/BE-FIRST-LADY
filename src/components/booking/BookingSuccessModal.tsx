/**
 * BookingSuccessModal — Modal يظهر بعد الحجز الناجح للعميلة الغير مسجّلة
 * ═══════════════════════════════════════════════════════════
 * يظهر لمّا الرابط يحتوي ?booked=XXX
 * - رقم الحجز للحفظ
 * - زر "أكّدي عبر واتساب" (يفتح واتساب العميلة بتفاصيل الحجز جاهزة للإرسال للمركز)
 * - زر "إنشاء حساب" (اختياري · لحفظ الحجوزات)
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, MessageCircle, Copy, X, UserPlus } from 'lucide-react';
import { waLink } from '@/lib/utils';

export default function BookingSuccessModal() {
  const router = useRouter();
  const [bookingNumber, setBookingNumber] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const booked = params.get('booked');
    if (booked) setBookingNumber(booked);
  }, []);

  if (!bookingNumber) return null;

  function close() {
    setBookingNumber(null);
    // نظّفي الرابط
    const url = new URL(window.location.href);
    url.searchParams.delete('booked');
    router.replace(url.pathname + (url.search || ''), { scroll: false });
  }

  function copyNumber() {
    try {
      navigator.clipboard.writeText(bookingNumber!);
    } catch {}
  }

  function sendWhatsapp() {
    const message = `السلام عليكم 🌸\nحجزت الآن في Be First Lady\n#️⃣ رقم الحجز: ${bookingNumber}\nأرجو تأكيد الحجز 💛`;
    window.open(waLink(message), '_blank');
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in"
      onClick={close}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* زر الإغلاق */}
        <button
          onClick={close}
          className="absolute top-4 left-4 p-2 hover:bg-cream-100 rounded-full transition-colors text-ink-soft"
          aria-label="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {/* الهيدر */}
        <div className="pt-10 pb-6 px-6 text-center bg-gradient-to-b from-gold-light/10 to-transparent">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center shadow-lg shadow-success/30 mb-4 animate-in zoom-in">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-ar-display text-2xl font-bold text-gold-deep mb-1">
            تم إرسال طلب الحجز 🌸
          </h2>
          <p className="text-sm text-ink-soft">
            سنتواصل معكِ خلال 15 دقيقة لتأكيد موعدكِ
          </p>
        </div>

        {/* رقم الحجز */}
        <div className="px-6 pb-4">
          <div className="bg-cream-50 border border-cream-200 rounded-2xl p-4 mb-4">
            <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider mb-1">
              رقم الحجز
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="font-en-display text-xl font-bold text-gold-deep">
                {bookingNumber}
              </div>
              <button
                onClick={copyNumber}
                className="p-2 hover:bg-cream-100 rounded-lg text-ink-soft hover:text-gold-deep transition-colors"
                title="نسخ"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* زر واتساب — الأهم */}
          <button
            onClick={sendWhatsapp}
            className="w-full bg-gradient-to-br from-green-500 to-green-600 text-white font-ar-display font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
          >
            <MessageCircle className="w-5 h-5" />
            أكّدي عبر واتساب الآن
          </button>

          <p className="text-[11px] text-ink-soft text-center mt-2 leading-relaxed">
            اضغطي الزر لتأكيد الحجز معنا بشكل أسرع · هذا يفتح واتسابك
          </p>

          {/* زر إنشاء حساب */}
          <Link
            href="/signup"
            onClick={close}
            className="mt-4 w-full bg-cream-50 border border-cream-200 text-ink-soft hover:text-gold-deep hover:border-gold-light py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            أنشئي حساباً لمتابعة حجوزاتكِ (اختياري)
          </Link>
        </div>

        {/* شريط سفلي */}
        <div className="bg-cream-50 px-6 py-3 text-center border-t border-cream-200">
          <p className="text-[11px] text-ink-soft">
            احفظي رقم الحجز للمراجعة لاحقاً 💛
          </p>
        </div>
      </div>
    </div>
  );
}
