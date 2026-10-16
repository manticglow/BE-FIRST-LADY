/**
 * الشروط والأحكام
 */
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata = { title: 'الشروط والأحكام' };

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24">
        <div className="max-w-3xl mx-auto px-4 py-10 prose prose-sm">
          <div className="font-en-label text-[10px] tracking-[0.3em] text-gold mb-2">TERMS & CONDITIONS</div>
          <h1 className="font-ar-display text-3xl font-bold text-gold-deep mb-6">الشروط والأحكام</h1>
          <p className="text-xs text-ink-soft mb-8">آخر تحديث: {new Date().toLocaleDateString('ar-SA')}</p>

          <div className="space-y-6 text-ink leading-loose text-sm bg-white rounded-3xl p-8 border border-cream-200">
            <section>
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">1. مقدّمة</h2>
              <p>مرحباً بكِ في Be First Lady. باستخدامكِ لموقعنا أو حجز أي خدمة، فإنكِ توافقين على الشروط التالية.</p>
            </section>

            <section>
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">2. الحجز والمواعيد</h2>
              <ul className="list-disc pr-5 space-y-1">
                <li>الحجز يُعتبر مؤكّداً عند استلامكِ رسالة تأكيد من الصالون.</li>
                <li>يُنصح بالوصول قبل 10 دقائق من موعدكِ.</li>
                <li>التأخّر أكثر من 15 دقيقة قد يؤدي إلى إلغاء الحجز.</li>
                <li>بعض الخدمات تحتاج استشارة قبل بدء الجلسة.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">3. الأسعار والدفع</h2>
              <ul className="list-disc pr-5 space-y-1">
                <li>الأسعار المعروضة بالريال السعودي، شاملة ضريبة القيمة المضافة (إن طُبِّقت).</li>
                <li>يُقبل الدفع نقداً، مدى، فيزا، Apple Pay، STC Pay.</li>
                <li>الصالون يحتفظ بحق تعديل الأسعار دون إشعار مسبق.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">4. الكوبونات والعروض</h2>
              <ul className="list-disc pr-5 space-y-1">
                <li>لا تجتمع العروض — كوبون واحد لكل حجز.</li>
                <li>العروض الموسمية محدودة بوقتها المذكور.</li>
                <li>بطاقات الهدية قابلة للاستخدام الكلي أو الجزئي، ولا تُستبدل بالنقد.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">5. المسؤولية</h2>
              <ul className="list-disc pr-5 space-y-1">
                <li>الصالون غير مسؤول عن أي ردود فعل أو حساسية لم تُذكر مسبقاً.</li>
                <li>يُرجى إبلاغ الاختصاصية بأي حالات صحية أو حساسيات قبل الجلسة.</li>
                <li>الصالون غير مسؤول عن المقتنيات الثمينة المتروكة.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">6. ساعات العمل والعطل</h2>
              <p>تجدين ساعات العمل الحالية على الصفحة الرئيسية. قد تتغيّر في الأعياد والمناسبات.</p>
            </section>

            <section>
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">7. التواصل</h2>
              <p>للاستفسارات: عبر الواتساب أو زيارتنا في المدينة المنوّرة.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
