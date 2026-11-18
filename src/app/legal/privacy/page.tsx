/**
 * سياسة الخصوصيّة · متوافقة مع PDPL السعودي
 * ═══════════════════════════════════════════════════════════
 * تحقّق من المواد المرجعيّة:
 * - المادة 13 (إشعار الخصوصيّة)
 * - المادة 6 (الموافقة)
 * - المادة 17 (حقّ المحو)
 * - المادة 24 (الإبلاغ خلال 72 ساعة)
 * - المادة 29 (النقل خارج المملكة)
 */
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata = {
  title: 'سياسة الخصوصيّة',
  description: 'سياسة خصوصيّة صالون السيّدة الأولى · متوافقة مع نظام حماية البيانات الشخصيّة السعودي PDPL',
};

const LAST_UPDATED = '2026-11-18';

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-deep uppercase mb-2">
            Privacy Policy
          </div>
          <h1 className="font-ar-display text-3xl font-bold text-gold-deep mb-2">
            سياسة الخصوصيّة
          </h1>
          <div className="w-10 h-[1px] bg-gold-deep/40 mb-3" />
          <p className="text-xs text-ink-soft mb-8">
            آخر تحديث: {LAST_UPDATED} · متوافقة مع نظام حماية البيانات الشخصيّة السعودي (PDPL)
          </p>

          <article className="space-y-6 text-ink leading-loose text-sm bg-white p-8 border border-cream-200" style={{ borderRadius: '20px' }}>

            <Section title="١. من نحن (المتحكّم في البيانات)">
              <ul className="list-disc pr-5 space-y-1">
                <li><strong>الاسم القانوني:</strong> مشغل السيدة الأولى · alSayyida alOula Salon</li>
                <li><strong>السجل التجاري:</strong> 7013767020</li>
                <li><strong>العنوان:</strong> شارع يزيد بن الحكم الثقفي · حي الراية · المدينة المنوّرة · 42312</li>
                <li><strong>البريد الإلكتروني:</strong> thefirestladysalon@hotmail.com</li>
                <li><strong>الجوال:</strong> 0504134147</li>
              </ul>
            </Section>

            <Section title="٢. البيانات التي نجمعها">
              <ul className="list-disc pr-5 space-y-1.5">
                <li><strong>بيانات التعريف:</strong> الاسم الكامل · رقم الجوال · البريد الإلكتروني.</li>
                <li><strong>بيانات الحجز:</strong> الخدمات · التواريخ · الموظّفة المُختارة · الملاحظات.</li>
                <li><strong>بيانات الدفع:</strong> آخر 4 أرقام من البطاقة · نوعها · لا نحفظ الرقم الكامل (يُعالج عبر Moyasar المرخّصة من ساما).</li>
                <li><strong>بيانات الاستخدام:</strong> نوع المتصفح · نوع الجهاز · عنوان IP · وقت الزيارة.</li>
                <li><strong>بيانات طبيّة اختياريّة:</strong> الحساسيّة لمنتجات محدّدة (باختياركِ · لاستخدام آمن).</li>
              </ul>
            </Section>

            <Section title="٣. الأساس النظامي للجمع (المادة 6 من PDPL)">
              <p>نعالج بياناتكِ على أحد الأسس التالية:</p>
              <ul className="list-disc pr-5 space-y-1">
                <li><strong>موافقتكِ الصريحة</strong> · عند التسجيل والحجز والاشتراك في الحملات التسويقيّة.</li>
                <li><strong>تنفيذ عقد الخدمة</strong> · لإتمام حجزكِ والتواصل معكِ.</li>
                <li><strong>الالتزام النظامي</strong> · فواتير ZATCA · السجلّات الضريبيّة (10 سنوات).</li>
              </ul>
            </Section>

            <Section title="٤. أغراض الاستخدام">
              <ul className="list-disc pr-5 space-y-1">
                <li>إدارة حجوزاتكِ وإرسال تأكيدات وتذكيرات.</li>
                <li>معالجة الدفع عبر بوّابات مرخّصة من ساما.</li>
                <li>إصدار الفواتير الضريبيّة بحسب نظام ZATCA.</li>
                <li>تحسين خدماتنا بناءً على تقييماتكِ.</li>
                <li>إرسال عروض ترويجيّة <strong>فقط إذا وافقتِ صراحة</strong>.</li>
              </ul>
            </Section>

            <Section title="٥. حقوقكِ (المواد 4, 13, 17 من PDPL)">
              <ul className="list-disc pr-5 space-y-1">
                <li><strong>حقّ الاطلاع:</strong> طلب نسخة من بياناتكِ · نرسلها خلال 15 يوم.</li>
                <li><strong>حقّ التصحيح:</strong> تعديل أي بيان غير دقيق من <code className="font-en-display">/account/profile</code>.</li>
                <li><strong>حقّ المحو:</strong> حذف حسابكِ وبياناتكِ كاملة من <code className="font-en-display">/account/security</code> (Delete Account).</li>
                <li><strong>حقّ سحب الموافقة:</strong> إيقاف الحملات التسويقيّة من حسابكِ · فوراً.</li>
                <li><strong>حقّ الشكوى:</strong> إلى سدايا عبر <a href="https://sdaia.gov.sa" target="_blank" rel="noopener" className="text-gold-deep underline">sdaia.gov.sa</a>.</li>
              </ul>
            </Section>

            <Section title="٦. من يُطّلع على بياناتكِ">
              <ul className="list-disc pr-5 space-y-1">
                <li><strong>موظّفات الصالون:</strong> حسب دورهنّ فقط (owner/manager/staff).</li>
                <li><strong>معالِجي البيانات:</strong> Supabase (تخزين آمن) · Moyasar (دفع) · UltraMsg (واتساب) · Vercel (استضافة).</li>
                <li><strong>السلطات:</strong> ZATCA · ساما · سدايا · عند الطلب النظامي الصحيح فقط.</li>
              </ul>
              <p className="mt-2 text-xs text-ink-soft">لا نبيع بياناتكِ ولا نشاركها لأغراض تسويقيّة خارجيّة.</p>
            </Section>

            <Section title="٧. النقل خارج المملكة (المادة 29 من PDPL)">
              <p>
                بعض خدماتنا السحابيّة (Supabase · Vercel) قد تخزّن البيانات في مراكز خارج المملكة
                (منطقة أوروبا أو آسيا) ضمن اتّفاقيّات معالجة بيانات (DPA) تضمن المستوى المطلوب من الحماية.
              </p>
              <p>
                نعمل حالياً على ترحيل بياناتكِ إلى منطقة <strong>me-south-1 (البحرين)</strong> لتخزين أقرب وأسرع.
              </p>
            </Section>

            <Section title="٨. مدّة الاحتفاظ">
              <ul className="list-disc pr-5 space-y-1">
                <li>بيانات الحجز: 10 سنوات (مطلب ZATCA للسجلّات المحاسبيّة).</li>
                <li>سجلّات الدخول: 90 يوماً.</li>
                <li>رموز OTP: ساعة واحدة · تُحذف تلقائياً.</li>
                <li>سجلّ العمليّات (audit log): سنتان.</li>
              </ul>
              <p className="mt-2 text-xs text-ink-soft">بعد انتهاء المدّة · نحذف أو نُجهّل البيانات تلقائياً.</p>
            </Section>

            <Section title="٩. حماية بياناتكِ">
              <ul className="list-disc pr-5 space-y-1">
                <li>تشفير كامل عبر HTTPS + TLS 1.3</li>
                <li>Row-Level Security (RLS) على كل جدول حسّاس.</li>
                <li>كلمات المرور مُشفّرة بـ bcrypt.</li>
                <li>التحقّق من الدخول بـOTP واتساب أو Face ID.</li>
                <li>رصد لحظي لأي محاولة اختراق.</li>
                <li>نسخ احتياطيّة يوميّة.</li>
              </ul>
            </Section>

            <Section title="١٠. الإبلاغ عن تسرّب البيانات (المادة 24)">
              <p>
                في حال حدوث أي وصول غير مشروع أو تسرّب يؤثّر على بياناتكِ · نلتزم بـ:
              </p>
              <ul className="list-disc pr-5 space-y-1 mt-2">
                <li>إبلاغ <strong>سدايا</strong> خلال <strong>72 ساعة</strong> من اكتشاف الحادث.</li>
                <li>إشعاركِ مباشرةً إذا كان الحادث يمسّكِ شخصياً.</li>
                <li>شرح نوع البيانات المُتأثّرة · والإجراءات المتّخذة · وسبل حمايتكِ.</li>
              </ul>
            </Section>

            <Section title="١١. ملفّات تعريف الارتباط (Cookies)">
              <p>نستخدم 3 أنواع:</p>
              <ul className="list-disc pr-5 space-y-1">
                <li><strong>ضروريّة</strong> (دائماً مفعّلة): جلسة الدخول · السلّة · الأمان.</li>
                <li><strong>تحليل الأداء</strong> (باختياركِ): إحصاءات مجهّلة لتحسين الموقع.</li>
                <li><strong>التسويق</strong> (باختياركِ): Facebook/Google Ads · لعرض محتوى مناسب.</li>
              </ul>
              <p className="mt-2 text-xs text-ink-soft">
                تقدرين مراجعة اختياراتكِ في أي وقت من شريط الكوكيز في أسفل الشاشة.
              </p>
            </Section>

            <Section title="١٢. حماية القاصرات">
              <p>
                خدماتنا للسيّدات من <strong>سنّ 18 عاماً فأكثر</strong>. لا نجمع بيانات أي قاصر عن قصد.
                إذا اكتشفنا حساباً لقاصرة · نحذفه فوراً. القاصرة تحتاج موافقة وليّ الأمر وحضوره للحجز.
              </p>
            </Section>

            <Section title="١٣. التواصل معنا">
              <p>لأي استفسار · ممارسة حق · شكوى:</p>
              <ul className="list-disc pr-5 space-y-1">
                <li>📧 <strong>البريد:</strong> thefirestladysalon@hotmail.com</li>
                <li>📞 <strong>الجوال:</strong> 0504134147</li>
                <li>🏢 <strong>الحضور:</strong> شارع يزيد بن الحكم الثقفي · حي الراية · المدينة المنوّرة</li>
                <li>🏛 <strong>الشكوى لـسدايا:</strong> <a href="https://sdaia.gov.sa" target="_blank" rel="noopener" className="text-gold-deep underline">sdaia.gov.sa</a></li>
              </ul>
            </Section>

            <Section title="١٤. التعديلات على هذه السياسة">
              <p>
                قد نحدّث هذه السياسة من وقت لآخر. أي تغيير جوهري سنبلغكِ به عبر واتساب أو البريد الإلكتروني،
                مع تحديث تاريخ آخر مراجعة في أعلى الصفحة.
              </p>
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
