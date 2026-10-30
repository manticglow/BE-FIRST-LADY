/**
 * SignatureServicesSection — عرض الخدمات المميّزة بشكل Bento
 * ═══════════════════════════════════════════════════════════
 * شبكة غير متماثلة بصريّاً · أحدث اتجاهات 2026
 * - خدمة كبيرة محوريّة
 * - 4 خدمات ثانوية
 * - كل بطاقة لها شخصيّتها
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Sparkles, Flower2, Droplets, Scissors, Brush } from 'lucide-react';
import Reveal from '@/components/ui/Reveal';

const BENTO_SERVICES = [
  {
    key: 'bridal',
    title: 'جلسة البرايد',
    subtitle: 'The Bridal Experience',
    description: 'يومكِ الخاص يستحقّ تجربة متكاملة · من الحمّام للمكياج النهائي',
    price: 'تبدأ من 999 ر.س',
    image: '/images/gallery/bridal-look.jpg',
    icon: Sparkles,
    gradient: 'from-rose-900/80 via-rose-800/40 to-transparent',
    size: 'large', // 2x2
    link: '/services?filter=bridal',
  },
  {
    key: 'massage',
    title: 'المساج الفاخر',
    subtitle: 'Signature Massage',
    description: 'ساعة من الاسترخاء العميق',
    price: '280 ر.س',
    image: '/images/gallery/evening-glam.jpg',
    icon: Flower2,
    gradient: 'from-amber-900/70 to-transparent',
    size: 'tall', // 1x2
    link: '/services?category=massage',
  },
  {
    key: 'hammam',
    title: 'الحمّام المغربي',
    subtitle: 'Moroccan Hammam',
    description: 'نعومة تدوم',
    price: '180 ر.س',
    image: '/images/gallery/hairstyle.jpg',
    icon: Droplets,
    gradient: 'from-teal-900/70 to-transparent',
    size: 'wide', // 2x1
    link: '/services?category=bath',
  },
  {
    key: 'hair',
    title: 'تجميل الشعر',
    subtitle: 'Hair Artistry',
    description: 'قصّة وصبغة بأيدي خبيرات',
    price: 'من 150 ر.س',
    image: '/images/gallery/hollywood-waves.jpg',
    icon: Scissors,
    gradient: 'from-amber-900/70 to-transparent',
    size: 'small',
    link: '/services?category=hair',
  },
  {
    key: 'makeup',
    title: 'الميك اب',
    subtitle: 'Makeup Artistry',
    description: 'إطلالة تخطف الأنظار',
    price: 'من 200 ر.س',
    image: '/images/gallery/bridal-makeup.jpg',
    icon: Brush,
    gradient: 'from-rose-900/70 to-transparent',
    size: 'small',
    link: '/services?category=makeup',
  },
];

export default function SignatureServicesSection() {
  return (
    <section className="section-pad bg-cream-50 relative">

      {/* ═══ عنوان القسم ═══ */}
      <div className="container-brand max-w-7xl">
        <Reveal>
          <div className="text-center mb-14 md:mb-16">
            <div className="editorial-eyebrow mb-3">SIGNATURE EXPERIENCES</div>
            <h2 className="oversize-ar text-[clamp(2.5rem,7vw,5rem)] text-gold-deep mb-3">
              تجاربنا <span className="text-gold-light">الموقّعة</span>
            </h2>
            <p className="oversize-en text-xl md:text-2xl text-gold-light italic mt-2">
              Where every moment is crafted for you
            </p>
          </div>
        </Reveal>

        {/* ═══ شبكة Bento ═══ */}
        <div className="grid grid-cols-6 gap-3 md:gap-4 auto-rows-[200px] md:auto-rows-[260px]">

          {/* البطاقة الكبيرة · البرايد (2x2) */}
          <Reveal direction="scale" className="col-span-6 md:col-span-4 md:row-span-2">
            <BentoCard service={BENTO_SERVICES[0]} />
          </Reveal>

          {/* المساج · عمودي (1x2) */}
          <Reveal direction="right" delay={100} className="col-span-3 md:col-span-2 md:row-span-2">
            <BentoCard service={BENTO_SERVICES[1]} />
          </Reveal>

          {/* الحمّام · أفقي (2x1) */}
          <Reveal direction="up" delay={150} className="col-span-6 md:col-span-4">
            <BentoCard service={BENTO_SERVICES[2]} wide />
          </Reveal>

          {/* الشعر · صغير */}
          <Reveal direction="up" delay={200} className="col-span-3 md:col-span-1">
            <BentoCard service={BENTO_SERVICES[3]} compact />
          </Reveal>

          {/* الميك اب · صغير */}
          <Reveal direction="up" delay={250} className="col-span-3 md:col-span-1">
            <BentoCard service={BENTO_SERVICES[4]} compact />
          </Reveal>
        </div>

        {/* ═══ CTA للكل ═══ */}
        <Reveal delay={300}>
          <div className="text-center mt-12">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 bg-white border border-gold-light/40 text-gold-deep font-ar-display font-bold px-8 py-3 rounded-full hover:bg-gold-deep hover:text-cream-50 transition-colors group"
            >
              <span>تصفّحي كامل خدماتنا</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════ */

function BentoCard({
  service, wide = false, compact = false,
}: {
  service: (typeof BENTO_SERVICES)[0];
  wide?: boolean; compact?: boolean;
}) {
  const Icon = service.icon;

  return (
    <Link
      href={service.link}
      className="group relative block w-full h-full overflow-hidden rounded-3xl shadow-md hover:shadow-2xl hover:shadow-gold-deep/20 transition-all duration-500 bg-gradient-to-br from-cream-100 to-cream-200"
    >
      {/* الصورة */}
      <Image
        src={service.image}
        alt={service.title}
        fill
        className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
        sizes={wide ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 50vw, 33vw'}
      />

      {/* التدرّج */}
      <div className={`absolute inset-0 bg-gradient-to-t ${service.gradient}`} />

      {/* شارة الأيقونة · فوق يمين */}
      <div className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center shadow-md">
        <Icon className="w-5 h-5 text-gold-deep" />
      </div>

      {/* شارة السعر · فوق يسار */}
      <div className="absolute top-4 left-4 bg-ink/80 backdrop-blur-md text-cream-50 text-[10px] font-bold px-3 py-1.5 rounded-full">
        {service.price}
      </div>

      {/* المحتوى · في الأسفل */}
      <div className={`absolute inset-x-0 bottom-0 p-5 md:p-6 text-cream-50 ${compact ? 'text-sm' : ''}`}>
        <div className="editorial-eyebrow text-cream-100/70 mb-1.5 text-[9px] md:text-[10px]">
          {service.subtitle}
        </div>
        <h3 className={`font-ar-display font-bold ${compact ? 'text-lg' : wide ? 'text-2xl md:text-3xl' : 'text-2xl md:text-4xl'} leading-tight mb-2 drop-shadow-md`}>
          {service.title}
        </h3>
        {!compact && (
          <p className="text-xs md:text-sm opacity-95 leading-relaxed max-w-md drop-shadow">
            {service.description}
          </p>
        )}

        {/* CTA ذهبي */}
        <div className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-gold-light group-hover:text-cream-50 transition-colors">
          <span>اكتشفيها</span>
          <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
