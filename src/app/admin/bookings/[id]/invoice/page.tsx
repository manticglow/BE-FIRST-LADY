/**
 * فاتورة ضريبية — متوافقة مع ZATCA (هيئة الزكاة والضريبة)
 * ═══════════════════════════════════════════════════════════
 * - QR Code بصيغة TLV الرسمية
 * - عرض VAT 15% منفصلاً
 * - الرقم الضريبي
 * - بيانات المنشأة
 */
import { notFound } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { formatDuration } from '@/lib/utils';
import { generateZatcaQRImageUrl, calculateVAT, formatInvoiceNumber } from '@/lib/zatca';
import InvoicePrintButton from '@/components/admin/InvoicePrintButton';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, items:booking_items(*)')
    .eq('id', id)
    .single();

  if (!booking) notFound();

  // جلب الإعدادات الضريبية
  const { data: tax } = await supabase.from('tax_settings').select('*').eq('is_active', true).maybeSingle();

  const sellerName = tax?.business_name_ar || 'Be First Lady';
  const vatNumber = tax?.vat_number || '000000000000000';
  const vatRate = Number(tax?.vat_rate || 15);
  const applyVAT = tax?.apply_vat && tax?.vat_number;
  const pricesIncludeVAT = tax?.prices_include_vat ?? true;

  // الحسابات
  let subtotal, vatAmount, grandTotal;
  if (applyVAT) {
    const vatCalc = calculateVAT(Number(booking.total), vatRate, pricesIncludeVAT);
    subtotal = vatCalc.subtotal;
    vatAmount = vatCalc.vatAmount;
    grandTotal = vatCalc.total;
  } else {
    subtotal = Number(booking.subtotal);
    vatAmount = 0;
    grandTotal = Number(booking.total);
  }

  const issuedAt = new Date(booking.invoice_issued_at || booking.created_at);
  const invoiceNumber = booking.invoice_number || `INV-${(booking.booking_number || booking.id.slice(0, 8)).replace('BK-', '')}`;

  // ZATCA QR
  const qrUrl = applyVAT
    ? generateZatcaQRImageUrl({
        sellerName,
        vatNumber,
        timestamp: issuedAt.toISOString(),
        total: grandTotal,
        vatAmount,
      })
    : `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/invite/${booking.booking_number}`
      )}&color=5a4628&bgcolor=ffffff&margin=1`;

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .invoice { box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
        }
      `}</style>

      <div className="min-h-screen bg-cream-50 p-6">
        <div className="max-w-2xl mx-auto">
          {/* زر الطباعة */}
          <div className="no-print mb-4 flex items-center justify-between">
            <a href="/admin/bookings" className="text-sm text-ink-soft hover:text-gold-deep">
              ← العودة للحجوزات
            </a>
            <InvoicePrintButton />
          </div>

          {/* تنبيه لو VAT مش مفعّل */}
          {!applyVAT && (
            <div className="no-print bg-warning/10 border border-warning/30 rounded-xl p-3 mb-4 text-xs text-ink">
              ⚠ الفاتورة الضريبية ZATCA غير مفعّلة — <a href="/admin/settings" className="text-gold-deep font-bold">فعّليها من الإعدادات</a> لإظهار VAT 15% والرقم الضريبي.
            </div>
          )}

          {/* الفاتورة */}
          <div className="invoice bg-white rounded-3xl shadow-xl overflow-hidden border border-cream-200" dir="rtl">
            {/* الهيدر */}
            <div className="bg-gradient-to-l from-gold-deep to-ink text-cream-50 p-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-4 right-4 w-24 h-24 bg-gold-light rounded-full blur-2xl" />
                <div className="absolute bottom-4 left-4 w-32 h-32 bg-gold rounded-full blur-2xl" />
              </div>

              <div className="relative z-10 flex items-start justify-between gap-4">
                <div>
                  <Image src="/images/logo-white.svg" alt={sellerName} width={70} height={70} />
                  <div className="font-en-label text-[9px] tracking-[0.4em] text-gold-light mt-3">SPA & SALON</div>
                  <div className="font-ar-display text-xl mt-1 font-bold">{sellerName}</div>
                  {tax?.address && (
                    <div className="text-[10px] text-gold-light mt-1">{tax.address}</div>
                  )}
                  {tax?.city && (
                    <div className="text-[10px] text-gold-light">{tax.city}</div>
                  )}
                  {applyVAT && (
                    <div className="text-[10px] text-cream-50 mt-2 bg-white/10 px-2 py-1 rounded inline-block font-en-display">
                      VAT: {vatNumber}
                    </div>
                  )}
                  {tax?.commercial_reg && (
                    <div className="text-[10px] text-gold-light mt-1 font-en-display">
                      س.ت: {tax.commercial_reg}
                    </div>
                  )}
                </div>

                <div className="text-left">
                  <div className="font-en-label text-[9px] tracking-[0.3em] text-gold-light">
                    {applyVAT ? 'TAX INVOICE' : 'INVOICE'}
                  </div>
                  <div className="font-ar-display text-2xl font-bold mt-1">
                    {applyVAT ? 'فاتورة ضريبية' : 'فاتورة'}
                  </div>
                  <div className="text-xs font-en-display mt-2 opacity-90 bg-white/10 px-2 py-1 rounded">
                    {invoiceNumber}
                  </div>
                  <div className="text-[10px] text-gold-light mt-1.5 font-en-display">
                    {issuedAt.toLocaleDateString('en-GB')} · {issuedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>

            {/* المحتوى */}
            <div className="p-8 space-y-6">
              {/* معلومات العميلة */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[10px] font-bold text-gold-deep uppercase tracking-wider mb-2">
                    العميلة
                  </div>
                  <div className="font-ar-display font-bold text-lg text-ink">{booking.customer_name}</div>
                  <div className="text-xs text-ink-soft mt-1 font-en-display">{booking.customer_phone}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-gold-deep uppercase tracking-wider mb-2">
                    موعد الخدمة
                  </div>
                  <div className="font-en-display font-bold text-lg text-ink">
                    {booking.booking_date}
                  </div>
                  <div className="text-xs text-ink-soft mt-1 font-en-display">
                    الساعة {booking.booking_time.slice(0, 5)} · {formatDuration(booking.duration_min)}
                  </div>
                </div>
              </div>

              {/* الهدية */}
              {booking.is_gift && booking.gift_from_name && (
                <div className="bg-gold-light/10 border border-gold-light/30 rounded-xl p-3 flex items-center gap-2 text-xs">
                  <span className="text-lg">🎁</span>
                  <div>
                    <span className="text-ink-soft">هدية من:</span>
                    <strong className="text-gold-deep mr-1">{booking.gift_from_name}</strong>
                  </div>
                </div>
              )}

              {/* قائمة الخدمات */}
              <div>
                <div className="text-[10px] font-bold text-gold-deep uppercase tracking-wider mb-3">
                  تفاصيل الخدمات
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gold-light/40 text-right">
                      <th className="py-2 text-xs font-bold text-gold-deep">#</th>
                      <th className="py-2 text-xs font-bold text-gold-deep">الوصف</th>
                      <th className="py-2 text-xs font-bold text-gold-deep text-center">المدة</th>
                      <th className="py-2 text-xs font-bold text-gold-deep text-left">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booking.items?.map((item: any, i: number) => (
                      <tr key={item.id} className="border-b border-cream-100">
                        <td className="py-3 text-xs text-ink-soft font-en-display">{i + 1}</td>
                        <td className="py-3 text-sm text-ink">{item.service_name}</td>
                        <td className="py-3 text-xs text-ink-soft text-center font-en-display">
                          {formatDuration(item.duration_min)}
                        </td>
                        <td className="py-3 text-sm font-en-display font-bold text-ink text-left">
                          {Number(item.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* الإجمالي + QR */}
              <div className="grid grid-cols-5 gap-6 pt-4">
                <div className="col-span-2">
                  <div className="text-[10px] font-bold text-gold-deep uppercase tracking-wider mb-2 text-center">
                    {applyVAT ? 'QR الفاتورة الضريبية' : 'رمز الحجز'}
                  </div>
                  <div className="bg-white border-2 border-cream-200 rounded-xl p-2">
                    <img
                      src={qrUrl}
                      alt="QR"
                      className="mx-auto"
                      width={180}
                      height={180}
                    />
                  </div>
                  <div className="text-center text-[9px] text-ink-soft mt-2 font-en-display leading-tight">
                    {applyVAT ? 'ZATCA Phase 1 Compliant' : booking.booking_number}
                  </div>
                </div>

                <div className="col-span-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-ink-soft">المجموع {applyVAT ? '(قبل الضريبة)' : ''}</span>
                    <span className="font-en-display font-bold">{subtotal.toFixed(2)} ر.س</span>
                  </div>

                  {Number(booking.discount) > 0 && (
                    <div className="flex items-center justify-between py-1 text-success">
                      <span>الخصم</span>
                      <span className="font-en-display font-bold">-{Number(booking.discount).toFixed(2)} ر.س</span>
                    </div>
                  )}

                  {applyVAT && (
                    <div className="flex items-center justify-between py-1 bg-gold-light/10 px-2 rounded">
                      <span className="text-gold-deep text-xs">ضريبة القيمة المضافة ({vatRate}%)</span>
                      <span className="font-en-display font-bold text-gold-deep">{vatAmount.toFixed(2)} ر.س</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-3 border-t-2 border-gold-deep mt-2">
                    <span className="font-bold text-gold-deep">
                      الإجمالي {applyVAT ? 'شامل الضريبة' : ''}
                    </span>
                    <span className="font-en-display text-2xl font-bold text-gold-deep">
                      {grandTotal.toFixed(2)} ر.س
                    </span>
                  </div>

                  <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
                    booking.payment_status === 'paid' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
                  }`}>
                    {booking.payment_status === 'paid' ? '✓ مدفوعة' : '⚠ غير مدفوعة'}
                  </div>
                </div>
              </div>

              {/* ملاحظات */}
              {booking.customer_notes && (
                <div className="bg-cream-50 rounded-xl p-3 text-xs">
                  <strong className="text-gold-deep">ملاحظات:</strong> {booking.customer_notes}
                </div>
              )}
            </div>

            {/* الفوتر */}
            <div className="bg-cream-50 px-8 py-4 border-t border-cream-200">
              <div className="flex items-center justify-between text-xs text-ink-soft">
                <div>شكراً لثقتكِ 💛</div>
                <div className="font-en-display italic text-gold-deep">نعتني بكِ لتُزهري</div>
              </div>
              {applyVAT && (
                <div className="text-[9px] text-ink-soft/70 text-center mt-2 font-en-display">
                  This is a tax invoice compliant with ZATCA Phase 1 requirements
                </div>
              )}
            </div>
          </div>

          <div className="no-print text-center text-xs text-ink-soft mt-4">
            اضغطي Ctrl+P (أو Cmd+P) للطباعة أو حفظ PDF
          </div>
        </div>
      </div>
    </>
  );
}
