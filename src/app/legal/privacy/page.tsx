/**
 * سياسة الخصوصية
 */
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata = { title: 'سياسة الخصوصية' };

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="font-en-label text-[10px] tracking-[0.3em] text-gold mb-2">PRIVACY POLICY</div>
          <h1 className="font-ar-display text-3xl font-bold text-gold-deep mb-6">سياسة الخصوصية</h1>
          <p className="text-xs text-ink-soft mb-8">آخر تحديث: {new Date().toLocaleDateString('ar-SA')}</p>

          <div className="space-y-6 text-ink leading-loose text-sm bg-white rounded-3xl p-8 border border-cream-200">
            <section>
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">البيانات التي نجمعها</h2>
              <ul className="list-disc pr-5 space-y-1">
                <li><strong>بياناتكِ الشخصية:</strong> الاسم، رقم الجوال، البريد الإلكتروني.</li>
                <li><strong>بيانات الحجز:</strong> الخدمات، التواريخ، التفضيلات.</li>
                <li><strong>بيانات تقنية:</strong> نوع المتصفح والجهاز (للتحسين).</li>
              </ul>
            </section>

            <section>
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">كيف نستخدم بياناتكِ</h2>
              <ul className="list-disc pr-5 space-y-1">
                <li>إدارة حجوزاتكِ والتواصل معكِ.</li>
                <li>تخصيص تجربتكِ وتقديم عروض مناسبة.</li>
                <li>تحسين خدماتنا بناءً على تقييماتكِ.</li>
                <li>الالتزام بالمتطلبات القانونية (الفواتير الضريبية).</li>
              </ul>
            </section>

            <section>
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">حماية البيانات</h2>
              <ul className="list-disc pr-5 space-y-1">
                <li>بياناتكِ محفوظة بتشفير قوي.</li>
                <li>لا نشاركها مع أي طرف خارجي إلا لمعالجة الدفع.</li>
                <li>الصور في معرضنا تُنشر بإذنكِ فقط.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">حقوقكِ</h2>
              <ul className="list-disc pr-5 space-y-1">
                <li>الاطلاع على بياناتكِ المحفوظة.</li>
                <li>طلب تعديل أو حذف بياناتكِ.</li>
                <li>إلغاء الاشتراك من الإشعارات في أي وقت.</li>
              </ul>
            </section>

            <section>
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">Cookies</h2>
              <p>نستخدم ملفات تعريف الارتباط لتحسين تجربتكِ (تذكّر تسجيل الدخول، تفضيلات اللغة). يمكنكِ إيقافها من إعدادات متصفحكِ.</p>
            </section>

            <section>
              <h2 className="font-ar-display text-xl font-bold text-gold-deep mb-2">التواصل بشأن الخصوصية</h2>
              <p>لأي استفسار يخصّ بياناتكِ، تواصلي معنا عبر الواتساب.</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
