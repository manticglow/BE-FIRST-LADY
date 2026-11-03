/**
 * فاتورة ضريبية — متوافقة مع ZATCA (هيئة الزكاة والضريبة)
 * ═══════════════════════════════════════════════════════════
 * - QR Code بصيغة TLV الرسمية
 * - عرض VAT 15% منفصلاً
 * - الرقم الضريبي
 * - بيانات المنشأة
 * - تصميم مُحسَّن للطباعة · صفحة A4 واحدة فقط
 */
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatDuration } from '@/lib/utils';
import { generateZatcaQRImageUrl, calculateVAT } from '@/lib/zatca';
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

  const { data: tax } = await supabase.from('tax_settings').select('*').eq('is_active', true).maybeSingle();

  const sellerName = tax?.business_name_ar || 'Be First Lady';
  const vatNumber = tax?.vat_number || '000000000000000';
  const vatRate = Number(tax?.vat_rate || 15);
  const applyVAT = tax?.apply_vat && tax?.vat_number;
  const pricesIncludeVAT = tax?.prices_include_vat ?? true;

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

  const qrUrl = applyVAT
    ? generateZatcaQRImageUrl({
        sellerName,
        vatNumber,
        timestamp: issuedAt.toISOString(),
        total: grandTotal,
        vatAmount,
      })
    : `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/invite/${booking.booking_number}`
      )}&color=5a4628&bgcolor=ffffff&margin=1`;

  return (
    <>
      <style>{`
        /* ═══════════════════════════════════════════════════════
           📄 طباعة PDF · A4 واحدة فقط · بدون sidebar
           ═══════════════════════════════════════════════════════ */
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 210mm !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }

          /* المفتاح: إخفاء كل شي ثم إظهار الفاتورة فقط */
          body * {
            visibility: hidden !important;
          }

          .invoice-sheet,
          .invoice-sheet * {
            visibility: visible !important;
          }

          /* وضع الفاتورة في أعلى الصفحة */
          .invoice-sheet {
            position: absolute !important;
            top: 0 !important;
            right: 0 !important;
            left: 0 !important;
            margin: 0 auto !important;
            width: 210mm !important;
            max-width: 210mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            padding: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            border: none !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            overflow: hidden !important;
          }

          .invoice-sheet * {
            page-break-inside: avoid !important;
          }

          /* إخفاء أي زر طباعة أو تنبيه */
          .no-print {
            display: none !important;
            visibility: hidden !important;
          }
        }

        /* تثبيت الحجم على A4 في العرض العادي كمان · عشان نشوف كيف راح تطلع */
        .invoice-sheet {
          width: 210mm;
          min-height: 297mm;
        }
        @media (max-width: 240mm) {
          .invoice-sheet {
            width: 100%;
            min-height: auto;
          }
        }
      `}</style>

      <div className="min-h-screen bg-cream-50 p-4 md:p-6 print-passthrough print-wrapper">
        <div className="max-w-[210mm] mx-auto">
          {/* زر الطباعة · لا يظهر في الطباعة */}
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

          {/* ═══════════════════════════════════════════════════════
              🧾 الفاتورة — تصميم فاخر · صفحة واحدة
              ═══════════════════════════════════════════════════════ */}
          <div className="invoice-sheet bg-white shadow-xl rounded-lg overflow-hidden relative" dir="rtl">

            {/* زخرفة ذهبيّة في الخلفيّة */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
              <div
                className="absolute inset-0 opacity-[0.02]"
                style={{
                  backgroundImage: `url('/images/lotus-decoration.svg')`,
                  backgroundSize: '400px',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
            </div>

            {/* ─── الهيدر ─── */}
            <header className="invoice-header relative bg-gradient-to-l from-gold-deep via-amber-800 to-ink text-cream-50 px-10 py-6 overflow-hidden">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-40 h-40 bg-gold-light rounded-full blur-3xl" />
              </div>

              <div className="relative z-10 flex items-start justify-between gap-4">
                {/* الشعار + بيانات المنشأة */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-12 h-12 rounded-full bg-cream-50/10 backdrop-blur-sm border border-gold-light/30 flex items-center justify-center">
                      <Image src="/images/logo-white.svg" alt={sellerName} width={32} height={32} />
                    </div>
                    <div>
                      <div className="font-en-label text-[8px] tracking-[0.3em] text-gold-light/90">SPA & SALON</div>
                      <div className="font-ar-display text-lg font-bold leading-tight">{sellerName}</div>
                    </div>
                  </div>
                  {tax?.address && <div className="text-[9px] text-gold-light/80 mt-1">{tax.address}</div>}
                  {tax?.city && <div className="text-[9px] text-gold-light/80">{tax.city}</div>}
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {applyVAT && (
                      <div className="text-[9px] font-en-display bg-white/15 px-2 py-0.5 rounded">
                        VAT: {vatNumber}
                      </div>
                    )}
                    {tax?.commercial_reg && (
                      <div className="text-[9px] font-en-display bg-white/15 px-2 py-0.5 rounded">
                        س.ت: {tax.commercial_reg}
                      </div>
                    )}
                  </div>
                </div>

                {/* رقم الفاتورة + التاريخ */}
                <div className="text-left">
                  <div className="font-en-label text-[8px] tracking-[0.3em] text-gold-light/90">
                    {applyVAT ? 'TAX INVOICE' : 'INVOICE'}
                  </div>
                  <div className="font-ar-display text-xl font-bold mt-0.5">
                    {applyVAT ? 'فاتورة ضريبية' : 'فاتورة'}
                  </div>
                  <div className="mt-2 inline-block bg-cream-50/15 backdrop-blur-sm px-3 py-1 rounded-md text-xs font-en-display font-bold border border-gold-light/30">
                    {invoiceNumber}
                  </div>
                  <div className="text-[10px] text-gold-light/90 mt-1.5 font-en-display">
                    {issuedAt.toLocaleDateString('en-GB')} · {issuedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </header>

            {/* ─── شريط ذهبي فاصل ─── */}
            <div className="h-1 bg-gradient-to-l from-gold-light via-gold-deep to-gold-light" />

            {/* ─── محتوى الفاتورة ─── */}
            <main className="relative p-8 space-y-4">
              {/* بيانات العميلة + الموعد */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gold-light/30">
                <div>
                  <div className="font-en-label text-[9px] tracking-[0.25em] text-gold-deep mb-1.5">
                    BILL TO · العميلة
                  </div>
                  <div className="font-ar-display font-bold text-base text-ink leading-tight">
                    {booking.customer_name}
                  </div>
                  <div className="text-xs text-ink-soft mt-0.5 font-en-display" dir="ltr">
                    {booking.customer_phone}
                  </div>
                </div>
                <div className="text-left">
                  <div className="font-en-label text-[9px] tracking-[0.25em] text-gold-deep mb-1.5">
                    SERVICE DATE · موعد الخدمة
                  </div>
                  <div className="font-en-display font-bold text-base text-ink leading-tight" dir="ltr">
                    {booking.booking_date}
                  </div>
                  <div className="text-xs text-ink-soft mt-0.5 font-en-display" dir="ltr">
                    {booking.booking_time.slice(0, 5)} · {formatDuration(booking.duration_min)}
                  </div>
                </div>
              </div>

              {/* الهدية (إن وجدت) */}
              {booking.is_gift && booking.gift_from_name && (
                <div className="flex items-center gap-2 bg-gradient-to-l from-gold-light/15 to-transparent border-r-2 border-gold-deep rounded-l px-3 py-2 text-xs">
                  <span className="text-base">🎁</span>
                  <span className="text-ink-soft">هدية من:</span>
                  <strong className="text-gold-deep font-ar-display">{booking.gift_from_name}</strong>
                </div>
              )}

              {/* جدول الخدمات */}
              <div>
                <div className="font-en-label text-[9px] tracking-[0.25em] text-gold-deep mb-2">
                  SERVICES · تفاصيل الخدمات
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gold-deep">
                      <th className="py-2 text-right text-[10px] font-bold text-gold-deep uppercase tracking-wide w-8">#</th>
                      <th className="py-2 text-right text-[10px] font-bold text-gold-deep uppercase tracking-wide">الوصف</th>
                      <th className="py-2 text-center text-[10px] font-bold text-gold-deep uppercase tracking-wide w-20">المدة</th>
                      <th className="py-2 text-left text-[10px] font-bold text-gold-deep uppercase tracking-wide w-24">المبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {booking.items?.map((item: any, i: number) => (
                      <tr key={item.id} className="border-b border-cream-100 last:border-b-0">
                        <td className="py-2.5 text-xs text-ink-soft font-en-display">{i + 1}</td>
                        <td className="py-2.5 text-sm text-ink font-medium">{item.service_name}</td>
                        <td className="py-2.5 text-xs text-ink-soft text-center font-en-display">
                          {formatDuration(item.duration_min)}
                        </td>
                        <td className="py-2.5 text-sm font-en-display font-bold text-ink text-left">
                          {Number(item.price).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ─── الإجمالي + QR ─── */}
              <div className="grid grid-cols-5 gap-4 pt-2">
                {/* QR Code */}
                <div className="col-span-2 flex flex-col items-center">
                  <div className="font-en-label text-[8px] tracking-[0.25em] text-gold-deep mb-1.5 text-center">
                    {applyVAT ? 'TAX QR CODE' : 'BOOKING QR'}
                  </div>
                  <div className="bg-white border-2 border-gold-light/40 rounded-lg p-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrUrl}
                      alt="QR"
                      className="mx-auto"
                      width={120}
                      height={120}
                    />
                  </div>
                  <div className="text-center text-[8px] text-ink-soft mt-1 font-en-display leading-tight">
                    {applyVAT ? 'ZATCA Phase 1' : booking.booking_number}
                  </div>
                </div>

                {/* الحسابات */}
                <div className="col-span-3 flex flex-col justify-end">
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between py-1 text-ink">
                      <span className="text-xs text-ink-soft">
                        المجموع {applyVAT ? '(قبل الضريبة)' : ''}
                      </span>
                      <span className="font-en-display font-bold">{subtotal.toFixed(2)} ر.س</span>
                    </div>

                    {Number(booking.discount) > 0 && (
                      <div className="flex items-center justify-between py-1 text-emerald-700">
                        <span className="text-xs">الخصم</span>
                        <span className="font-en-display font-bold">-{Number(booking.discount).toFixed(2)} ر.س</span>
                      </div>
                    )}

                    {applyVAT && (
                      <div className="flex items-center justify-between py-1.5 bg-gold-light/10 px-2 rounded">
                        <span className="text-xs text-gold-deep">ضريبة القيمة المضافة ({vatRate}%)</span>
                        <span className="font-en-display font-bold text-gold-deep text-sm">{vatAmount.toFixed(2)} ر.س</span>
                      </div>
                    )}

                    {/* الإجمالي النهائي · بارز */}
                    <div className="mt-2 p-3 bg-gradient-to-l from-gold-deep to-ink text-cream-50 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="font-en-label text-[8px] tracking-[0.3em] text-gold-light/90">
                          GRAND TOTAL
                        </div>
                        <div className="text-xs font-bold">
                          الإجمالي {applyVAT ? 'شامل الضريبة' : ''}
                        </div>
                      </div>
                      <div className="font-en-display text-xl font-bold">
                        {grandTotal.toFixed(2)} <span className="text-xs text-gold-light">ر.س</span>
                      </div>
                    </div>

                    {/* حالة الدفع */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        booking.payment_status === 'paid'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {booking.payment_status === 'paid' ? '✓ مدفوعة' : '⚠ غير مدفوعة'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ملاحظات (إن وجدت) */}
              {booking.customer_notes && (
                <div className="bg-cream-50 border border-cream-200 rounded-lg p-2.5 text-xs">
                  <strong className="text-gold-deep text-[10px] font-en-label tracking-wider uppercase">NOTES</strong>
                  <div className="text-ink-soft mt-0.5">{booking.customer_notes}</div>
                </div>
              )}
            </main>

            {/* ─── الفوتر ─── */}
            <footer className="relative bg-gradient-to-l from-cream-50 to-amber-50/50 border-t border-gold-light/30 px-8 py-3">
              <div className="flex items-center justify-between text-xs">
                <div className="text-ink-soft flex items-center gap-1">
                  <span className="text-gold-deep">💛</span>
                  <span>شكراً لثقتكِ</span>
                </div>
                <div className="font-en-display italic text-gold-deep text-sm">
                  نعتني بكِ لتُزهري
                </div>
              </div>
              {applyVAT && (
                <div className="text-[8px] text-ink-soft/70 text-center mt-1 font-en-display">
                  This is a tax invoice compliant with ZATCA Phase 1 requirements
                </div>
              )}
            </footer>
          </div>

          {/* تعليمات · لا تظهر في الطباعة */}
          <div className="no-print text-center text-xs text-ink-soft mt-4">
            اضغطي Ctrl+P (أو Cmd+P) للطباعة أو حفظ PDF
          </div>
        </div>
      </div>
    </>
  );
}
