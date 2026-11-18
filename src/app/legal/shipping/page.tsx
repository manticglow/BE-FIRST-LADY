/**
 * سياسة الشحن والتوصيل (للمتجر · مطلب التجارة الإلكترونيّة)
 */
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata = { title: 'سياسة الشحن والتوصيل' };

export default function ShippingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-deep uppercase mb-2">
            Shipping Policy
          </div>
          <h1 className="font-ar-display text-3xl font-bold text-gold-deep mb-2">
            سياسة الشحن والتوصيل
          </h1>
          <div className="w-10 h-[1px] bg-gold-deep/40 mb-3" />
          <p className="text-xs text-ink-soft mb-8">متوافقة مع نظام التجارة الإلكترونيّة السعودي</p>

          <article className="space-y-6 text-ink leading-loose text-sm bg-white p-8 border border-cream-200" style={{ borderRadius: '20px' }}>

            <Section title="١. طرق الاستلام">
              <ul className="list-disc pr-5 space-y-1">
                <li><strong>الاستلام من الصالون:</strong> مجّاناً · خلال ساعة من تأكيد الطلب</li>
                <li><strong>التوصيل المحلّي (المدينة المنوّرة):</strong> 15 ريال · خلال 24-48 ساعة</li>
                <li><strong>التوصيل لباقي المملكة:</strong> 25 ريال · خلال 2-5 أيّام عمل</li>
              </ul>
            </Section>

            <Section title="٢. أوقات التوصيل">
              <ul className="list-disc pr-5 space-y-1">
                <li>الطلبات قبل الساعة 12 ظهراً: توصيل في نفس اليوم (المدينة)</li>
                <li>الطلبات بعد 12 ظهراً: توصيل اليوم التالي</li>
                <li>أيّام الجمعة والعطل الرسميّة: لا توصيل</li>
              </ul>
            </Section>

            <Section title="٣. تكلفة الشحن">
              <p>
                تُعرض تكلفة الشحن <strong>كاملة وواضحة قبل إتمام الدفع</strong> ·
                السعر النهائي شامل الشحن والضريبة.
              </p>
            </Section>

            <Section title="٤. تتبّع الطلب">
              <p>
                بعد شحن طلبكِ · ترسل رسالة واتساب برقم تتبّع من شركة التوصيل.
                تقدرين متابعة طلبكِ من <code className="font-en-display">/account/bookings</code>.
              </p>
            </Section>

            <Section title="٥. تأخّر الطلب">
              <p>
                إذا تأخّر طلبكِ عن المدّة المذكورة · تواصلي معنا فوراً:
              </p>
              <ul className="list-disc pr-5 space-y-1 mt-2">
                <li>📞 الجوال: 0504134147</li>
                <li>💬 واتساب: 0504134147</li>
                <li>📝 أو قدّمي <a href="/legal/complaints" className="text-gold-deep underline">شكوى رسميّة</a></li>
              </ul>
            </Section>

            <Section title="٦. المنتجات التي لا تُشحن">
              <ul className="list-disc pr-5 space-y-1">
                <li>الخدمات داخل الصالون (حجز موعد فقط · لا شحن)</li>
                <li>كروت الهديّة الرقميّة (تُرسل بالإيميل/الواتساب فوراً)</li>
              </ul>
            </Section>

          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">{title}</h2>
      <div className="text-sm leading-loose">{children}</div>
    </section>
  );
}
