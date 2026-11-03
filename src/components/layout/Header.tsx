/**
 * Header — شريط التنقّل العلوي الفاخر
 * ═══════════════════════════════════════════════════════════
 * - شريط علوي رفيع فيه معلومات التواصل (ديسكتوب فقط)
 * - شريط رئيسي: الشعار · روابط · أزرار CTAs
 * - مؤشّر Active للروابط
 * - قائمة جانبيّة فاخرة للجوال مع تواصل
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Menu, X, MessageCircle, Phone, MapPin, Clock,
  User, Calendar, Sparkles, ChevronLeft, Instagram, Mail,
} from 'lucide-react';
import { waLink } from '@/lib/utils';

const NAV_LINKS = [
  { href: '#services',  label: 'الخدمات',   icon: Sparkles },
  { href: '/packages',  label: 'البكجات',   icon: Sparkles, badge: '✨' },
  { href: '/gift-cards', label: 'بطاقات هدية', icon: Sparkles, badge: '🎁' },
  { href: '#gallery',   label: 'المعرض',    icon: Sparkles },
  { href: '#reviews',   label: 'آراء العميلات', icon: Sparkles },
  { href: '#contact',   label: 'تواصل',     icon: Sparkles },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // أغلقي القائمة عند تغيير الصفحة
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // تتبّع scroll لتصغير الهيدر
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // منع scroll عند فتح القائمة
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      {/* ═══ Top info bar (ديسكتوب فقط) ═══ */}
      <div className="hidden lg:block bg-gradient-to-l from-gold-deep via-ink to-gold-deep text-cream-50">
        <div className="container-brand flex items-center justify-between py-1.5 text-[11px]">
          <div className="flex items-center gap-5 text-cream-100/80">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              المدينة المنوّرة · حي العوالي
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              يومياً · 10 ص - 11 م
            </span>
          </div>
          <div className="flex items-center gap-4 text-cream-100/80">
            <a href="tel:+966504389329" className="flex items-center gap-1.5 hover:text-gold-light transition-colors">
              <Phone className="w-3 h-3" />
              <span className="font-en-display" dir="ltr">+966 50 438 9329</span>
            </a>
            <span className="w-px h-3 bg-cream-50/20" />
            <a href="https://instagram.com" target="_blank" rel="noopener" className="hover:text-gold-light transition-colors">
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a href="mailto:info@befirstlady.com" className="hover:text-gold-light transition-colors">
              <Mail className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* ═══ Main header ═══ */}
      <header
        className={`sticky top-0 z-50 bg-cream-50/95 backdrop-blur-lg border-b transition-all duration-300 ${
          scrolled
            ? 'border-gold-light/25 shadow-md shadow-gold-deep/5'
            : 'border-gold-light/10'
        }`}
      >
        <div className="container-brand flex items-center justify-between gap-4 py-3 md:py-4">

          {/* ─── الشعار ─── */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative">
              <Image
                src="/images/logo.svg"
                alt="Be First Lady"
                width={44}
                height={44}
                priority
                className="transition-transform group-hover:scale-105"
              />
              {/* دائرة ذهبيّة حول اللوجو */}
              <div className="absolute inset-0 rounded-full bg-gold-light/0 group-hover:bg-gold-light/10 transition-colors" />
            </div>
            <div className="hidden sm:block">
              <div className="font-en-display italic text-gold-deep text-xl leading-none">
                Be First Lady
              </div>
              <div className="font-en-label text-[9px] tracking-[0.3em] text-gold-light mt-1">
                SPA & SALON · MADINAH
              </div>
            </div>
          </Link>

          {/* ─── روابط الديسكتوب ─── */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || (link.href.startsWith('#') && pathname === '/');
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative text-sm font-semibold px-3 py-2 rounded-xl transition-all ${
                    isActive
                      ? 'text-gold-deep'
                      : 'text-ink-soft hover:text-gold-deep hover:bg-cream-100/60'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {link.badge && <span>{link.badge}</span>}
                    {link.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* ─── CTAs يسار ─── */}
          <div className="flex items-center gap-2 shrink-0">

            {/* زر حسابي · ديسكتوب فقط */}
            <Link
              href="/account"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-gold-deep border border-gold-light/30 hover:border-gold-light hover:bg-gold-light/10 transition-all"
            >
              <User className="w-4 h-4" />
              <span>حسابي</span>
            </Link>

            {/* زر الحجز · البارز */}
            <Link
              href="/booking"
              className="btn-shimmer inline-flex items-center gap-1.5 bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50 font-bold text-sm px-4 md:px-5 py-2.5 rounded-xl shadow-md shadow-gold-deep/20 hover:scale-[1.03] hover:shadow-lg transition-all"
            >
              <Calendar className="w-4 h-4 relative z-10" />
              <span className="relative z-10">احجزي</span>
            </Link>

            {/* زر القائمة · جوال */}
            <button
              onClick={() => setMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-cream-100 text-gold-deep transition-colors"
              aria-label="فتح القائمة"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══ القائمة الجانبيّة (الجوال) ═══ */}
      <div
        className={`fixed inset-0 z-[100] lg:hidden transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        {/* Overlay */}
        <div
          onClick={() => setMenuOpen(false)}
          className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
        />

        {/* Panel */}
        <aside
          className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-gradient-to-br from-cream-50 via-white to-cream-100 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* ─── Header القائمة ─── */}
          <div className="relative bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50 p-5 overflow-hidden shrink-0">
            <div className="absolute top-0 left-0 w-24 h-24 bg-gold-light/15 rounded-full blur-2xl pointer-events-none" />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src="/images/logo.svg"
                  alt=""
                  width={40}
                  height={40}
                  className="brightness-0 invert opacity-95"
                />
                <div>
                  <div className="font-en-display italic text-cream-50 text-lg leading-none">
                    Be First Lady
                  </div>
                  <div className="font-en-label text-[8px] tracking-[0.3em] text-gold-light mt-1">
                    SPA & SALON
                  </div>
                </div>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-colors"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ─── CTAs سريعة ─── */}
          <div className="grid grid-cols-2 gap-2 p-4 border-b border-cream-200 shrink-0">
            <Link
              href="/booking"
              onClick={() => setMenuOpen(false)}
              className="flex flex-col items-center justify-center gap-1 py-3 bg-gradient-to-br from-gold-deep to-ink text-cream-50 rounded-xl font-bold text-sm"
            >
              <Calendar className="w-4 h-4" />
              احجزي الآن
            </Link>
            <a
              href={waLink()}
              target="_blank"
              rel="noopener"
              className="flex flex-col items-center justify-center gap-1 py-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              واتساب
            </a>
          </div>

          {/* ─── الروابط ─── */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mb-3 px-2">
              EXPLORE
            </div>
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="group flex items-center justify-between px-4 py-3 rounded-xl text-ink font-semibold hover:bg-cream-100 hover:text-gold-deep transition-all"
                  >
                    <span className="flex items-center gap-2">
                      {link.badge && <span>{link.badge}</span>}
                      {link.label}
                    </span>
                    <ChevronLeft className="w-4 h-4 text-gold-light opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mb-3 mt-6 px-2">
              MY ACCOUNT
            </div>
            <Link
              href="/account"
              onClick={() => setMenuOpen(false)}
              className="group flex items-center justify-between px-4 py-3 rounded-xl bg-gold-light/10 text-gold-deep font-bold hover:bg-gold-light/20 transition-colors"
            >
              <span className="flex items-center gap-2">
                <User className="w-4 h-4" />
                حسابي
              </span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </nav>

          {/* ─── Footer التواصل ─── */}
          <div className="p-4 border-t border-cream-200 bg-cream-50/50 shrink-0 space-y-2">
            <a
              href="tel:+966504389329"
              className="flex items-center gap-2 text-xs text-ink-soft hover:text-gold-deep transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-gold-light" />
              <span className="font-en-display" dir="ltr">+966 50 438 9329</span>
            </a>
            <div className="flex items-center gap-2 text-xs text-ink-soft">
              <MapPin className="w-3.5 h-3.5 text-gold-light" />
              المدينة المنوّرة · حي العوالي
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-soft">
              <Clock className="w-3.5 h-3.5 text-gold-light" />
              يومياً · 10 ص - 11 م
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a href="https://instagram.com" target="_blank" rel="noopener" className="w-9 h-9 rounded-full bg-white border border-cream-200 flex items-center justify-center text-gold-deep hover:bg-gold-light hover:text-white transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="mailto:info@befirstlady.com" className="w-9 h-9 rounded-full bg-white border border-cream-200 flex items-center justify-center text-gold-deep hover:bg-gold-light hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
              </a>
              <a href={waLink()} target="_blank" rel="noopener" className="w-9 h-9 rounded-full bg-white border border-cream-200 flex items-center justify-center text-gold-deep hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-colors">
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
