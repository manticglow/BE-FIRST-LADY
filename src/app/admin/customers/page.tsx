/**
 * Admin — إدارة العميلات
 */
import { createClient } from '@/lib/supabase/server';
import { Users, Phone, Mail } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: customers } = await supabase
    .from('profiles')
    .select('*, bookings:bookings(id, total, payment_status)')
    .eq('role', 'customer')
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">
          العميلات
        </h1>
        <p className="text-ink-soft text-sm mt-1">
          {customers?.length || 0} عميلة مسجّلة
        </p>
      </div>

      {!customers || customers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-cream-200">
          <Users className="w-12 h-12 text-ink-soft/50 mx-auto mb-3" />
          <div className="text-ink-soft text-sm">ما فيه عميلات مسجّلات بعد</div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-cream-200">
                <tr className="text-right text-xs text-ink-soft font-bold">
                  <th className="p-3">الاسم</th>
                  <th className="p-3">الجوال</th>
                  <th className="p-3">البريد</th>
                  <th className="p-3">الحجوزات</th>
                  <th className="p-3">إجمالي الإنفاق</th>
                  <th className="p-3">عميلة منذ</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c: any) => {
                  const paid = c.bookings?.filter((b: any) => b.payment_status === 'paid') || [];
                  const total = paid.reduce((s: number, b: any) => s + Number(b.total), 0);
                  return (
                    <tr key={c.id} className="border-b border-cream-100 hover:bg-cream-50/50">
                      <td className="p-3 font-bold text-ink">{c.full_name || '—'}</td>
                      <td className="p-3">
                        {c.phone ? (
                          <a href={`tel:${c.phone}`} className="text-xs text-ink hover:text-gold-deep flex items-center gap-1">
                            <Phone className="w-3 h-3" /><span className="font-en-display">{c.phone}</span>
                          </a>
                        ) : <span className="text-xs text-ink-soft">—</span>}
                      </td>
                      <td className="p-3">
                        {c.email ? (
                          <span className="text-xs text-ink font-en-display truncate block max-w-[200px]">{c.email}</span>
                        ) : <span className="text-xs text-ink-soft">—</span>}
                      </td>
                      <td className="p-3 font-en-display">{c.bookings?.length || 0}</td>
                      <td className="p-3 font-en-display font-bold text-gold-deep">{formatPrice(total)}</td>
                      <td className="p-3 text-xs text-ink-soft font-en-display">
                        {new Date(c.created_at).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
