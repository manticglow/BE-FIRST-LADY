/**
 * Admin — إدارة بطاقات الهدية
 * ═══════════════════════════════════════════════════════════
 * - زر "إصدار بطاقة" (modal) · عميلة في المحل
 * - زر "استخدام بطاقة" (scan)
 * - جدول كل البطاقات مع الحالة
 */
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Gift, ScanLine, Plus } from 'lucide-react';
import { IssueButton, Table } from '@/components/admin/GiftCardsAdminClient';

export const dynamic = 'force-dynamic';

export default async function GiftCardsAdminPage() {
  const supabase = await createClient();
  const { data: cards } = await supabase
    .from('gift_cards')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  const total = (cards || []).reduce((s, c) => s + Number(c.initial_amount), 0);
  const used = (cards || []).reduce((s, c) => s + (Number(c.initial_amount) - Number(c.balance)), 0);
  const active = (cards || []).filter((c) => c.is_active && Number(c.balance) > 0).length;

  return (
    <div className="p-4 md:p-6 lg:p-8">

      {/* ═══ Header ═══ */}
      <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="editorial-eyebrow text-ink-soft mb-1">GIFT CARDS</div>
          <h1 className="font-ar-display text-3xl font-bold text-gold-deep flex items-center gap-2">
            <Gift className="w-7 h-7" />
            بطاقات الهدية
          </h1>
          <p className="text-ink-soft text-sm mt-1">
            إصدار واستخدام بطاقات الهدية · العميلات يشترين من{' '}
            <a href="/gift-cards" target="_blank" className="text-gold-deep font-bold hover:underline">
              /gift-cards
            </a>
          </p>
        </div>

        {/* ═══ أزرار الإجراء ═══ */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin/gift-cards/scan"
            className="inline-flex items-center gap-1.5 bg-white text-gold-deep border-2 border-gold-light/40 hover:border-gold-deep font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
          >
            <ScanLine className="w-4 h-4" />
            استخدام بطاقة
          </Link>
          <IssueButton />
        </div>
      </div>

      {/* ═══ إحصائيات ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="إجمالي المصدَر" value={`${total} ر.س`} color="gold" />
        <StatCard label="المُستخدم" value={`${used} ر.س`} color="emerald" />
        <StatCard label="بطاقات نشطة" value={String(active)} color="violet" />
        <StatCard label="إجمالي البطاقات" value={String((cards || []).length)} color="rose" />
      </div>

      {/* ═══ جدول البطاقات ═══ */}
      {!cards || cards.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-cream-200">
          <Gift className="w-14 h-14 text-ink-soft/40 mx-auto mb-3" />
          <div className="font-ar-display font-bold text-lg text-ink mb-1">ما فيه بطاقات بعد</div>
          <div className="text-ink-soft text-sm mb-6">
            أصدري أول بطاقة من الزر فوق
          </div>
        </div>
      ) : (
        <Table cards={cards} />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    gold: 'bg-gold-light/10 text-gold-deep border-gold-light/30',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <div className={`${colors[color]} rounded-2xl p-4 border`}>
      <div className="text-[11px] font-semibold opacity-80">{label}</div>
      <div className="font-en-display text-xl md:text-2xl font-bold mt-1 truncate">{value}</div>
    </div>
  );
}
