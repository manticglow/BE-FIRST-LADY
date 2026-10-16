/**
 * StorySection — قصّة المكان مع صورة الاستقبال
 */
import Image from 'next/image';

export default function StorySection() {
  return (
    <section id="story" className="section-pad bg-cream-50/60">
      <div className="container-brand max-w-6xl">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* النص */}
          <div className="order-2 md:order-1 text-center md:text-right">
            <span className="heading-eyebrow">OUR STORY</span>
            <h2 className="heading-title mt-2">قصّة المكان</h2>
            <span className="divider-gold md:mx-0" />
            <p className="text-lg text-ink leading-loose mt-6">
              <strong className="text-gold-deep">Be First Lady</strong> مساحة فاخرة للعناية والجمال
              في المدينة المنوّرة، تجمع بين الرقيّ والاحترافية.
            </p>
            <p className="text-base text-ink-soft leading-relaxed mt-4">
              هويتنا تعكس الأنوثة الراقية عبر اللوتس — رمز الطهارة والجمال
              الذي يتفتّح من جذوره ليصبح في أبهى صوره.
            </p>
          </div>

          {/* صورة الاستقبال */}
          <div className="order-1 md:order-2 relative">
            <div className="relative aspect-[4/5] max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/images/story/reception.jpg"
                alt="استقبال Be First Lady"
                fill
                className="object-cover"
              />
              {/* إطار ذهبي */}
              <div className="absolute inset-3 border border-gold-light/40 rounded-2xl pointer-events-none" />
            </div>
            {/* زاوية ذهبية خلف الصورة */}
            <div className="absolute -top-4 -right-4 w-24 h-24 border-t-2 border-r-2 border-gold/40 rounded-tr-3xl pointer-events-none" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 border-b-2 border-l-2 border-gold/40 rounded-bl-3xl pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
}
