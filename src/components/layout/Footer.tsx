import Link from 'next/link';
import { Instagram, MessageCircle, Phone, MapPin } from 'lucide-react';
import { waLink } from '@/lib/utils';

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-cream-100 to-cream-200 border-t border-gold-light/20">
      <div className="container-brand py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {/* البراند */}
          <div className="text-center md:text-right">
            <div className="font-en-display italic text-3xl text-gold-deep">Be First Lady</div>
            <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mt-1">SPA & SALON</div>
            <p className="font-ar-display text-xl text-gold-deep mt-4">نعتني بكِ لتُزهري</p>
            <p className="text-sm text-ink-soft mt-2">صالون نسائي فاخر · المدينة المنوّرة</p>
          </div>

          {/* روابط سريعة */}
          <div className="text-center md:text-right">
            <h4 className="font-ar-display text-lg text-gold-deep mb-4">روابط سريعة</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="#services" className="text-ink-soft hover:text-gold">الخدمات</Link></li>
              <li><Link href="#gallery" className="text-ink-soft hover:text-gold">المعرض</Link></li>
              <li><Link href="#offer" className="text-ink-soft hover:text-gold">العروض</Link></li>
              <li><Link href="/account" className="text-ink-soft hover:text-gold">حسابي</Link></li>
              <li><Link href="/gift-cards" className="text-ink-soft hover:text-gold">🎁 بطاقات هدية</Link></li>
            </ul>

            <h4 className="font-ar-display text-sm text-gold-deep mt-6 mb-2">قانوني</h4>
            <ul className="space-y-1 text-xs">
              <li><Link href="/legal/terms" className="text-ink-soft hover:text-gold">الشروط والأحكام</Link></li>
              <li><Link href="/legal/privacy" className="text-ink-soft hover:text-gold">سياسة الخصوصية</Link></li>
              <li><Link href="/legal/refund" className="text-ink-soft hover:text-gold">الإلغاء والاسترداد</Link></li>
            </ul>
          </div>

          {/* التواصل */}
          <div className="text-center md:text-right">
            <h4 className="font-ar-display text-lg text-gold-deep mb-4">تواصلي معنا</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={waLink()} target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-ink hover:text-whatsapp">
                  <MessageCircle className="w-4 h-4" />
                  <span>0504389329</span>
                </a>
              </li>
              <li className="inline-flex items-center gap-2 text-ink-soft">
                <MapPin className="w-4 h-4 text-gold" />
                <span>المدينة المنوّرة</span>
              </li>
              <li>
                <a href="https://instagram.com/befirstlady" target="_blank" rel="noopener" className="inline-flex items-center gap-2 text-ink-soft hover:text-gold">
                  <Instagram className="w-4 h-4" />
                  <span>@befirstlady</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gold-light/20 text-center">
          <p className="text-xs text-ink-soft">
            © {new Date().getFullYear()} Be First Lady. جميع الحقوق محفوظة ·{' '}
            <span className="font-en-label tracking-wider">Shaheen Design</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
