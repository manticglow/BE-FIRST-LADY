/**
 * TrustSection — قسم الثقة والأرقام
 * ═══════════════════════════════════════════════════════════
 * - 4 أرقام محوريّة مع عدّاد animated
 * - 4 ضمانات الجودة
 * - خلفية ink فاخرة
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { Shield, Heart, Award, Sparkles, Users, Star, Calendar, Scissors } from 'lucide-react';
import Reveal from '@/components/ui/Reveal';

const STATS = [
  { icon: Users, value: 500, suffix: '+', label: 'عميلة سعيدة', labelEn: 'Happy Clients' },
  { icon: Star, value: 4.9, suffix: '', label: 'تقييم العميلات', labelEn: 'Average Rating', decimals: 1 },
  { icon: Calendar, value: 3000, suffix: '+', label: 'جلسة متميّزة', labelEn: 'Sessions Done' },
  { icon: Scissors, value: 40, suffix: '+', label: 'خدمة فاخرة', labelEn: 'Luxury Services' },
];

const GUARANTEES = [
  {
    icon: Shield,
    title: 'نسائي 100%',
    description: 'طاقم كامل من النساء · بيئة آمنة ومريحة',
  },
  {
    icon: Heart,
    title: 'تعقيم بعد كل جلسة',
    description: 'نلتزم بأعلى معايير النظافة والسلامة',
  },
  {
    icon: Award,
    title: 'خبيرات معتمدات',
    description: 'موظفات بشهادات عالمية ودورات متخصّصة',
  },
  {
    icon: Sparkles,
    title: 'منتجات أصليّة فاخرة',
    description: 'نستخدم فقط ماركات موثوقة ومحترفة',
  },
];

export default function TrustSection() {
  return (
    <section className="section-pad mesh-ink text-cream-50 relative overflow-hidden">

      {/* لمسات ذهبية خلفيّة */}
      <div className="absolute top-10 right-10 w-40 h-40 rounded-full bg-gold-light/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-56 h-56 rounded-full bg-gold-deep/15 blur-3xl pointer-events-none" />

      <div className="container-brand max-w-7xl relative z-10">

        {/* ═══ عنوان القسم ═══ */}
        <Reveal>
          <div className="text-center mb-14">
            <div className="editorial-eyebrow text-gold-light/80 mb-3">BY THE NUMBERS</div>
            <h2 className="oversize-ar text-[clamp(2.5rem,6vw,4.5rem)] text-cream-50 mb-3">
              ثقتكِ عندنا <span className="text-gold-light">تاج</span>
            </h2>
            <p className="oversize-en text-xl md:text-2xl text-gold-light/70 italic">
              Trust that speaks louder than words
            </p>
          </div>
        </Reveal>

        {/* ═══ 4 أرقام محوريّة ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 mb-20">
          {STATS.map((stat, i) => (
            <Reveal key={i} delay={i * 100} direction="scale">
              <StatBlock stat={stat} />
            </Reveal>
          ))}
        </div>

        {/* ═══ 4 ضمانات الجودة ═══ */}
        <Reveal>
          <div className="text-center mb-10">
            <div className="editorial-eyebrow text-gold-light/80 mb-3">OUR PROMISE</div>
            <h3 className="font-ar-display text-3xl md:text-4xl font-bold text-cream-50">
              وعودنا لكِ
            </h3>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {GUARANTEES.map((item, i) => (
            <Reveal key={i} delay={i * 80}>
              <GuaranteeCard item={item} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════ */

function StatBlock({ stat }: { stat: (typeof STATS)[0] }) {
  const Icon = stat.icon;
  const count = useCountUp(stat.value, stat.decimals ?? 0);

  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gold-light/10 border border-gold-light/30 mb-4">
        <Icon className="w-6 h-6 text-gold-light" />
      </div>
      <div className="font-en-display font-bold text-5xl md:text-6xl text-cream-50 leading-none tabular-nums">
        {count}{stat.suffix}
      </div>
      <div className="text-sm md:text-base font-semibold text-cream-100/80 mt-2 font-ar-body">
        {stat.label}
      </div>
      <div className="editorial-eyebrow text-gold-light/60 mt-1 text-[9px]">
        {stat.labelEn}
      </div>
    </div>
  );
}

function GuaranteeCard({ item }: { item: (typeof GUARANTEES)[0] }) {
  const Icon = item.icon;
  return (
    <div className="group relative bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6 hover:bg-white/10 hover:border-gold-light/30 transition-all hover-lift">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gold-light/25 to-gold-light/5 border border-gold-light/30 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-gold-light" />
      </div>
      <h4 className="font-ar-display font-bold text-lg text-cream-50 mb-2">
        {item.title}
      </h4>
      <p className="text-xs text-cream-100/70 leading-relaxed">
        {item.description}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Hook · عدّاد animation
   ═══════════════════════════════════════════════════════════ */
function useCountUp(target: number, decimals = 0, duration = 1500) {
  const [count, setCount] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // ابدأ العدّ لمّا الصفحة جاهزة
    if (started.current) return;
    started.current = true;

    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(target * eased);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString('en-US');
}
