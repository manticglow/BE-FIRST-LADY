/**
 * StepIndicator — مؤشّر خطوات الحجز
 * قابل للنقر: الخطوات المكتملة يمكن الرجوع لها
 */
'use client';

import { Check } from 'lucide-react';
import type { Step } from '../types';

export default function StepIndicator({
  current, onJump,
}: {
  current: Step;
  onJump?: (n: Step) => void;
}) {
  const steps = [
    { n: 1 as Step, label: 'الخدمات' },
    { n: 2 as Step, label: 'الوقت' },
    { n: 3 as Step, label: 'بياناتكِ' },
    { n: 4 as Step, label: 'التأكيد' },
  ];

  return (
    <div className="bg-gradient-to-l from-gold-deep/5 to-transparent border-b border-cream-200 p-4 md:p-6">
      <div className="flex items-center justify-between">
        {steps.map((s, i) => {
          const canJump = onJump && s.n <= current;
          return (
            <div key={s.n} className="flex items-center flex-1">
              {canJump ? (
                <button
                  type="button"
                  onClick={() => onJump(s.n)}
                  className="flex flex-col items-center cursor-pointer group"
                  title={`الرجوع لخطوة "${s.label}"`}
                >
                  <StepCircle current={current} n={s.n} jumpable />
                  <StepLabel current={current} n={s.n} label={s.label} jumpable />
                </button>
              ) : (
                <div className="flex flex-col items-center">
                  <StepCircle current={current} n={s.n} />
                  <StepLabel current={current} n={s.n} label={s.label} />
                </div>
              )}
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 ${current > s.n ? 'bg-gold-deep' : 'bg-cream-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StepCircle({ current, n, jumpable }: { current: Step; n: Step; jumpable?: boolean }) {
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center font-en-display font-bold text-sm transition-all ${
        current >= n
          ? `bg-gold-deep text-cream-50 shadow-md ${jumpable ? 'group-hover:scale-110' : ''}`
          : 'bg-cream-100 text-ink-soft'
      }`}
    >
      {current > n ? <Check className="w-4 h-4" /> : n}
    </div>
  );
}

function StepLabel({ current, n, label, jumpable }: { current: Step; n: Step; label: string; jumpable?: boolean }) {
  return (
    <div
      className={`text-[10px] md:text-xs mt-1.5 font-semibold ${
        current >= n ? `text-gold-deep ${jumpable ? 'group-hover:underline' : ''}` : 'text-ink-soft'
      }`}
    >
      {label}
    </div>
  );
}
