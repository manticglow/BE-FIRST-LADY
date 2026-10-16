/**
 * LashesBannerSection — بنر الرموش والحواجب (فيديوهات)
 * ═══════════════════════════════════════════════════════════
 * - فيديوهين عرضيين فوق
 * - فيديو طولي تحتهم
 */
export default function LashesBannerSection() {
  return (
    <section className="section-pad bg-ink/95 text-cream-50 relative overflow-hidden">
      {/* زخارف خلفية */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-10 right-10 w-40 h-40 bg-gold rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-56 h-56 bg-gold-light rounded-full blur-3xl" />
      </div>

      <div className="container-brand relative z-10 text-center mb-10">
        <div className="font-en-label text-[10px] tracking-[0.4em] text-gold-light mb-2">
          LASHES & BROWS
        </div>
        <h2 className="font-ar-display text-3xl md:text-4xl text-gold-light">
          تفاصيلٌ تُحدِث فرقاً
        </h2>
        <div className="divider-gold w-20 mx-auto mt-4" style={{ background: 'linear-gradient(90deg, transparent, #c9a96e, transparent)' }} />
      </div>

      <div className="container-brand relative z-10">
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          {/* فيديو عرضي 1 */}
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-gold/30 shadow-xl">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/images/gallery/eyes-makeup-poster.jpg"
              className="w-full h-full object-cover"
            >
              <source src="/videos/eyes-makeup.mp4" type="video/mp4" />
            </video>
          </div>

          {/* فيديو عرضي 2 */}
          <div className="relative aspect-video rounded-2xl overflow-hidden border border-gold/30 shadow-xl">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/images/gallery/eyes-detail-poster.jpg"
              className="w-full h-full object-cover"
            >
              <source src="/videos/eyes-detail.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {/* فيديو طولي */}
        <div className="relative aspect-[4/5] md:aspect-[16/9] max-w-2xl mx-auto rounded-2xl overflow-hidden border border-gold/30 shadow-xl">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/images/gallery/lashes-poster.jpg"
            className="w-full h-full object-cover"
          >
            <source src="/videos/lashes.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  );
}
