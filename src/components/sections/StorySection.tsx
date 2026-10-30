/**
 * StorySection v3 — قصّة Editorial سينمائيّة
 * ═══════════════════════════════════════════════════════════
 * - تصميم magazine-style
 * - صور فنيّة
 * - اقتباسات بارزة
 * - timeline عناصر القصّة
 */
'use client';

import Image from 'next/image';
import { Flower2, Heart, Crown, Quote } from 'lucide-react';
import Reveal from '@/components/ui/Reveal';

const STORY_PILLARS = [
  {
    icon: Flower2,
    title: 'ملاذٌ خاص',
    description: 'تصميم داخلي مدروس لكل تفصيل · من الإضاءة للعطر إلى الموسيقى',
  },
  {
    icon: Crown,
    title: 'أيادٍ خبيرة',
    description: 'طاقم من أمهر الاختصاصيّات بشهادات عالمية ودورات متخصّصة',
  },
  {
    icon: Heart,
    title: 'تجربة شخصيّة',
    description: 'كل عميلة تحظى بتجربتها الفريدة · لا نعامل أحداً كرقم',
  },
];

export default function StorySection() {
  return (
    <section id="story" className="section-pad bg-white relative overflow-hidden">

      {/* ═══ زخرفة خلفيّة ═══ */}
      <div className="absolute top-10 left-10 opacity-5 pointer-events-none" aria-hidden="true">
        <Image src="/images/lotus-decoration.svg" alt="" width={400} height={400} />
      </div>

      <div className="container-brand max-w-6xl relative">

        {/* ═══ شبكة editorial ═══ */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center mb-20">

          {/* ━━━ العمود الأيمن · صور فنيّة ━━━ */}
          <Reveal direction="right" className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative">
              {/* صورة رئيسيّة · عمودية */}
              <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl shadow-gold-deep/15">
                <Image
                  src="/images/gallery/evening-glam.jpg"
                  alt="Be First Lady atmosphere"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/30 to-transparent" />
              </div>

              {/* صورة ثانيّة صغيرة · عائمة */}
              <div className="absolute -top-6 -left-6 w-32 h-40 rounded-2xl overflow-hidden shadow-xl border-4 border-white hidden md:block">
                <Image
                  src="/images/gallery/hairstyle.jpg"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              </div>

              {/* شارة سنة التأسيس · عائمة */}
              <div className="absolute -bottom-5 -right-5 bg-gradient-to-br from-gold-deep to-ink text-cream-50 rounded-2xl p-5 shadow-xl hidden md:block">
                <div className="editorial-eyebrow text-gold-light/80">EST.</div>
                <div className="font-en-display font-bold text-3xl leading-none">2026</div>
                <div className="text-[9px] opacity-80 mt-1">المدينة المنوّرة</div>
              </div>
            </div>
          </Reveal>

          {/* ━━━ العمود الأيسر · النص ━━━ */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <Reveal>
              <div className="editorial-eyebrow mb-4">OUR STORY</div>
              <h2 className="oversize-ar text-[clamp(2.5rem,6vw,4.5rem)] text-gold-deep mb-4 leading-[1.05]">
                قصّتنا بدأت
                <br />
                <span className="text-gold-light">بشغف واحد</span>
              </h2>
              <p className="oversize-en text-xl text-gold-light italic mb-8">
                "A sanctuary born from passion"
              </p>
            </Reveal>

            <Reveal delay={150}>
              <div className="prose prose-lg max-w-none text-ink-soft leading-relaxed space-y-4">
                <p>
                  وُلدت <strong className="text-ink">بي فيرست ليدي</strong> من إيمان عميق بأنّ كلّ سيّدة تستحقّ
                  لحظات تُشعرها بأنها <em>الأولى والأهم</em>.
                </p>
                <p>
                  في قلب المدينة المنوّرة · أنشأنا هذا الملاذ ليكون أكثر من مجرّد صالون أو سبا ·
                  بل تجربة متكاملة تمزج بين الفخامة العربية الأصيلة والعناية الحديثة.
                </p>
                <p>
                  نؤمن بأنّ الجمال الحقيقي يبدأ من الداخل · لذلك نهتمّ بروحكِ قبل مظهركِ ·
                  ونصنع لكِ لحظات <strong className="text-gold-deep">لا تُنسى</strong>.
                </p>
              </div>
            </Reveal>

            {/* اقتباس بارز */}
            <Reveal delay={250}>
              <blockquote className="mt-10 bg-gradient-to-l from-gold-light/10 to-transparent border-r-4 border-gold-deep p-6 rounded-r-2xl">
                <Quote className="w-6 h-6 text-gold-light mb-3" />
                <p className="font-ar-display text-xl md:text-2xl text-gold-deep leading-relaxed italic">
                  "نعتني بكِ لتُزهري"
                </p>
                <footer className="editorial-eyebrow text-gold-light/70 mt-3">
                  — Our Philosophy
                </footer>
              </blockquote>
            </Reveal>
          </div>
        </div>

        {/* ═══ 3 ركائز القصّة ═══ */}
        <div className="grid md:grid-cols-3 gap-6">
          {STORY_PILLARS.map((pillar, i) => (
            <Reveal key={i} delay={i * 100}>
              <PillarCard pillar={pillar} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PillarCard({ pillar }: { pillar: (typeof STORY_PILLARS)[0] }) {
  const Icon = pillar.icon;
  return (
    <div className="relative bg-gradient-to-br from-cream-50 to-cream-100 rounded-3xl p-8 border border-gold-light/15 hover:border-gold-light/40 hover-lift group">
      {/* أيقونة بشكل كبير وأنيق */}
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-deep to-ink text-cream-50 flex items-center justify-center mb-5 shadow-lg shadow-gold-deep/20 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-ar-display text-xl md:text-2xl font-bold text-gold-deep mb-2">
        {pillar.title}
      </h3>
      <p className="text-sm text-ink-soft leading-relaxed">
        {pillar.description}
      </p>
    </div>
  );
}
