/**
 * /account/bookings/[id]/pay — صفحة الدفع
 * ═══════════════════════════════════════════════════════════
 * - تعرض ملخّص الحجز + PaymentSelector
 * - صلاحيّات: فقط صاحبة الحجز
 */
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import PaymentSelector from '@/components/payment/PaymentSelector';
import Link from 'next/link';
import { ChevronRight, Calendar, Clock, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=/account/bookings/${id}/pay`);

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, customer_id, total, status, payment_status, booking_date, booking_time, customer_name')
    .eq('id', id)
    .single();

  if (!booking) notFound();
  if ((booking as any).customer_id !== user.id) redirect('/account');
  if ((booking as any).payment_status === 'paid') {
    redirect(`/account/bookings/${id}?payment=already_paid`);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('loyalty_points')
    .eq('id', user.id)
    .single();

  const { data: settings } = await supabase
    .from('company_settings')
    .select('payment_deposit_pct, payment_deposit_threshold, loyalty_point_value')
    .limit(1)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-cream-50 py-6">
      <div className="max-w-md mx-auto px-4 space-y-4">

        {/* Back link */}
        <Link
          href={`/account/bookings/${id}`}
          className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800"
        >
          <ChevronRight className="w-4 h-4" />
          عودة للحجز
        </Link>

        {/* Booking summary */}
        <div className="bg-white rounded-2xl p-4 border border-cream-200">
          <div className="editorial-eyebrow text-stone-500 mb-2">BOOKING</div>
          <h1 className="font-ar-display text-xl font-bold text-stone-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            {(booking as any).customer_name || 'حجزكِ'}
          </h1>
          <div className="flex items-center gap-3 text-xs text-stone-600 pt-2 border-t border-cream-100">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date((booking as any).booking_date).toLocaleDateString('ar-SA')}
            </span>
            {(booking as any).booking_time && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {(booking as any).booking_time}
              </span>
            )}
          </div>
        </div>

        {/* Payment selector */}
        <PaymentSelector
          opts={{
            bookingId: (booking as any).id,
            totalAmount: Number((booking as any).total),
            loyaltyPointsAvailable: Number((profile as any)?.loyalty_points || 0),
            loyaltyPointValue: Number((settings as any)?.loyalty_point_value || 0.10),
            depositEnabled: true,
            depositPct: Number((settings as any)?.payment_deposit_pct || 25),
            depositThreshold: Number((settings as any)?.payment_deposit_threshold || 500),
            gateways: {
              moyasar: !!process.env.MOYASAR_SECRET_KEY,
              tabby: !!process.env.TABBY_SECRET_KEY,
              tamara: !!process.env.TAMARA_API_TOKEN,
            },
          }}
        />

      </div>
    </div>
  );
}
