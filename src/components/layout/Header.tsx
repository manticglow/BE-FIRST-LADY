/**
 * Header v4 — شريط التنقّل العلوي الفاخر
 * ═══════════════════════════════════════════════════════════
 * - Top bar رفيع فيه مفتوح/مغلق + تواصل سريع
 * - شعار بـhalo ذهبي
 * - روابط بـunderline يرسم من المنتصف + نقطة ذهبيّة للنشط
 * - CTAs بـshimmer + hover micro-interactions
 * - Scroll state: top bar يختفي · header يصغر
 * - Mobile drawer فاخر مع أيقونات لكل رابط + petals
 */
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Menu, X, MessageCircle, Phone, MapPin, Clock,
  User, Calendar, ChevronLeft, Instagram, Mail,
  Sparkles, Gift, Image as ImageIcon, Star, Package as PkgIcon,
  Scissors, Heart,
} from 'lucide-react';
import { waLink } from '@/lib/utils';
import Petals from '@/components/ui/Petals';

const NAV_LINKS = [
  { href: '#services',   label: 'الخدمات',       icon: Scissors },
  { href: '/packages',   label: 'البكجات',       icon: PkgIcon,     badge: 'جديد' },
  { href: '/gift-cards', label: 'بطاقات هدية',   icon: Gift,         accent: true },
  { href: '#gallery',    label: 'المعرض',        icon: ImageIcon },
  { href: '#reviews',    label: 'آراء العميلات', icon: Star },
  { href: '#contact',    label: 'تواصل',         icon: MessageCircle },
];

// حدّدي ما إذا كان الصالون مفتوحاً الآن (10 ص - 11 م توقيت الرياض)
function isOpenNow(): boolean {
  const now = new Date();
  // في الـclient time zone للزائرة · افتراضي أنها بالسعوديّة
  const h = now.getHours();
  return h >= 10 && h < 23;
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  // أغلقي القائمة عند تغيير الصفحة
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // حدّدي حالة الفتح (مرّة واحدة)
  useEffect(() => { setOpen(isOpenNow()); }, []);

  // تتبّع scroll
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
      {/* ═══════════════════════════════════════════════════════
       * Top info bar · ديسكتوب فقط · يختفي عند السكرول
       * ═══════════════════════════════════════════════════════ */}
      <div
        className={`hidden lg:block relative bg-gradient-to-l from-ink via-[#1a1510] to-ink text-cream-50 overflow-hidden transition-all duration-500 ease-in-out ${
          scrolled ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'
        }`}
      >
        {/* فاصل ذهبي سفلي */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-light/50 to-transparent" />

        {/* light reflection */}
        <div className="absolute top-0 left-1/4 w-96 h-10 bg-gold-light/10 blur-2xl pointer-events-none" />

        <div className="container-brand relative flex items-center justify-between py-2 text-[11px]">
          {/* يمين · حالة + مكان */}
          <div className="flex items-center gap-5 text-cream-100/80">
            {/* مفتوح الآن · نبض أخضر */}
            <span className="flex items-center gap-1.5">
              <span className="relative flex w-2 h-2">
                <span className={`absolute inset-0 rounded-full ${open ? 'bg-emerald-400' : 'bg-rose-500'} ${open ? 'animate-ping opacity-75' : ''}`} />
                <span className={`relative rounded-full w-2 h-2 ${open ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              </span>
              <span className="font-bold">
                {open ? 'مفتوح الآن' : 'مغلق حالياً'}
              </span>
              <span className="opacity-60">·</span>
              <span>يومياً 10 ص - 11 م</span>
            </span>

            {/* الموقع */}
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-gold-light" />
              المدينة المنوّرة · حي العوالي
            </span>
          </div>

          {/* يسار · تواصل */}
          <div className="flex items-center gap-4 text-cream-100/80">
            <a
              href="tel:+966504389329"
              className="group flex items-center gap-1.5 hover:text-gold-light transition-colors"
            >
              <Phone className="w-3 h-3 text-gold-light group-hover:scale-110 transition-transform" />
              <span className="font-en-display" dir="ltr">+966 50 438 9329</span>
            </a>
            <span className="w-px h-3 bg-gold-light/20" />
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener"
              aria-label="Instagram"
              className="hover:text-gold-light hover:scale-110 transition-all"
            >
              <Instagram className="w-3.5 h-3.5" />
            </a>
            <a
              href="mailto:info@befirstlady.com"
              aria-label="Email"
              className="hover:text-gold-light hover:scale-110 transition-all"
            >
              <Mail className="w-3.5 h-3.5" />
            </a>
            <a
              href={waLink()}
              target="_blank"
              rel="noopener"
              aria-label="WhatsApp"
              className="hover:text-emerald-400 hover:scale-110 transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
       * Main header · sticky · scroll-aware
       * ═══════════════════════════════════════════════════════ */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-cream-50/85 backdrop-blur-xl border-b border-gold-light/30 shadow-[0_4px_30px_-10px_rgba(201,169,110,0.25)]'
            : 'bg-cream-50/70 backdrop-blur-md border-b border-gold-light/10'
        }`}
      >
        {/* فاصل ذهبي رفيع فوق */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-gold-light/40 to-transparent" />

        <div
          className={`container-brand flex items-center justify-between gap-4 transition-all duration-300 ${
            scrolled ? 'py-2.5 md:py-3' : 'py-3.5 md:py-5'
          }`}
        >

          {/* ═══ الشعار ═══ */}
          <Link href="/" className="flex items-center gap-3 group shrink-0 relative">
            <div className="relative">
              {/* Halo متدرّج ذهبي خلف اللوقو */}
              <div className="absolute inset-0 -m-1 rounded-full bg-gradient-to-br from-gold-light/0 via-gold-light/0 to-gold-light/0 group-hover:from-gold-light/20 group-hover:to-amber-300/20 blur-md transition-all duration-500" />
              {/* إطار دائري ذهبي رفيع */}
              <div className="absolute inset-0 -m-1 rounded-full border border-gold-light/0 group-hover:border-gold-light/30 transition-all duration-300" />
              <Image
                src="/images/logo.svg"
                alt="Be First Lady"
                width={44}
                height={44}
                priority
                className={`relative transition-all duration-500 ${
                  scrolled ? 'scale-90' : 'scale-100'
                } group-hover:rotate-6`}
              />
            </div>
            <div className="hidden sm:block">
              <div className="font-en-display italic text-gold-deep text-xl leading-none tracking-wide">
                Be First Lady
              </div>
              <div className="font-en-label text-[9px] tracking-[0.35em] text-gold-light mt-1.5">
                SPA & SALON · MADINAH
              </div>
            </div>
          </Link>

          {/* ═══ روابط الديسكتوب ═══ */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href
                || (link.href.startsWith('#') && pathname === '/')
                || (link.href.startsWith('/') && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative group text-sm font-semibold px-3.5 py-2.5 rounded-xl transition-all ${
                    isActive ? 'text-gold-deep' : 'text-ink-soft hover:text-gold-deep'
                  }`}
                >
                  <span className="flex items-center gap-1.5 relative">
                    {link.label}
                    {link.badge && (
                      <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 text-white animate-pulse">
                        {link.badge}
                      </span>
                    )}
                    {link.accent && (
                      <span className="text-[11px]">🎁</span>
                    )}
                  </span>

                  {/* Underline ذهبي يرسم من المنتصف */}
                  <span className={`absolute bottom-1 left-1/2 h-0.5 bg-gradient-to-r from-gold-deep via-gold-light to-gold-deep rounded-full transition-all duration-300 -translate-x-1/2 ${
                    isActive ? 'w-6' : 'w-0 group-hover:w-6'
                  }`} />

                  {/* نقطة ذهبيّة للنشط */}
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gold-deep shadow-[0_0_8px_rgba(201,169,110,0.8)]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ═══ CTAs ═══ */}
          <div className="flex items-center gap-2 shrink-0">

            {/* زر حسابي · ديسكتوب فقط */}
            <Link
              href="/account"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold text-gold-deep border border-gold-light/30 hover:border-gold-light hover:bg-gradient-to-br hover:from-gold-light/15 hover:to-amber-100/50 transition-all group"
            >
              <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>حسابي</span>
            </Link>

            {/* زر الحجز · البارز بـshimmer */}
            <Link
              href="/booking"
              className="btn-shimmer group relative inline-flex items-center gap-1.5 bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50 font-bold text-sm px-5 md:px-6 py-2.5 rounded-xl shadow-[0_8px_24px_-6px_rgba(201,169,110,0.5)] hover:shadow-[0_12px_32px_-6px_rgba(201,169,110,0.7)] hover:scale-[1.03] active:scale-95 transition-all overflow-hidden"
            >
              {/* نقشة ذهبيّة خفيفة في الخلفيّة */}
              <span className="absolute top-0 right-0 w-16 h-16 bg-gold-light/20 rounded-full blur-xl opacity-50" />
              <Calendar className="w-4 h-4 relative z-10 group-hover:rotate-12 transition-transform" />
              <span className="relative z-10 tracking-wide">احجزي</span>
            </Link>

            {/* زر القائمة · جوال */}
            <button
              onClick={() => setMenuOpen(true)}
              className="lg:hidden relative w-11 h-11 rounded-xl border border-gold-light/25 bg-gradient-to-br from-cream-50 to-cream-100 text-gold-deep flex items-center justify-center hover:border-gold-light hover:shadow-md hover:scale-105 active:scale-95 transition-all"
              aria-label="فتح القائمة"
            >
              <Menu className="w-5 h-5" />
              {/* نقطة إشعار (إذا احتجنا لاحقاً) */}
              {/* <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-cream-50" /> */}
            </button>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
       * القائمة الجانبيّة (الجوال)
       * ═══════════════════════════════════════════════════════ */}
      <div
        className={`fixed inset-0 z-[100] lg:hidden transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        {/* Overlay */}
        <div
          onClick={() => setMenuOpen(false)}
          className="absolute inset-0 bg-ink/70 backdrop-blur-md"
        />

        {/* Panel */}
        <aside
          className={`absolute top-0 right-0 h-full w-80 max-w-[88vw] bg-gradient-to-br from-cream-50 via-white to-cream-100 shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* ─── Header القائمة · فاخر مع petals ─── */}
          <div className="relative bg-gradient-to-br from-gold-deep via-ink to-[#2a1c10] text-cream-50 p-5 overflow-hidden shrink-0">
            {/* Petals متحرّكة في الخلفيّة */}
            <div className="absolute inset-0 opacity-40 petals-always">
              <Petals count={4} />
            </div>

            {/* بقع ضوئيّة */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gold-light/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

            {/* light rays خفيفة */}
            <div
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background: 'conic-gradient(from 215deg at 90% 10%, transparent 0deg, rgba(232,200,138,0.3) 20deg, transparent 60deg)',
              }}
            />

            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 -m-1 rounded-full bg-gold-light/20 blur-md" />
                  <Image
                    src="/images/logo.svg"
                    alt=""
                    width={42}
                    height={42}
                    className="relative brightness-0 invert opacity-95"
                  />
                </div>
                <div>
                  <div className="font-en-display italic text-cream-50 text-lg leading-none tracking-wide">
                    Be First Lady
                  </div>
                  <div className="font-en-label text-[8px] tracking-[0.35em] text-gold-light mt-1.5">
                    SPA & SALON
                  </div>
                </div>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="relative z-10 w-10 h-10 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm flex items-center justify-center transition-all hover:rotate-90"
                aria-label="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* حالة الصالون */}
            <div className="relative mt-4 flex items-center gap-2 text-[11px] text-cream-100/90">
              <span className="relative flex w-2 h-2">
                <span className={`absolute inset-0 rounded-full ${open ? 'bg-emerald-400 animate-ping opacity-75' : 'bg-rose-500'}`} />
                <span className={`relative rounded-full w-2 h-2 ${open ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              </span>
              <span className="font-bold">{open ? 'مفتوح الآن' : 'مغلق'}</span>
              <span className="opacity-50">·</span>
              <span>يومياً 10 ص - 11 م</span>
            </div>
          </div>

          {/* ─── CTAs سريعة ─── */}
          <div className="grid grid-cols-2 gap-2.5 p-4 border-b border-cream-200 shrink-0">
            <Link
              href="/booking"
              onClick={() => setMenuOpen(false)}
              className="btn-shimmer relative flex flex-col items-center justify-center gap-1 py-3.5 bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50 rounded-xl font-bold text-sm shadow-md shadow-gold-deep/30 active:scale-95 transition-transform overflow-hidden"
            >
              <Calendar className="w-5 h-5 relative z-10" />
              <span className="relative z-10">احجزي الآن</span>
            </Link>
            <a
              href={waLink()}
              target="_blank"
              rel="noopener"
              className="relative flex flex-col items-center justify-center gap-1 py-3.5 bg-gradient-to-br from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-sm active:scale-95 transition-transform"
            >
              <MessageCircle className="w-5 h-5" />
              واتساب
            </a>
          </div>

          {/* ─── الروابط ─── */}
          <nav className="flex-1 overflow-y-auto px-4 py-3">
            <div className="font-en-label text-[10px] tracking-[0.35em] text-gold-light mb-3 px-2 flex items-center gap-2">
              <span>EXPLORE</span>
              <span className="flex-1 h-px bg-gradient-to-r from-gold-light/40 to-transparent" />
            </div>
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="group flex items-center justify-between px-4 py-3 rounded-xl text-ink font-semibold hover:bg-gradient-to-br hover:from-cream-100 hover:to-amber-50/50 hover:text-gold-deep transition-all"
                    >
                      <span className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cream-100 group-hover:bg-gold-light/15 group-hover:scale-110 text-gold-deep flex items-center justify-center transition-all">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span>{link.label}</span>
                        {link.badge && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 text-white">
                            {link.badge}
                          </span>
                        )}
                      </span>
                      <ChevronLeft className="w-4 h-4 text-gold-light opacity-40 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="font-en-label text-[10px] tracking-[0.35em] text-gold-light mb-3 mt-6 px-2 flex items-center gap-2">
              <span>MY ACCOUNT</span>
              <span className="flex-1 h-px bg-gradient-to-r from-gold-light/40 to-transparent" />
            </div>
            <Link
              href="/account"
              onClick={() => setMenuOpen(false)}
              className="group relative flex items-center justify-between px-4 py-3 rounded-xl bg-gradient-to-br from-gold-light/15 to-amber-100/50 text-gold-deep font-bold hover:from-gold-light/25 hover:to-amber-100/80 transition-all overflow-hidden"
            >
              <span className="flex items-center gap-3 relative z-10">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-deep to-ink text-cream-50 flex items-center justify-center shadow-md">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm">حسابي</div>
                  <div className="text-[10px] text-ink-soft font-normal">الحجوزات · النقاط · البكجات</div>
                </div>
              </span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/account/favorites"
              onClick={() => setMenuOpen(false)}
              className="group mt-2 flex items-center justify-between px-4 py-2.5 rounded-xl text-ink-soft hover:text-rose-600 hover:bg-rose-50/50 transition-all"
            >
              <span className="flex items-center gap-3 text-sm font-semibold">
                <Heart className="w-4 h-4 text-rose-500" />
                مفضّلتي
              </span>
              <ChevronLeft className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:-translate-x-1 transition-all" />
            </Link>
          </nav>

          {/* ─── Footer التواصل ─── */}
          <div className="p-4 border-t border-cream-200 bg-gradient-to-b from-cream-50/50 to-cream-100/50 shrink-0 space-y-2">
            <a
              href="tel:+966504389329"
              className="flex items-center gap-2 text-xs text-ink-soft hover:text-gold-deep transition-colors group"
            >
              <Phone className="w-3.5 h-3.5 text-gold-light group-hover:scale-110 transition-transform" />
              <span className="font-en-display" dir="ltr">+966 50 438 9329</span>
            </a>
            <div className="flex items-center gap-2 text-xs text-ink-soft">
              <MapPin className="w-3.5 h-3.5 text-gold-light" />
              المدينة المنوّرة · حي العوالي
            </div>

            {/* Social round icons */}
            <div className="flex items-center gap-2 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener"
                aria-label="Instagram"
                className="w-9 h-9 rounded-full bg-white border border-cream-200 flex items-center justify-center text-gold-deep hover:bg-gradient-to-br hover:from-pink-500 hover:to-orange-400 hover:text-white hover:border-transparent hover:scale-110 transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="mailto:info@befirstlady.com"
                aria-label="Email"
                className="w-9 h-9 rounded-full bg-white border border-cream-200 flex items-center justify-center text-gold-deep hover:bg-gold-deep hover:text-white hover:border-gold-deep hover:scale-110 transition-all"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href={waLink()}
                target="_blank"
                rel="noopener"
                aria-label="WhatsApp"
                className="w-9 h-9 rounded-full bg-white border border-cream-200 flex items-center justify-center text-gold-deep hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:scale-110 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>

            {/* Signature */}
            <div className="pt-3 text-center">
              <div className="font-en-label text-[8px] tracking-[0.4em] text-gold-light">
                SINCE 2024 · MADINAH
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
