/**
 * Admin — إدارة بطاقات الهدية
 */
import { createClient } from '@/lib/supabase/server';
import { Gift, Copy } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function GiftCardsAdminPage() {
  const supabase = await createClient();
  const { data: cards } = await supabase.from('gift_cards').select('*').order('created_at', { ascending: false }).limit(50);

  const total = (cards || []).reduce((s, c) => s + Number(c.initial_amount), 0);
  const used = (cards || []).reduce((s, c) => s + (Number(c.initial_amount) - Number(c.balance)), 0);
  const active = (cards || []).filter((c) => c.is_active && Number(c.balance) > 0).length;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">بطاقات الهدية</h1>
        <p className="text-ink-soft text-sm mt-1">
          العميلات يشترين البطاقات من <a href="/gift-cards" target="_blank" className="text-gold-deep font-bold hover:underline">/gift-cards</a>
        </p>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-cream-200">
          <div className="text-xs text-ink-soft">إجمالي المبيعات</div>
          <div className="font-en-display text-2xl font-bold text-gold-deep mt-1">{total} <span className="text-sm">ر.س</span></div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-cream-200">
          <div className="text-xs text-ink-soft">المُستخدم</div>
          <div className="font-en-display text-2xl font-bold text-success mt-1">{used} <span className="text-sm">ر.س</span></div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-cream-200">
          <div className="text-xs text-ink-soft">بطاقات نشطة</div>
          <div className="font-en-display text-2xl font-bold text-ink mt-1">{active}</div>
        </div>
      </div>

      {/* القائمة */}
      {!cards || cards.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-cream-200">
          <Gift className="w-12 h-12 text-ink-soft/50 mx-auto mb-3" />
          <div className="text-ink-soft text-sm">ما فيه بطاقات هدية بعد</div>
          <a href="/gift-cards" target="_blank" className="btn-primary inline-block mt-4">
            صفحة الشراء
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-50 border-b border-cream-200">
              <tr className="text-right text-xs text-ink-soft font-bold">
                <th className="p-3">الكود</th>
                <th className="p-3">القيمة</th>
                <th className="p-3">الرصيد</th>
                <th className="p-3">المُهدية</th>
                <th className="p-3">المستلمة</th>
                <th className="p-3">التاريخ</th>
                <th className="p-3">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => (
                <tr key={c.id} className="border-b border-cream-100 hover:bg-cream-50/50">
                  <td className="p-3 font-en-display font-bold text-gold-deep">{c.code}</td>
                  <td className="p-3 font-en-display font-bold">{c.initial_amount} ر.س</td>
                  <td className="p-3 font-en-display font-bold text-success">{c.balance} ر.س</td>
                  <td className="p-3">
                    <div className="text-sm">{c.purchaser_name}</div>
                    <div className="text-[10px] text-ink-soft font-en-display">{c.purchaser_phone}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm">{c.recipient_name || '—'}</div>
                    {c.recipient_phone && <div className="text-[10px] text-ink-soft font-en-display">{c.recipient_phone}</div>}
                  </td>
                  <td className="p-3 text-xs text-ink-soft font-en-display">
                    {new Date(c.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td className="p-3">
                    {!c.is_active ? (
                      <span className="text-[10px] bg-danger/15 text-danger px-2 py-0.5 rounded-full font-bold">معطّلة</span>
                    ) : Number(c.balance) === 0 ? (
                      <span className="text-[10px] bg-cream-200 text-ink-soft px-2 py-0.5 rounded-full font-bold">مُستنفَدة</span>
                    ) : (
                      <span className="text-[10px] bg-success/15 text-success px-2 py-0.5 rounded-full font-bold">نشطة</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
