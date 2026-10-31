/**
 * Admin · Gift Card Scanner / Redemption
 */
import Link from 'next/link';
import RedeemGiftCard from '@/components/admin/RedeemGiftCard';
import { ArrowRight, ScanLine } from 'lucide-react';

interface Props {
  searchParams: Promise<{ code?: string }>;
}

export default async function RedeemGiftCardPage({ searchParams }: Props) {
  const { code } = await searchParams;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="editorial-eyebrow text-ink-soft mb-1">GIFT CARD REDEMPTION</div>
          <h1 className="font-ar-display text-2xl md:text-3xl font-bold text-gold-deep flex items-center gap-2">
            <ScanLine className="w-7 h-7" />
            استخدام بطاقة هديّة
          </h1>
          <p className="text-ink-soft text-sm mt-1">
            أدخلي كود البطاقة أو امسحي QR لاستخدامها
          </p>
        </div>
        <Link
          href="/admin/gift-cards"
          className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-gold-deep font-bold"
        >
          <ArrowRight className="w-4 h-4" />
          رجوع
        </Link>
      </div>

      <RedeemGiftCard initialCode={code} />
    </div>
  );
}
