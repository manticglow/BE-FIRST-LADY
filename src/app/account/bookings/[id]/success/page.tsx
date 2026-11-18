/**
 * /account/bookings/[id]/success — الصفحة الاحتفاليّة بعد الدفع
 * ═══════════════════════════════════════════════════════════
 * اللحظة التوقيعيّة التي تُلتقط كصورة وتُشارك:
 * - خطّ يد توقيعي "جلستكِ تنتظركِ"
 * - تفاصيل الحجز
 * - زرّ إضافة للتقويم (.ics)
 * - زرّ مشاركة · واتساب · رابط الفاتورة
 */
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Share2, FileText, MapPin, Clock, MessageCircle, Sparkles } from 'lucide-react';
import SuccessActions from '@/components/booking/SuccessActions';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function BookingSuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      items:booking_items(service_name, price),
      staff:staff(name),
      profile:profiles!customer_id(full_name)
    `)
    .eq('id', id)
    .maybeSingle();

  if (!booking) notFound();

  const b = booking as any;
  const firstName = (b.profile?.full_name || b.customer_name || '').split(' ')[0] || 'عزيزتي';

  // تنسيق التاريخ للعربي
  const dateObj = new Date(`${b.booking_date}T${b.booking_time}`);
  const dateLabel = new Intl.DateTimeFormat('ar-SA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Riyadh',
  }).format(dateObj);
  const timeLabel = new Intl.DateTimeFormat('ar-SA', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Riyadh',
  }).format(dateObj);

  return (
    <div className="min-h-screen bg-cream-50 relative overflow-hidden">
      {/* بتلات ذهبيّة خفيفة في الخلفيّة */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 bg-gold-light/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-rose-soft/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-xl mx-auto px-4 py-12 pb-24">

        {/* ─── اللحظة التوقيعيّة ─── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 bg-white/80 backdrop-blur-sm border border-gold-light/30 rounded-full px-3 py-1 mb-6">
            <Sparkles className="w-3 h-3 text-gold-deep" />
            <span className="text-[10px] font-bold text-gold-deep uppercase tracking-widest">محجوز</span>
          </div>

          <h1 className="font-ar-display text-3xl md:text-4xl font-bold text-ink leading-tight mb-3">
            جلستكِ محجوزة يا {firstName}
          </h1>

          <p
            className="text-xl md:text-2xl text-gold-deep italic"
            style={{ fontFamily: 'var(--font-handwritten, Pinyon Script, cursive)' }}
          >
            نعدّ لكِ الخزامى
          </p>

          <div className="w-16 h-[1px] bg-gold-deep/40 mx-auto mt-6" />
        </div>

        {/* ─── بطاقة تفاصيل الحجز ─── */}
        <div className="bg-white/95 backdrop-blur-sm rounded-[20px] shadow-[0_20px_60px_-15px_rgba(201,169,110,0.25)] border border-cream-100 overflow-hidden">

          <div className="bg-gradient-to-br from-cream-50 to-white border-b border-cream-100 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold text-ink-soft uppercase tracking-widest">رقم الحجز</div>
                <div className="font-en-display text-base font-bold text-ink tabular-nums mt-0.5">
                  {b.booking_number}
                </div>
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold text-ink-soft uppercase tracking-widest">المبلغ</div>
                <div className="font-en-display text-base font-bold text-gold-deep tabular-nums mt-0.5">
                  {formatPrice(b.total)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-4">
            {/* الموعد */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-cream-50 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-gold-deep" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">الموعد</div>
                <div className="font-bold text-ink text-sm mt-0.5">{dateLabel}</div>
                <div className="text-xs text-ink-soft mt-0.5 font-en-display">{timeLabel}</div>
              </div>
            </div>

            {/* الخدمات */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-cream-50 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-gold-deep" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">الخدمات</div>
                <div className="font-bold text-ink text-sm mt-0.5">
                  {(b.items || []).map((it: any) => it.service_name).join(' · ') || 'خدمة'}
                </div>
                {b.staff?.name && (
                  <div className="text-xs text-ink-soft mt-0.5">مع {b.staff.name}</div>
                )}
              </div>
            </div>

            {/* المدة */}
            {b.duration_min && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-cream-50 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-gold-deep" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">المدّة</div>
                  <div className="font-bold text-ink text-sm mt-0.5">
                    {b.duration_min} دقيقة
                  </div>
                </div>
              </div>
            )}

            {/* المكان */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-cream-50 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-gold-deep" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">المكان</div>
                <div className="font-bold text-ink text-sm mt-0.5">السيّدة الأولى</div>
                <div className="text-xs text-ink-soft mt-0.5">
                  شارع يزيد بن الحكم الثقفي · حي الراية · المدينة المنوّرة
                </div>
              </div>
            </div>
          </div>

          {/* ─── أزرار الإجراءات ─── */}
          <div className="border-t border-cream-100 p-5">
            <SuccessActions booking={b} />
          </div>
        </div>

        {/* ─── رابط الفاتورة ─── */}
        <Link
          href={`/account/bookings/${b.id}/invoice`}
          className="mt-4 flex items-center justify-between gap-2 w-full bg-white/60 backdrop-blur-sm border border-cream-100 rounded-2xl p-4 hover:bg-white transition-colors"
          style={{ minHeight: '56px' }}
        >
          <div className="flex items-center gap-3">
            <FileText className="w-4 h-4 text-gold-deep" />
            <span className="text-sm font-bold text-ink">عرض الفاتورة الضريبيّة</span>
          </div>
          <span className="text-xs text-ink-soft">فتح ←</span>
        </Link>

        {/* ─── رسالة توقيعيّة أسفل ─── */}
        <div className="text-center mt-10">
          <div className="w-16 h-[1px] bg-gold-deep/30 mx-auto mb-4" />
          <p className="text-xs text-ink-soft italic leading-relaxed">
            A private sanctuary
            <br />
            Al-Madinah · Est. MMXXVI
          </p>
        </div>
      </div>
    </div>
  );
}
