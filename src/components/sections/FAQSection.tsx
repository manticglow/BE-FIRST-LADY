'use client';

/**
 * FAQSection — أسئلة شائعة بـaccordion فاخر
 */
import { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

interface FAQ {
  q: string;
  a: string;
  category?: 'booking' | 'payment' | 'services' | 'policy';
}

const FAQS: FAQ[] = [
  {
    category: 'booking',
    q: 'كيف أحجز موعد؟',
    a: 'بكل سهولة · ادخلي صفحة "احجزي" من القائمة · اختاري التصنيف ثم الخدمة · حدّدي التاريخ والوقت المناسبين · أدخلي بياناتكِ · وأكّدي الحجز. راح يصلك واتساب تأكيد على طول.',
  },
  {
    category: 'booking',
    q: 'هل أقدر أعدّل أو ألغي حجزي؟',
    a: 'نعم · تقدرين تعدّلين موعدكِ أو تلغينه مجّاناً قبل 24 ساعة من الموعد من صفحة "حجوزاتي" في حسابكِ. بعد الـ24 ساعة · يرجى التواصل معنا واتساب.',
  },
  {
    category: 'booking',
    q: 'كم مدّة الانتظار لتأكيد الحجز؟',
    a: 'نؤكّد كل الحجوزات خلال 15 دقيقة في ساعات العمل (10 ص - 11 م). لو حجزتِ بعد ساعات العمل · التأكيد يوصل الصباح الباكر.',
  },
  {
    category: 'payment',
    q: 'ما هي طرق الدفع المتاحة؟',
    a: 'نقبل كل طرق الدفع: مدى · فيزا · ماستر كارد · Apple Pay · STC Pay · تابي (تقسيط 4 دفعات) · تمارا (3 دفعات) · أو كاش في الصالون. تختارين الأنسب لكِ.',
  },
  {
    category: 'payment',
    q: 'هل أدفع كامل المبلغ أم عربون فقط؟',
    a: 'للخدمات 500 ر.س أو أكثر · فيه خيار دفع عربون 25% فقط إلكترونياً · والباقي عند زيارتكِ للصالون. أقل من 500 ر.س · ادفعي كاش في الصالون أو كامل إلكترونياً.',
  },
  {
    category: 'payment',
    q: 'كيف أستخدم نقاط الولاء؟',
    a: 'كل 100 نقطة = 10 ر.س · تقدرين تصرفينها عند الدفع. اختاري "صرف نقاط" في صفحة الدفع · واسحبي الشريط للكمّية اللي تبين تستخدمينها.',
  },
  {
    category: 'services',
    q: 'هل تخدمون الحوامل والمرضعات؟',
    a: 'نعم · لدينا جلسات مخصّصة للحوامل والمرضعات · مع تجنّب الزيوت والمواد اللي ما تناسبهنّ. المهم تحدّثين حالتكِ في "ملف الجمال" قبل الزيارة · والموظّفة بتعدّل البروتوكول حسب احتياجكِ.',
  },
  {
    category: 'services',
    q: 'هل الصالون نسائي بالكامل؟',
    a: 'نعم · 100% نسائي · كل الموظّفات والعاملات نساء · والصالون آمن ومريح بدون أي رجال. مكان خاصّ لكِ ولصديقاتكِ.',
  },
  {
    category: 'services',
    q: 'هل تقدمون خدمات في البيت؟',
    a: 'حالياً خدماتنا في مقرّنا بالمدينة المنوّرة فقط · لتوفير أعلى جودة ومعايير النظافة. متابعين قناتنا لأي توسّع مستقبلي.',
  },
  {
    category: 'policy',
    q: 'ما سياسة الاسترداد لبطاقات الهديّة؟',
    a: 'بطاقات الهديّة غير قابلة للاسترداد النقدي · لكن قابلة للتحويل إلى شخص آخر. صالحة سنة كاملة من تاريخ الإصدار (إلّا إذا حدّدنا تاريخ انتهاء مختلف وقت الشراء).',
  },
  {
    category: 'policy',
    q: 'ماذا لو تأخّرت عن موعدي؟',
    a: 'يرجى الحضور قبل الموعد بـ10 دقائق. التأخّر أكثر من 15 دقيقة قد يسبّب تقليص وقت الخدمة أو إعادة الجدولة · لنحافظ على مواعيد العميلات الأخريات.',
  },
  {
    category: 'policy',
    q: 'هل أقدر أدعو صديقتي معي؟',
    a: 'طبعاً · نسعد باستقبالكِ وصديقاتكِ. لو تبين تحجزين لـ3 صديقات أو أكثر في نفس الوقت · تواصلي معنا واتساب لنحجز لكنّ مكاناً خاصّاً وموظّفات متعدّدات.',
  },
];

const CATEGORIES = [
  { key: 'all',      label: 'الكل',       emoji: '✨' },
  { key: 'booking',  label: 'الحجز',       emoji: '📅' },
  { key: 'payment',  label: 'الدفع',       emoji: '💳' },
  { key: 'services', label: 'الخدمات',    emoji: '💆' },
  { key: 'policy',   label: 'السياسات',   emoji: '📋' },
] as const;

export default function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);
  const [filter, setFilter] = useState<string>('all');

  const filtered = filter === 'all'
    ? FAQS
    : FAQS.filter((f) => f.category === filter);

  return (
    <section id="faq" className="section-pad relative overflow-hidden">
      {/* زخارف خلفيّة */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-rose-100/20 rounded-full blur-3xl pointer-events-none" />

      <div className="container-brand max-w-4xl relative">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="heading-eyebrow">FAQ</span>
          <h2 className="font-ar-display text-3xl md:text-4xl font-bold text-gold-deep mt-1">
            أسئلة شائعة
          </h2>
          <span className="divider-gold" />
          <p className="font-en-display italic text-ink-soft mt-2 text-sm">
            كل اللي تحتاجين معرفته
          </p>
        </div>

        {/* فلاتر */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => { setFilter(cat.key); setOpen(0); }}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filter === cat.key
                  ? 'bg-gradient-to-br from-gold-deep to-ink text-cream-50 shadow-md'
                  : 'bg-white border border-gold-light/30 text-ink-soft hover:border-gold-light hover:text-gold-deep'
              }`}
            >
              <span>{cat.emoji}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* قائمة الأسئلة */}
        <div className="space-y-2">
          {filtered.map((faq, idx) => (
            <div
              key={idx}
              className={`glass-card rounded-2xl overflow-hidden transition-all ${
                open === idx ? 'ring-2 ring-gold-light/40 shadow-lg' : ''
              }`}
            >
              <button
                onClick={() => setOpen(open === idx ? null : idx)}
                className="w-full px-5 py-4 flex items-center justify-between gap-3 text-right hover:bg-cream-50/50 transition-colors"
              >
                <span className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    open === idx
                      ? 'bg-gradient-to-br from-gold-deep to-ink text-cream-50'
                      : 'bg-gold-light/15 text-gold-deep'
                  }`}>
                    <HelpCircle className="w-4 h-4" />
                  </span>
                  <span className="font-ar-display font-bold text-ink text-sm md:text-base">
                    {faq.q}
                  </span>
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-gold-deep shrink-0 transition-transform duration-300 ${
                    open === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* الجواب · ينفتح بسلاسة */}
              <div
                className={`grid transition-all duration-300 ${
                  open === idx ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-5 pt-1 border-t border-gold-light/15">
                    <p className="text-sm text-ink-soft leading-relaxed pl-11">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* "ما لقيتي جوابكِ؟" */}
        <div className="mt-10 bg-gradient-to-br from-cream-50 to-amber-50/50 border border-gold-light/20 rounded-3xl p-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-gold-deep to-ink text-cream-50 flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-ar-display font-bold text-lg text-gold-deep mb-1">
            ما لقيتي جوابكِ؟
          </h3>
          <p className="text-sm text-ink-soft mb-4">
            تواصلي معنا مباشرة · نحن هنا لخدمتكِ
          </p>
          <a
            href={`https://wa.me/966504389329`}
            target="_blank"
            rel="noopener"
            className="btn-shimmer inline-flex items-center gap-2 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-full shadow-lg shadow-emerald-500/25 hover:scale-105 transition-transform overflow-hidden"
          >
            <span className="relative z-10">تواصلي عبر واتساب</span>
          </a>
        </div>
      </div>
    </section>
  );
}
