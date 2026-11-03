/**
 * HeroSection v3 — Editorial Luxury Hero
 * ═══════════════════════════════════════════════════════════
 * - خطّ عربي ضخم (Amiri) · typography-first design
 * - شبكة editorial مع صورة فنيّة
 * - دخول متتابع ناعم
 * - مؤشّر تمرير أنيق
 * - mesh gradient خلفي
 */
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, Calendar, Sparkles, MapPin, Clock, Phone } from 'lucide-react';
import LightRays from '@/components/fx/LightRays';
import Petals from '@/components/ui/Petals';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden mesh-cream">

      {/* ═══ أشعّة ذهبيّة ناعمة ═══ */}
      <LightRays />

      {/* ═══ بتلات متساقطة في الخلفيّة ═══ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden petals-always" aria-hidden="true">
        <Petals count={6} />
      </div>

      {/* ═══ زخارف خلفيّة ═══ */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 right-10 opacity-25">
          <Image src="/images/lotus-decoration.svg" alt="" width={240} height={240} />
        </div>
        <div className="absolute bottom-24 left-10 opacity-15">
          <Image src="/images/lotus-decoration.svg" alt="" width={320} height={320} />
        </div>
      </div>

      <div className="relative z-10 container-brand max-w-7xl w-full py-20 md:py-24">

        {/* ═══ شبكة editorial · عمودين على الديسكتوب ═══ */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">

          {/* ━━━ العمود الأيسر · النص الكبير ━━━ */}
          <div className="lg:col-span-7 text-right">

            {/* شارة علوية */}
            <div className="animate-in inline-flex items-center gap-2 bg-white/70 backdrop-blur-md border border-gold-light/30 text-gold-deep font-bold text-xs px-4 py-2 rounded-full shadow-sm mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              <span>EST. 2026 · المدينة المنوّرة</span>
            </div>

            {/* العنوان الـEditorial · ضخم */}
            <h1 className="animate-in animate-in-delay-1 mb-6">
              <span className="oversize-ar block text-[clamp(3rem,10vw,8rem)] text-gold-deep">
                نعتني
              </span>
              <span className="oversize-ar block text-[clamp(3rem,10vw,8rem)] text-ink -mt-3">
                بـــكِ
              </span>
              <span className="oversize-en block text-[clamp(2rem,6vw,5rem)] mt-2 italic gradient-text">
                for you to bloom
              </span>
            </h1>

            {/* الوصف */}
            <p className="animate-in animate-in-delay-2 text-base md:text-lg text-ink-soft leading-relaxed max-w-xl mb-10 mr-0">
              مركز نسائي متكامل في قلب المدينة المنوّرة · ترفٌ يليق بكِ وجمالٌ يُحكى عنه.
              <br />
              <span className="font-en-display italic text-sm text-gold-deep mt-1 block">
                Massage · Hammam · Facial · Hair · Makeup
              </span>
            </p>

            {/* CTAs */}
            <div className="animate-in animate-in-delay-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-10">
              <Link
                href="/booking"
                className="group btn-shimmer btn-halo inline-flex items-center justify-center gap-2 bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50 font-ar-display font-bold text-lg px-10 py-4 rounded-full shadow-xl shadow-gold-deep/25 hover:scale-[1.03] transition-transform"
              >
                <Calendar className="w-5 h-5 group-hover:rotate-6 transition-transform relative z-10" />
                <span className="relative z-10">احجزي موعدكِ</span>
              </Link>
              <Link
                href="#services"
                className="inline-flex items-center justify-center gap-2 bg-white/70 backdrop-blur text-gold-deep font-bold px-8 py-4 rounded-full border border-gold-light/40 hover:bg-white transition-colors"
              >
                تصفّحي الخدمات
                <ArrowDown className="w-4 h-4" />
              </Link>
            </div>

            {/* معلومات سريعة */}
            <div className="animate-in animate-in-delay-4 grid grid-cols-3 gap-3 max-w-xl">
              <QuickFact icon={MapPin} label="الموقع" value="المدينة المنوّرة" />
              <QuickFact icon={Clock} label="المواعيد" value="10ص - 11م" />
              <QuickFact icon={Sparkles} label="الخدمات" value="+40 خدمة" />
            </div>
          </div>

          {/* ━━━ العمود الأيمن · البطاقة البصريّة ━━━ */}
          <div className="lg:col-span-5 animate-in animate-in-delay-2">
            <HeroVisualCard />
          </div>
        </div>

        {/* ═══ شريط تحتي · شهادات/ثقة ═══ */}
        <div className="animate-in animate-in-delay-5 mt-16 pt-10 border-t border-gold-light/15">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <TrustBadge value="+500" label="عميلة سعيدة" />
            <TrustBadge value="4.9" label="تقييم ⭐" />
            <TrustBadge value="+40" label="خدمة فاخرة" />
            <TrustBadge value="100%" label="نسائي بالكامل" />
          </div>
        </div>
      </div>

      {/* ═══ مؤشّر تمرير ═══ */}
      <Link
        href="#story"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gold-deep hover:text-ink transition-colors group z-10"
        aria-label="تمرير"
      >
        <span className="editorial-eyebrow">SCROLL</span>
        <div className="w-6 h-10 border-2 border-gold-deep/40 rounded-full flex items-start justify-center p-1 group-hover:border-ink transition-colors">
          <span className="w-1 h-2 bg-gold-deep rounded-full animate-bounce" />
        </div>
      </Link>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════ */

function HeroVisualCard() {
  return (
    <div className="relative">
      {/* بطاقة رئيسيّة */}
      <div className="relative aspect-[3/4] rounded-3xl overflow-hidden bg-gradient-to-br from-gold-light/20 to-cream-100 shadow-2xl shadow-gold-deep/15">
        <Image
          src="/images/gallery/bridal-look.jpg"
          alt="Be First Lady experience"
          fill
          priority
          className="object-cover ken-burns"
          sizes="(max-width: 1024px) 100vw, 40vw"
        />
        {/* تدرّج سفلي */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink/80 via-ink/40 to-transparent" />

        {/* نص فوق الصورة */}
        <div className="absolute inset-x-0 bottom-0 p-6 text-cream-50">
          <div className="editorial-eyebrow mb-2 opacity-80">SIGNATURE SERVICE</div>
          <h3 className="font-ar-display text-2xl font-bold leading-tight mb-2">
            تجربة البرايد الكاملة
          </h3>
          <p className="text-xs opacity-90 leading-relaxed">
            جلسة متكاملة تجعل من يومكِ تجربة لا تُنسى
          </p>
        </div>

        {/* شارة سعر */}
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-2xl px-3 py-2 shadow-lg">
          <div className="text-[9px] text-ink-soft font-bold">تبدأ من</div>
          <div className="font-en-display font-bold text-xl text-gold-deep -mt-0.5">
            SAR 999
          </div>
        </div>
      </div>

      {/* بطاقة صغيرة · شهادة · عائمة */}
      <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-4 shadow-xl border border-cream-200 max-w-[220px] hidden md:block">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex -space-x-2 flex-row-reverse">
            {['🌸', '✨', '💎'].map((e, i) => (
              <div key={i} className="w-7 h-7 rounded-full bg-cream-100 border-2 border-white flex items-center justify-center text-xs">
                {e}
              </div>
            ))}
          </div>
          <div className="text-[10px] text-ink-soft">+500 عميلة</div>
        </div>
        <div className="text-xs text-ink font-bold leading-relaxed">
          "تجربة فاخرة بكل تفصيل · أحسن مكان بالمدينة"
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className="text-gold-deep text-xs">★</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickFact({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-3 border border-gold-light/20 text-center hover-lift">
      <Icon className="w-4 h-4 text-gold-deep mx-auto mb-1.5" />
      <div className="text-[10px] text-ink-soft">{label}</div>
      <div className="text-xs font-bold text-ink mt-0.5">{value}</div>
    </div>
  );
}

function TrustBadge({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-en-display font-bold text-3xl md:text-4xl text-gold-deep leading-none">
        {value}
      </div>
      <div className="text-[11px] text-ink-soft mt-1 font-semibold">
        {label}
      </div>
    </div>
  );
}
