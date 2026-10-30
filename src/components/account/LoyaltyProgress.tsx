/**
 * LoyaltyProgress — شريط تقدّم الولاء المرئي
 * ═══════════════════════════════════════════════════════════
 * - يبين المستوى الحالي
 * - شريط تقدّم للمستوى التالي
 * - مكافآت متبقّية
 * - تحفيز مرئي قوي
 */
import { Award, Crown, Gem, Star, Gift, Sparkles, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

type Tier = 'bronze' | 'silver' | 'gold' | 'diamond';

const TIER_INFO: Record<Tier, {
  label: string;
  nextThreshold: number | null;
  nextTier: Tier | null;
  nextLabel: string | null;
  gradient: string;
  accent: string;
  icon: any;
  perks: string[];
}> = {
  bronze: {
    label: 'برونزيّة',
    nextThreshold: 2000,
    nextTier: 'silver',
    nextLabel: 'فضيّة',
    gradient: 'from-amber-700 via-amber-500 to-amber-800',
    accent: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Award,
    perks: ['خصم 5% على كل حجز', 'كوبون عيد ميلاد سنوي'],
  },
  silver: {
    label: 'فضيّة',
    nextThreshold: 5000,
    nextTier: 'gold',
    nextLabel: 'ذهبيّة',
    gradient: 'from-slate-400 via-slate-200 to-slate-500',
    accent: 'bg-slate-100 text-slate-800 border-slate-200',
    icon: Star,
    perks: ['خصم 10%', 'أولوية في الحجز', 'هدية في الزيارة الـ10'],
  },
  gold: {
    label: 'ذهبيّة',
    nextThreshold: 10000,
    nextTier: 'diamond',
    nextLabel: 'ماسيّة',
    gradient: 'from-yellow-600 via-yellow-400 to-yellow-700',
    accent: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Crown,
    perks: ['خصم 15%', 'جلسة شهرية مجّانيّة', 'استشارة شخصيّة'],
  },
  diamond: {
    label: 'ماسيّة',
    nextThreshold: null,
    nextTier: null,
    nextLabel: null,
    gradient: 'from-cyan-500 via-sky-300 to-blue-600',
    accent: 'bg-cyan-100 text-cyan-900 border-cyan-200',
    icon: Gem,
    perks: ['خصم 20%', 'VIP · أولوية مطلقة', 'باقة شهرية هدية', 'هدايا موسميّة'],
  },
};

interface Props {
  tier: Tier;
  points: number;
  totalSpent: number;
  visitsCount: number;
}

export default function LoyaltyProgress({ tier, points, totalSpent, visitsCount }: Props) {
  const info = TIER_INFO[tier];
  const Icon = info.icon;

  const progressPercent = info.nextThreshold
    ? Math.min(100, (totalSpent / info.nextThreshold) * 100)
    : 100;

  const remaining = info.nextThreshold ? Math.max(0, info.nextThreshold - totalSpent) : 0;

  return (
    <div className={`relative bg-gradient-to-br ${info.gradient} rounded-3xl p-5 md:p-6 text-white shadow-xl overflow-hidden`}>

      {/* نقش خلفي ناعم */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
        <Sparkles className="absolute top-6 left-6 w-24 h-24" />
        <Icon className="absolute -bottom-4 -right-4 w-32 h-32" />
      </div>

      {/* Header */}
      <div className="relative flex items-start justify-between mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-sm text-[10px] font-bold px-2.5 py-1 rounded-full mb-2">
            <Icon className="w-3 h-3" />
            عضوة {info.label}
          </div>
          <div className="font-ar-display text-2xl md:text-3xl font-bold">
            {points} نقطة ولاء
          </div>
          <div className="text-xs opacity-80 mt-1">
            أنفقتِ {formatPrice(totalSpent)} · زرتِنا {visitsCount} مرّة
          </div>
        </div>
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
          <Icon className="w-7 h-7 md:w-8 md:h-8" />
        </div>
      </div>

      {/* شريط التقدّم */}
      {info.nextTier && info.nextThreshold && (
        <div className="relative mb-5">
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="font-bold">{info.label}</span>
            <span className="font-bold opacity-90">
              {remaining > 0 ? `${formatPrice(remaining)} للترقية 🚀` : '✨ ترقية جاهزة'}
            </span>
            <span className="font-bold">{info.nextLabel}</span>
          </div>
          <div className="h-2.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
            <div
              className="h-full bg-white rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="text-[10px] opacity-70 mt-1 text-center">
            {Math.round(progressPercent)}% للمستوى التالي
          </div>
        </div>
      )}

      {/* مكافآتكِ الحالية */}
      <div className="relative bg-white/15 backdrop-blur-sm rounded-2xl p-3 mb-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold mb-2 opacity-90">
          <Gift className="w-3 h-3" />
          مكافآتكِ الحاليّة
        </div>
        <ul className="space-y-1">
          {info.perks.map((perk, i) => (
            <li key={i} className="text-xs flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-white/90" />
              {perk}
            </li>
          ))}
        </ul>
      </div>

      {/* زر الاستفادة */}
      <Link
        href="/booking"
        className="relative inline-flex items-center justify-center gap-2 w-full bg-white text-ink font-bold py-3 rounded-xl hover:bg-cream-50 transition-colors text-sm"
      >
        <Sparkles className="w-4 h-4 text-gold-deep" />
        استفيدي من مزاياكِ · احجزي الآن
        <ChevronLeft className="w-4 h-4" />
      </Link>
    </div>
  );
}
