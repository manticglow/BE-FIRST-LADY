/**
 * صفحة الدعوة — Public Invitation Page
 * ═══════════════════════════════════════════════════════════
 * - تفتح من رابط الواتساب: /invite/BK-123456
 * - تعرض الدعوة بتصميم فاخر + QR code
 * - المستقبِلة تريها للصالون عند الحضور
 */
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { createAdminClient } from '@/lib/supabase/server';
import { formatPrice, formatDuration, formatDate } from '@/lib/utils';
import { Calendar, Clock, Hash, MapPin, Gift, Heart } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ bookingNumber: string }>;
}

export default async function InvitationPage({ params }: Props) {
  const { bookingNumber } = await params;
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from('bookings')
    .select('*, items:booking_items(*)')
    .eq('booking_number', bookingNumber)
    .eq('is_gift', true)
    .single();

  if (!booking) notFound();

  // رابط Google Maps للصالون (عدّليه من الإعدادات لاحقاً)
  const salonUrl = 'https://maps.app.goo.gl/befirstlady';
  const qrData = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://befirstlady.com'}/invite/${bookingNumber}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrData)}&color=5a4628&bgcolor=fbf7ef&margin=2`;

  return (
    <main className="min-h-screen bg-cream-50 py-6 px-4" dir="rtl">
      {/* البطاقة الفاخرة */}
      <div className="max-w-md mx-auto">
        <div className="bg-gradient-to-b from-cream-50 to-white rounded-[2rem] shadow-2xl overflow-hidden border border-gold-light/40 relative">
          {/* الزخارف الزاوية */}
          <div className="absolute top-6 right-6 w-16 h-16 border-t-2 border-r-2 border-gold rounded-tr-2xl pointer-events-none" />
          <div className="absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 border-gold rounded-tl-2xl pointer-events-none" />
          <div className="absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 border-gold rounded-br-2xl pointer-events-none" />
          <div className="absolute bottom-6 left-6 w-16 h-16 border-b-2 border-l-2 border-gold rounded-bl-2xl pointer-events-none" />

          {/* الهيدر الذهبي */}
          <div className="bg-gradient-to-b from-gold-deep via-gold-deep to-ink text-cream-50 pt-10 pb-8 px-6 text-center relative overflow-hidden">
            {/* زخارف ضوئية */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-4 right-4 w-24 h-24 bg-gold-light rounded-full blur-2xl" />
              <div className="absolute bottom-4 left-4 w-32 h-32 bg-gold rounded-full blur-2xl" />
            </div>

            <div className="relative z-10">
              <Image
                src="/images/logo-white.svg"
                alt="Be First Lady"
                width={100}
                height={100}
                className="mx-auto drop-shadow-lg"
              />
              <div className="font-en-label text-[10px] tracking-[0.4em] text-gold-light mt-4">
                SPA & SALON · MADINAH
              </div>
              <div className="font-en-display italic text-2xl mt-1">
                Be First Lady
              </div>
            </div>
          </div>

          {/* المحتوى */}
          <div className="px-6 py-8">
            {/* رمز الهدية */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-full bg-gold-light/20 flex items-center justify-center">
                <Gift className="w-6 h-6 text-gold-deep" />
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="font-en-label text-[10px] tracking-[0.3em] text-gold mb-2">
                A GIFT FOR YOU
              </div>
              <h1 className="font-ar-display text-3xl font-bold text-gold-deep leading-tight">
                دعوة خاصة إليكِ
              </h1>
              <div className="divider-gold w-16 mx-auto mt-3" />
            </div>

            {/* الاسم */}
            <div className="text-center mb-6">
              <p className="text-sm text-ink-soft mb-1">يا</p>
              <p className="font-ar-display text-2xl font-bold text-ink">{booking.customer_name}</p>
            </div>

            {/* الرسالة الشخصية */}
            {booking.gift_message && (
              <div className="bg-gold-light/10 border border-gold-light/30 rounded-2xl p-5 mb-6 relative">
                <Heart className="absolute -top-3 right-5 w-6 h-6 text-gold-deep fill-current bg-cream-50 rounded-full p-1" />
                <p className="text-sm text-ink leading-loose italic text-center">
                  "{booking.gift_message}"
                </p>
                <p className="text-xs text-gold-deep font-bold text-center mt-3 pt-3 border-t border-gold-light/30">
                  — {booking.gift_from_name}
                </p>
              </div>
            )}

            {/* الخدمات */}
            <div className="mb-6">
              <div className="text-xs font-bold text-gold-deep uppercase tracking-wider mb-3 text-center">
                الخدمات المختارة لكِ
              </div>
              <ul className="space-y-2 bg-cream-50 rounded-2xl p-4 border border-cream-200">
                {booking.items?.map((item: any) => (
                  <li key={item.id} className="flex items-start gap-2 text-sm text-ink">
                    <span className="text-gold-deep mt-1 shrink-0">✦</span>
                    <span className="flex-1">{item.service_name}</span>
                    <span className="text-xs text-ink-soft font-en-display shrink-0">
                      {formatDuration(item.duration_min)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* التاريخ والوقت */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white border border-cream-200 rounded-xl p-3 text-center">
                <Calendar className="w-5 h-5 text-gold-deep mx-auto mb-1" />
                <div className="text-[10px] text-ink-soft">التاريخ</div>
                <div className="font-en-display font-bold text-sm text-ink mt-0.5">
                  {booking.booking_date}
                </div>
              </div>
              <div className="bg-white border border-cream-200 rounded-xl p-3 text-center">
                <Clock className="w-5 h-5 text-gold-deep mx-auto mb-1" />
                <div className="text-[10px] text-ink-soft">الوقت</div>
                <div className="font-en-display font-bold text-sm text-ink mt-0.5">
                  {booking.booking_time.slice(0, 5)}
                </div>
              </div>
            </div>

            {/* رمز QR */}
            <div className="bg-white border-2 border-dashed border-gold-light rounded-2xl p-5 text-center mb-6">
              <div className="text-xs font-bold text-gold-deep uppercase tracking-wider mb-3">
                رمز الدعوة
              </div>
              <img
                src={qrUrl}
                alt="QR Code"
                className="mx-auto rounded-lg"
                width={200}
                height={200}
              />
              <div className="flex items-center justify-center gap-1 text-xs text-ink-soft mt-3">
                <Hash className="w-3 h-3" />
                <span className="font-en-display font-bold text-gold-deep">{bookingNumber}</span>
              </div>
              <p className="text-[11px] text-ink-soft mt-2 leading-relaxed">
                أرِي هذا الرمز عند الحضور
              </p>
            </div>

            {/* الموقع */}
            <a
              href={salonUrl}
              target="_blank"
              rel="noopener"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gold-deep text-cream-50 rounded-xl font-bold text-sm hover:bg-ink transition-colors"
            >
              <MapPin className="w-4 h-4" />
              موقع الصالون — المدينة المنوّرة
            </a>

            {/* فوتر */}
            <div className="text-center mt-6 pt-6 border-t border-cream-200">
              <p className="text-[11px] text-ink-soft leading-relaxed">
                الدعوة سارية حتى موعد الحجز · <br />
                للاستفسار اتصلي بنا على الواتساب
              </p>
              <div className="font-en-display italic text-gold-deep text-sm mt-2">
                نعتني بكِ لتُزهري 🌸
              </div>
            </div>
          </div>
        </div>

        {/* معلومات تحت البطاقة */}
        <p className="text-center text-xs text-ink-soft mt-6 leading-relaxed">
          هدية مُقدَّمة إليكِ من <strong>{booking.gift_from_name}</strong><br />
          تستحقين كل جمال 💛
        </p>
      </div>
    </main>
  );
}
