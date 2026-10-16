/**
 * سياسة الإلغاء والاسترداد
 */
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata = { title: 'سياسة الإلغاء والاسترداد' };

export default function RefundPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="font-en-label text-[10px] tracking-[0.3em] text-gold mb-2">CANCELLATION & REFUND</div>
          <h1 className="font-ar-display text-3xl font-bold text-gold-deep mb-6">سياسة الإلغاء والاسترداد</h1>
          <p className="text-xs text-ink-soft mb-8">آخر تحديث: {new Date().toLocaleDateString('ar-SA')}</p>

          <div className="space-y-6 text-ink leading-loose text-sm bg-white rounded-3xl p-8 border border-cream-200">
            <section>
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">إلغاء الحجز</h2>
              <ul className="list-disc pr-5 space-y-1">
                <li>يمكنكِ إلغاء الحجز قبل <strong>24 ساعة</strong> من الموعد مجاناً.</li>
                <li>الإلغاء قبل <strong>أقل من 24 ساعة</strong> يحتاج تواصل مع الصالون.</li>
                <li>عدم الحضور بدون إبلاغ قد يؤثر على حجوزاتكِ القادمة.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">تعديل الموعد</h2>
              <ul className="list-disc pr-5 space-y-1">
                <li>تعديل مجاني قبل 24 ساعة من الموعد.</li>
                <li>التعديل بعد ذلك حسب توفّر المواعيد.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">الاسترداد</h2>
              <ul className="list-disc pr-5 space-y-1">
                <li>المدفوعات الإلكترونية تُسترد خلال <strong>5-7 أيام عمل</strong> لنفس وسيلة الدفع.</li>
                <li>العربون غير قابل للاسترداد في حالات الإلغاء المتأخّر.</li>
                <li>الخدمات المُقدَّمة لا تُسترد — لكن نسعى دائماً لرضاكِ.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">بطاقات الهدية</h2>
              <ul className="list-disc pr-5 space-y-1">
                <li>بطاقات الهدية غير قابلة للاسترداد النقدي.</li>
                <li>يمكن استخدامها كلياً أو جزئياً.</li>
                <li>تبقى سارية لمدة سنة من تاريخ الشراء.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">حالات استثنائية</h2>
              <p>في حال ظروف قاهرة (مرض، سفر طارئ)، يُرجى التواصل مع المالكة لإيجاد حل مناسب 💛</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
