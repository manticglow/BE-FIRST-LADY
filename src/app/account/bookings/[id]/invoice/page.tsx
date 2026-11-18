/**
 * /account/bookings/[id]/invoice — فاتورة العميلة الضريبيّة
 * ═══════════════════════════════════════════════════════════
 * - ZATCA Phase 1 compliant
 * - QR Code محلي (لا طرف ثالث)
 * - PDF عبر print dialog
 * - RLS على customer_id
 */
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { generateZatcaQRDataUrl, formatNationalAddress, calculateVAT, type ZatcaInvoice } from '@/lib/zatca';
import InvoicePrintButton from '@/components/account/InvoicePrintButton';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CustomerInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <div className="p-8 text-center">سجّلي دخول لعرض الفاتورة</div>;

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, items:booking_items(service_name, price, quantity)')
    .eq('id', id)
    .eq('customer_id', user.id)   // RLS على مستوى الاستعلام
    .maybeSingle();

  if (!booking) notFound();

  const { data: tax } = await supabase
    .from('tax_settings')
    .select('*')
    .eq('is_active', true)
    .maybeSingle();

  const b = booking as any;
  const t = tax as any;

  const vatRate = t?.vat_rate || 15;
  const applyVat = t?.apply_vat || false;
  const pricesInclude = t?.prices_include_vat ?? true;

  const vat = calculateVAT(b.total, vatRate, pricesInclude);
  const subtotal = applyVat ? vat.subtotal : b.total;
  const vatAmount = applyVat ? vat.vatAmount : 0;

  // QR محلّي (لا api.qrserver.com)
  const qrInvoice: ZatcaInvoice = {
    sellerName: t?.business_name_ar || 'السيّدة الأولى',
    vatNumber: t?.vat_number || '',
    timestamp: b.created_at || new Date().toISOString(),
    total: b.total,
    vatTotal: vatAmount,
  };
  const qrDataUrl = t?.vat_number ? await generateZatcaQRDataUrl(qrInvoice, 140) : null;

  const invoiceNumber = b.invoice_number || `TFL-${b.booking_number}`;
  const fullAddress = formatNationalAddress({
    building_number: t?.building_number,
    street_name: t?.street_name,
    district: t?.district,
    city: t?.city,
    postal_code: t?.postal_code,
    secondary_number: t?.secondary_number,
  });

  return (
    <div className="min-h-screen bg-cream-50 print:bg-white py-6">
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm 12mm; }
          body > *:not(.invoice-sheet) { display: none !important; }
          .no-print { display: none !important; }
        }
        .tabular-nums { font-variant-numeric: tabular-nums; }
      `}</style>

      {/* شريط الإجراءات · لا يُطبع */}
      <div className="no-print max-w-2xl mx-auto px-4 mb-4 flex items-center justify-between">
        <a href={`/account/bookings/${b.id}`} className="text-sm text-ink-soft hover:text-ink">
          ← رجوع للحجز
        </a>
        <InvoicePrintButton />
      </div>

      {/* الفاتورة */}
      <div className="invoice-sheet max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-[20px] print:rounded-none shadow-sm print:shadow-none border border-cream-100 print:border-0 overflow-hidden">

          {/* Header · عاجي أحادي · لا gradients */}
          <div className="bg-cream-50 print:bg-white border-b-2 border-gold-deep/30 p-6 relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-ar-display text-2xl font-bold text-ink leading-tight">
                  {t?.business_name_ar || 'السيّدة الأولى'}
                </div>
                {t?.business_name_en && (
                  <div className="font-en-display italic text-sm text-ink-soft mt-1 tracking-wide">
                    {t.business_name_en}
                  </div>
                )}
                <div className="w-12 h-[1px] bg-gold-deep mt-3" />
              </div>

              <div className="text-left">
                <div className="text-[10px] font-bold text-ink-soft uppercase tracking-widest">فاتورة ضريبيّة</div>
                <div className="text-[10px] text-ink-soft tracking-widest mt-0.5">TAX INVOICE</div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">

            {/* Meta · 3 أعمدة */}
            <div className="grid grid-cols-3 gap-4 pb-4 border-b border-cream-100">
              <div>
                <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">رقم الفاتورة</div>
                <div className="font-en-display font-bold text-sm text-ink tabular-nums mt-1">
                  {invoiceNumber}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">التاريخ</div>
                <div className="font-en-display font-bold text-sm text-ink tabular-nums mt-1">
                  {new Date(b.created_at).toLocaleDateString('en-GB', { timeZone: 'Asia/Riyadh' })}
                </div>
              </div>
              <div className="text-left">
                <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">الحالة</div>
                <div className={`text-sm font-bold mt-1 ${b.payment_status === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {b.payment_status === 'paid' ? '✓ مدفوعة' : '⏳ قيد الدفع'}
                </div>
              </div>
            </div>

            {/* From + To */}
            <div className="grid grid-cols-2 gap-4 pb-4 border-b border-cream-100">
              <div>
                <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider mb-2">المُصدر</div>
                <div className="text-sm font-bold text-ink">{t?.business_name_ar || 'السيّدة الأولى'}</div>
                {fullAddress && (
                  <div className="text-[11px] text-ink-soft mt-1 leading-relaxed">{fullAddress}</div>
                )}
                {t?.commercial_reg && (
                  <div className="text-[11px] text-ink-soft mt-1.5 font-en-display tabular-nums">
                    س.ت: {t.commercial_reg}
                  </div>
                )}
                {t?.vat_number && (
                  <div className="text-[11px] text-ink-soft font-en-display tabular-nums">
                    VAT: {t.vat_number}
                  </div>
                )}
              </div>

              <div>
                <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider mb-2">إلى</div>
                <div className="text-sm font-bold text-ink">{b.customer_name}</div>
                {b.customer_phone && (
                  <div className="text-[11px] text-ink-soft mt-1 font-en-display tabular-nums" dir="ltr">
                    {b.customer_phone}
                  </div>
                )}
                {b.customer_email && (
                  <div className="text-[11px] text-ink-soft font-en-display">{b.customer_email}</div>
                )}
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider mb-2">البنود</div>
              <table className="w-full text-sm">
                <thead className="bg-cream-50 text-[10px] font-bold text-ink-soft uppercase tracking-wider">
                  <tr>
                    <th className="text-right py-2 px-3">الخدمة</th>
                    <th className="text-center py-2 px-3 w-16">الكمّيّة</th>
                    <th className="text-left py-2 px-3 w-24">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {(b.items || []).map((it: any, i: number) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3 text-ink">{it.service_name}</td>
                      <td className="py-2.5 px-3 text-center font-en-display tabular-nums">{it.quantity || 1}</td>
                      <td className="py-2.5 px-3 text-left font-en-display font-bold tabular-nums">
                        {formatPrice(it.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* الإجمالي */}
            <div className="border-t border-cream-100 pt-4 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">المجموع قبل الضريبة</span>
                <span className="font-en-display tabular-nums">{formatPrice(subtotal)}</span>
              </div>
              {applyVat && (
                <div className="flex justify-between text-sm">
                  <span className="text-ink-soft">ض.ق.م ({vatRate}%)</span>
                  <span className="font-en-display tabular-nums">{formatPrice(vatAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold border-t border-cream-100 pt-2 mt-2">
                <span className="text-ink">الإجمالي</span>
                <span className="font-en-display tabular-nums text-gold-deep">{formatPrice(b.total)}</span>
              </div>
            </div>

            {/* QR */}
            {qrDataUrl && (
              <div className="pt-4 border-t border-cream-100 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider mb-1">ZATCA QR</div>
                  <div className="text-[10px] text-ink-soft leading-relaxed">
                    امسحي الرمز للتحقّق من الفاتورة
                    <br />من هيئة الزكاة والضريبة
                  </div>
                </div>
                <img src={qrDataUrl} alt="ZATCA QR" width={120} height={120} className="rounded border border-cream-200" />
              </div>
            )}

            {/* Footer */}
            <div className="pt-4 border-t border-cream-100 text-center">
              <div className="text-[10px] text-ink-soft italic">
                شكراً لثقتكِ · نعتني بكِ لتُزهري
                <br />The First Lady · Al-Madinah
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
