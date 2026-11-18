/**
 * صفحة الشكاوى · متوافقة مع نظام التجارة الإلكترونيّة
 * ═══════════════════════════════════════════════════════════
 * - آلية شكوى بالعربيّة
 * - مدّة الرد مُعلنة (24 ساعة)
 * - مدّة المعالجة مُعلنة (5 أيّام عمل)
 * - إمكانية التصعيد للـ MC.gov.sa
 */
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ComplaintForm from '@/components/legal/ComplaintForm';
import { MessageSquareWarning, Clock, Shield } from 'lucide-react';

export const metadata = {
  title: 'الشكاوى والاقتراحات',
  description: 'آلية تقديم شكوى لصالون السيّدة الأولى · الرد خلال 24 ساعة · المعالجة خلال 5 أيّام عمل',
};

export default function ComplaintsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50 pt-20 md:pt-24 pb-20">
        <div className="max-w-3xl mx-auto px-4 py-10">

          <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-deep uppercase mb-2">
            Complaints
          </div>
          <h1 className="font-ar-display text-3xl font-bold text-gold-deep mb-2">
            الشكاوى والاقتراحات
          </h1>
          <div className="w-10 h-[1px] bg-gold-deep/40 mb-3" />
          <p className="text-ink-soft text-sm mb-8">
            رأيكِ يهمّنا · نلتزم بالرد والمعالجة بحسب نظام التجارة الإلكترونيّة
          </p>

          {/* المدد المُعلنة */}
          <div className="grid md:grid-cols-3 gap-3 mb-8">
            <InfoCard icon={Clock} title="الرد" value="خلال 24 ساعة" />
            <InfoCard icon={MessageSquareWarning} title="المعالجة" value="خلال 5 أيّام عمل" />
            <InfoCard icon={Shield} title="التصعيد" value="MC.gov.sa" />
          </div>

          {/* النموذج */}
          <div className="bg-white p-6 md:p-8 border border-cream-200" style={{ borderRadius: '20px' }}>
            <ComplaintForm />
          </div>

          {/* طرق أخرى */}
          <div className="mt-8 bg-white p-6 border border-cream-200" style={{ borderRadius: '20px' }}>
            <h2 className="font-ar-display text-lg font-bold text-gold-deep mb-3">
              طرق تواصل أخرى
            </h2>
            <ul className="space-y-2 text-sm text-ink">
              <li>📧 <strong>البريد:</strong> thefirestladysalon@hotmail.com</li>
              <li>📞 <strong>الجوّال:</strong> 0504134147</li>
              <li>💬 <strong>واتساب:</strong> 0504134147</li>
              <li>🏢 <strong>الحضور:</strong> شارع يزيد بن الحكم الثقفي · حي الراية · المدينة المنوّرة</li>
            </ul>
          </div>

          {/* التصعيد */}
          <div className="mt-6 bg-cream-100/50 p-5 border border-cream-200" style={{ borderRadius: '20px' }}>
            <h3 className="font-bold text-sm text-ink mb-2">إن لم تتمّ معالجة شكوتكِ · بإمكانكِ التصعيد إلى:</h3>
            <ul className="space-y-1 text-xs text-ink-soft">
              <li>🏛 <strong>وزارة التجارة:</strong> <a href="https://mc.gov.sa" target="_blank" rel="noopener" className="text-gold-deep underline">mc.gov.sa</a> · 1900</li>
              <li>🛡 <strong>جمعية حماية المستهلك:</strong> <a href="https://cpa.org.sa" target="_blank" rel="noopener" className="text-gold-deep underline">cpa.org.sa</a></li>
              <li>🔒 <strong>سدايا (لشكاوى الخصوصيّة):</strong> <a href="https://sdaia.gov.sa" target="_blank" rel="noopener" className="text-gold-deep underline">sdaia.gov.sa</a></li>
            </ul>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}

function InfoCard({ icon: Icon, title, value }: { icon: any; title: string; value: string }) {
  return (
    <div className="bg-white p-4 border border-cream-200 flex items-center gap-3" style={{ borderRadius: '20px' }}>
      <div className="w-10 h-10 bg-cream-50 flex items-center justify-center shrink-0" style={{ borderRadius: '2px' }}>
        <Icon className="w-4 h-4 text-gold-deep" />
      </div>
      <div>
        <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">{title}</div>
        <div className="font-bold text-sm text-ink mt-0.5">{value}</div>
      </div>
    </div>
  );
}
