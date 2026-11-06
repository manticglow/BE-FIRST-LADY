/**
 * Footer v3 — Footer فاخر مع newsletter وروابط منظّمة
 * ═══════════════════════════════════════════════════════════
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Instagram, MessageCircle, Phone, Mail, MapPin, Clock,
  Heart, Send, Sparkles, ArrowUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { waLink } from '@/lib/utils';

const QUICK_LINKS = [
  { href: '#story', label: 'قصّتنا' },
  { href: '#services', label: 'الخدمات' },
  { href: '#gallery', label: 'معرض الأعمال' },
  { href: '#reviews', label: 'آراء العميلات' },
  { href: '/gift-cards', label: 'بطاقات الهدية' },
  { href: '/booking', label: 'احجزي الآن' },
];

const LEGAL_LINKS = [
  { href: '/legal/privacy', label: 'سياسة الخصوصية' },
  { href: '/legal/refund', label: 'سياسة الاسترجاع' },
  { href: '/legal/terms', label: 'الشروط والأحكام' },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes('@')) {
      toast.error('بريد إلكتروني غير صحيح');
      return;
    }
    setSubscribing(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'footer' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || 'حدث خطأ · حاولي لاحقاً');
      } else {
        toast.success(data.message || '✨ شكراً · اشتركتِ بنشرتنا');
        setEmail('');
      }
    } catch {
      toast.error('تعذّر الاتصال · حاولي لاحقاً');
    } finally {
      setSubscribing(false);
    }
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      {/* ═══ فوتر الجوّال · مختصر وناعم ═══ */}
      <MobileFooter />

      {/* ═══ فوتر سطح المكتب · الكامل (مخفي على الجوّال) ═══ */}
      <footer className="hidden md:block bg-gradient-to-br from-ink via-gold-deep to-ink text-cream-50 relative overflow-hidden">

      {/* زخارف خلفيّة */}
      <div className="absolute top-10 left-10 opacity-5 pointer-events-none" aria-hidden="true">
        <Image src="/images/lotus-decoration.svg" alt="" width={300} height={300} />
      </div>
      <div className="absolute bottom-10 right-10 opacity-5 pointer-events-none" aria-hidden="true">
        <Image src="/images/lotus-decoration.svg" alt="" width={240} height={240} />
      </div>

      {/* ═══ شريط الاشتراك ═══ */}
      <div className="relative border-b border-cream-50/10">
        <div className="container-brand max-w-6xl py-10 md:py-14">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="editorial-eyebrow text-gold-light/80 mb-2">OUR NEWSLETTER</div>
              <h3 className="font-ar-display text-2xl md:text-3xl font-bold text-cream-50 mb-2">
                كوني أوّل من يعرف عروضنا
              </h3>
              <p className="text-sm text-cream-100/70 leading-relaxed">
                اشتركي في نشرتنا · عروض حصريّة · أخبار الصالون · نصائح جمال
              </p>
            </div>

            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="بريدكِ الإلكتروني"
                required
                dir="ltr"
                className="flex-1 bg-white/10 border border-white/20 text-cream-50 placeholder:text-cream-100/40 rounded-xl px-4 py-3 text-sm focus:bg-white/15 focus:border-gold-light/50 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="bg-gold-light text-ink font-bold px-5 py-3 rounded-xl hover:bg-cream-50 transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                اشتركي
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ═══ المحتوى الرئيسي ═══ */}
      <div className="container-brand max-w-6xl py-14 md:py-16 relative">
        <div className="grid md:grid-cols-12 gap-10">

          {/* ━━━ الشعار + القصّة ━━━ */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-5">
              <Image
                src="/images/logo-gold.svg"
                alt="Be First Lady"
                width={56} height={56}
                className="brightness-0 invert opacity-90"
              />
              <div>
                <div className="font-en-display italic text-cream-50 text-2xl leading-none">
                  Be First Lady
                </div>
                <div className="editorial-eyebrow text-gold-light/70 mt-1">SPA & SALON · MADINAH</div>
              </div>
            </div>

            <p className="text-sm text-cream-100/70 leading-relaxed mb-6 max-w-sm">
              مركز نسائي متكامل في قلب المدينة المنوّرة · نعتني بكِ لتُزهري.
              تجربة فاخرة تستحقينها.
            </p>

            {/* سوشال */}
            <div className="flex items-center gap-3">
              <SocialBtn href="https://instagram.com" icon={Instagram} label="إنستغرام" />
              <SocialBtn href={waLink()} icon={MessageCircle} label="واتساب" />
              <SocialBtn href="tel:+966504389329" icon={Phone} label="اتصال" />
              <SocialBtn href="mailto:info@befirstlady.com" icon={Mail} label="إيميل" />
            </div>
          </div>

          {/* ━━━ روابط سريعة ━━━ */}
          <div className="md:col-span-3">
            <h4 className="font-ar-display font-bold text-cream-50 mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-light" />
              روابط سريعة
            </h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-cream-100/70 hover:text-gold-light transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gold-light/50 group-hover:bg-gold-light transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ━━━ معلومات التواصل ━━━ */}
          <div className="md:col-span-4">
            <h4 className="font-ar-display font-bold text-cream-50 mb-4 flex items-center gap-2">
              <Heart className="w-4 h-4 text-gold-light" />
              تواصلي معنا
            </h4>
            <ul className="space-y-3.5 text-sm">
              <ContactRow icon={MapPin} value="المدينة المنوّرة · حي العوالي" />
              <ContactRow icon={Phone} value="0504389329" href="tel:+966504389329" />
              <ContactRow icon={MessageCircle} value="واتساب للحجز" href={waLink()} />
              <ContactRow icon={Clock} value="السبت - الخميس · 10ص - 11م" />
            </ul>
          </div>
        </div>

        {/* ═══ Divider ذهبي ═══ */}
        <div className="my-10 h-px bg-gradient-to-r from-transparent via-gold-light/30 to-transparent" />

        {/* ═══ Bottom bar ═══ */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-cream-100/60">
          <div>
            © 2026 Be First Lady · جميع الحقوق محفوظة · صُنع بـ 💛 في المدينة المنوّرة
          </div>
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-gold-light transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ زر العودة للأعلى ═══ */}
      <button
        onClick={scrollToTop}
        aria-label="للأعلى"
        className="hidden md:flex fixed bottom-10 left-10 w-11 h-11 rounded-full bg-gold-light text-ink shadow-lg shadow-gold-deep/30 items-center justify-center hover:scale-110 transition-transform z-30"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </footer>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════ */
/* MobileFooter · ناعم مختصر للجوّال فقط                       */
/* ═══════════════════════════════════════════════════════════ */

function MobileFooter() {
  return (
    <footer className="md:hidden bg-gradient-to-b from-cream-50 to-cream-100 border-t border-cream-200 pb-28 pt-6">
      <div className="px-5">
        {/* شعار + اسم */}
        <div className="flex items-center justify-center gap-2.5 mb-4">
          <Image src="/images/logo.svg" alt="" width={36} height={36} />
          <div className="text-right">
            <div className="font-en-display italic text-lg text-gold-deep leading-none">Be First Lady</div>
            <div className="text-[9px] font-en-label tracking-[0.3em] text-gold">SALON · MADINAH</div>
          </div>
        </div>

        {/* روابط سريعة · أفقي */}
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1.5 mb-4 text-[11px]">
          <Link href="/legal/privacy" className="text-ink-soft hover:text-gold-deep">الخصوصيّة</Link>
          <span className="text-gold-light">·</span>
          <Link href="/legal/terms" className="text-ink-soft hover:text-gold-deep">الشروط</Link>
          <span className="text-gold-light">·</span>
          <Link href="/legal/refund" className="text-ink-soft hover:text-gold-deep">الاسترجاع</Link>
          <span className="text-gold-light">·</span>
          <Link href="/gift-cards" className="text-ink-soft hover:text-gold-deep">بطاقات هديّة</Link>
        </div>

        {/* روابط التواصل · أيقونات */}
        <div className="flex justify-center gap-2.5 mb-4">
          <a
            href={waLink()}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="واتساب"
            className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center text-success-deep active:scale-95 transition-transform"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
          <a
            href="tel:+966500000000"
            aria-label="اتصال"
            className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center text-gold-deep active:scale-95 transition-transform"
          >
            <Phone className="w-4 h-4" />
          </a>
          <a
            href="https://instagram.com/befirstlady"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="إنستغرام"
            className="w-9 h-9 rounded-full bg-white shadow-card flex items-center justify-center text-gold-deep active:scale-95 transition-transform"
          >
            <Instagram className="w-4 h-4" />
          </a>
        </div>

        {/* copyright */}
        <div className="text-[10px] text-center text-ink-soft mt-2">
          © {new Date().getFullYear()} Be First Lady · المدينة المنوّرة
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════ */

function SocialBtn({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  const isExternal = href.startsWith('http') || href.startsWith('tel:') || href.startsWith('mailto:');
  const props = isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {};

  return (
    <a
      href={href}
      {...props}
      aria-label={label}
      className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-cream-50 hover:bg-gold-light hover:text-ink hover:border-gold-light transition-all"
    >
      <Icon className="w-4 h-4" />
    </a>
  );
}

function ContactRow({ icon: Icon, value, href }: { icon: any; value: string; href?: string }) {
  const content = (
    <>
      <Icon className="w-4 h-4 text-gold-light shrink-0" />
      <span className="text-cream-100/80">{value}</span>
    </>
  );

  if (href) {
    const isExternal = href.startsWith('http') || href.startsWith('tel:') || href.startsWith('mailto:');
    const props = isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {};
    return (
      <li>
        <a href={href} {...props} className="flex items-center gap-2.5 hover:text-gold-light transition-colors">
          {content}
        </a>
      </li>
    );
  }
  return <li className="flex items-center gap-2.5">{content}</li>;
}
