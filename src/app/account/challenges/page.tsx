/**
 * /account/challenges — تحدّيات الولاء
 */
'use client';

import { useState, useEffect } from 'react';
import { Trophy, Loader2, Check, Gift, Star } from 'lucide-react';

interface Challenge {
  id: string;
  code: string;
  title_ar: string;
  description_ar: string;
  challenge_type: string;
  target_value: number;
  currentValue: number;
  percent: number;
  completed: boolean;
  claimed: boolean;
  reward_description_ar: string;
  icon: string;
  rewardCode?: string;
}

export default function ChallengesPage() {
  const [list, setList] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/loyalty/challenges')
      .then((r) => r.json())
      .then((d) => d.ok && setList(d.challenges))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold-deep" /></div>;
  }

  const active = list.filter((c) => !c.completed);
  const done = list.filter((c) => c.completed);

  return (
    <div className="max-w-xl mx-auto p-4 pb-32">
      <div className="text-center mb-6 mt-4">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-gold-light/30 to-cream-100 flex items-center justify-center mb-3">
          <Trophy className="w-8 h-8 text-gold-deep" />
        </div>
        <h1 className="font-ar-display text-2xl font-bold text-gold-deep">تحدّيات الولاء</h1>
        <p className="text-ink-soft text-sm mt-1">أكملي التحدّي · واحصلي على هديّة فاخرة</p>
      </div>

      {active.length > 0 && (
        <>
          <div className="font-bold text-xs text-gold-deep uppercase tracking-wider mb-2">نشطة</div>
          <div className="space-y-3 mb-6">
            {active.map((c) => <ChallengeCard key={c.id} c={c} />)}
          </div>
        </>
      )}

      {done.length > 0 && (
        <>
          <div className="font-bold text-xs text-emerald-700 uppercase tracking-wider mb-2">مُكتملة</div>
          <div className="space-y-3">
            {done.map((c) => <ChallengeCard key={c.id} c={c} />)}
          </div>
        </>
      )}

      {list.length === 0 && (
        <div className="bg-white rounded-3xl p-8 text-center border border-cream-200">
          <Star className="w-10 h-10 mx-auto text-ink-soft/40 mb-2" />
          <p className="text-ink-soft text-sm">لا توجد تحدّيات حالياً · ترقّبي قريباً!</p>
        </div>
      )}
    </div>
  );
}

function ChallengeCard({ c }: { c: Challenge }) {
  return (
    <div className={`bg-white rounded-3xl p-5 border shadow-sm transition-all ${c.completed ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white' : 'border-cream-200'}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="text-3xl shrink-0">{c.icon || '🏆'}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-ink">{c.title_ar}</h3>
          <p className="text-xs text-ink-soft mt-0.5 leading-relaxed">{c.description_ar}</p>
        </div>
        {c.completed && !c.claimed && <Gift className="w-5 h-5 text-gold-deep shrink-0 animate-pulse" />}
        {c.claimed && <Check className="w-5 h-5 text-emerald-600 shrink-0" />}
      </div>

      {!c.completed && (
        <>
          <div className="flex items-center justify-between mb-1.5 text-xs">
            <span className="text-ink-soft">
              التقدّم: {c.currentValue} / {c.target_value}
            </span>
            <span className="font-en-display font-bold text-gold-deep">{c.percent}%</span>
          </div>
          <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-gold-deep to-gold-light rounded-full transition-all duration-700"
              style={{ width: `${c.percent}%` }}
            />
          </div>
        </>
      )}

      <div className={`mt-3 rounded-2xl p-2.5 text-center text-xs font-bold ${c.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-cream-50 text-gold-deep border border-cream-200'}`}>
        🎁 {c.reward_description_ar}
      </div>

      {c.completed && c.rewardCode && (
        <div className="mt-2 text-center text-[11px] text-ink-soft">
          كود: <span className="font-en-display font-bold text-gold-deep">{c.rewardCode}</span>
        </div>
      )}
    </div>
  );
}
