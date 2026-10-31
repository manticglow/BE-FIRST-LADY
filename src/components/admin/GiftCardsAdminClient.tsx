/**
 * GiftCardsAdminClient — زر الإصدار + جدول البطاقات (client-side)
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Copy, MessageCircle, ScanLine } from 'lucide-react';
import { toast } from 'sonner';
import IssueGiftCardModal from './IssueGiftCardModal';
import { waLink } from '@/lib/utils';

interface Card {
  id: string;
  code: string;
  initial_amount: number;
  balance: number;
  purchaser_name: string;
  purchaser_phone: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  message: string | null;
  design: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

function IssueButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50 font-ar-display font-bold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-gold-deep/20 hover:scale-[1.03] transition-transform"
      >
        <Plus className="w-4 h-4" />
        إصدار بطاقة
      </button>

      {open && (
        <IssueGiftCardModal
          onClose={() => setOpen(false)}
          onIssued={() => router.refresh()}
        />
      )}
    </>
  );
}

function Table({ cards }: { cards: Card[] }) {
  return (
    <div className="bg-white rounded-3xl border border-cream-200 overflow-hidden shadow-sm">
      {/* ديسكتوب · جدول */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream-50 border-b border-cream-200">
            <tr className="text-right text-xs text-ink-soft font-bold">
              <th className="p-3">الكود</th>
              <th className="p-3">القيمة</th>
              <th className="p-3">الرصيد</th>
              <th className="p-3">المستلمة</th>
              <th className="p-3">التاريخ</th>
              <th className="p-3">الحالة</th>
              <th className="p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((c) => <CardRow key={c.id} card={c} />)}
          </tbody>
        </table>
      </div>

      {/* موبايل · بطاقات */}
      <div className="md:hidden divide-y divide-cream-100">
        {cards.map((c) => <CardRowMobile key={c.id} card={c} />)}
      </div>
    </div>
  );
}

function CardRow({ card }: { card: Card }) {
  const status = getStatus(card);
  const used = Number(card.initial_amount) - Number(card.balance);
  const usedPct = Math.round((used / Number(card.initial_amount)) * 100);

  function copyCode() {
    navigator.clipboard.writeText(card.code);
    toast.success('نُسخ الكود');
  }

  function sendWA() {
    if (!card.recipient_phone) return;
    const msg = `🎁 بطاقة هديّة من Be First Lady\n\nمرحباً ${card.recipient_name || ''}\nكود البطاقة: *${card.code}*\nالرصيد: ${card.balance} ر.س`;
    window.open(waLink(msg, card.recipient_phone), '_blank');
  }

  return (
    <tr className="border-b border-cream-100 hover:bg-cream-50/40 transition-colors">
      <td className="p-3">
        <div className="font-en-display font-bold text-gold-deep tracking-wider">{card.code}</div>
      </td>
      <td className="p-3 font-en-display font-bold">{Number(card.initial_amount)} ر.س</td>
      <td className="p-3">
        <div className="font-en-display font-bold text-emerald-600">{Number(card.balance)} ر.س</div>
        {used > 0 && (
          <div className="text-[10px] text-ink-soft">مستخدم {usedPct}%</div>
        )}
      </td>
      <td className="p-3">
        <div className="text-sm">{card.recipient_name || '—'}</div>
        {card.recipient_phone && (
          <div className="text-[10px] text-ink-soft font-en-display">{card.recipient_phone}</div>
        )}
      </td>
      <td className="p-3 text-xs text-ink-soft font-en-display">
        {new Date(card.created_at).toLocaleDateString('en-GB')}
      </td>
      <td className="p-3">
        <StatusBadge status={status} />
      </td>
      <td className="p-3">
        <div className="flex items-center gap-1">
          <button
            onClick={copyCode}
            className="p-1.5 rounded-lg bg-cream-100 text-ink-soft hover:bg-cream-200 transition-colors"
            title="نسخ الكود"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {card.recipient_phone && (
            <button
              onClick={sendWA}
              className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
              title="إرسال واتساب"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
          )}
          <Link
            href={`/admin/gift-cards/scan?code=${encodeURIComponent(card.code)}`}
            className="p-1.5 rounded-lg bg-gold-light/15 text-gold-deep hover:bg-gold-light/25 transition-colors"
            title="استخدام"
          >
            <ScanLine className="w-3.5 h-3.5" />
          </Link>
        </div>
      </td>
    </tr>
  );
}

function CardRowMobile({ card }: { card: Card }) {
  const status = getStatus(card);
  const used = Number(card.initial_amount) - Number(card.balance);
  const usedPct = Math.round((used / Number(card.initial_amount)) * 100);

  function copyCode() {
    navigator.clipboard.writeText(card.code);
    toast.success('نُسخ');
  }

  function sendWA() {
    if (!card.recipient_phone) return;
    const msg = `🎁 بطاقة هديّة من Be First Lady\nكود: *${card.code}*\nالرصيد: ${card.balance} ر.س`;
    window.open(waLink(msg, card.recipient_phone), '_blank');
  }

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="font-en-display font-bold text-gold-deep text-lg tracking-wider">{card.code}</div>
          <div className="text-xs text-ink-soft">{card.recipient_name || 'بدون اسم'}</div>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="flex items-end justify-between gap-2 mb-3">
        <div>
          <div className="text-[10px] text-ink-soft">الرصيد المتبقّي</div>
          <div className="font-en-display font-bold text-xl text-emerald-600">
            {Number(card.balance)} ر.س
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-ink-soft">من {Number(card.initial_amount)} ر.س</div>
          {used > 0 && (
            <div className="w-20 h-1 bg-cream-200 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-emerald-500" style={{ width: `${usedPct}%` }} />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={copyCode} className="flex-1 py-2 bg-cream-100 rounded-xl text-xs font-bold text-ink flex items-center justify-center gap-1">
          <Copy className="w-3.5 h-3.5" /> نسخ
        </button>
        {card.recipient_phone && (
          <button onClick={sendWA} className="flex-1 py-2 bg-emerald-100 rounded-xl text-xs font-bold text-emerald-700 flex items-center justify-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" /> واتساب
          </button>
        )}
        <Link
          href={`/admin/gift-cards/scan?code=${encodeURIComponent(card.code)}`}
          className="flex-1 py-2 bg-gold-light/15 rounded-xl text-xs font-bold text-gold-deep flex items-center justify-center gap-1"
        >
          <ScanLine className="w-3.5 h-3.5" /> استخدام
        </Link>
      </div>
    </div>
  );
}

type Status = 'active' | 'expired' | 'used' | 'disabled';

function getStatus(card: Card): Status {
  if (!card.is_active) return 'disabled';
  if (card.expires_at && new Date(card.expires_at) < new Date()) return 'expired';
  if (Number(card.balance) <= 0) return 'used';
  return 'active';
}

function StatusBadge({ status }: { status: Status }) {
  const config = {
    active:   { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '✓ نشطة' },
    used:     { bg: 'bg-slate-100 text-slate-700 border-slate-200',       label: '🏁 مستنفَدة' },
    expired:  { bg: 'bg-amber-50 text-amber-700 border-amber-200',        label: '⏰ منتهية' },
    disabled: { bg: 'bg-rose-50 text-rose-700 border-rose-200',           label: '🚫 معطّلة' },
  }[status];

  return (
    <span className={`text-[10px] border rounded-full px-2.5 py-0.5 font-bold whitespace-nowrap ${config.bg}`}>
      {config.label}
    </span>
  );
}

// Named exports
export { IssueButton, Table };
// Default = namespace-like object for ease of use
const GiftCardsAdminClient = { IssueButton, Table };
export default GiftCardsAdminClient;
