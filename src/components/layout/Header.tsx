'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Menu, X, MessageCircle } from 'lucide-react';
import { waLink } from '@/lib/utils';

const NAV_LINKS = [
  { href: '#story',    label: 'القصة' },
  { href: '#offer',    label: 'العروض' },
  { href: '#gallery',  label: 'المعرض' },
  { href: '#services', label: 'الخدمات' },
  { href: '/gift-cards', label: '🎁 بطاقات هدية' },
  { href: '#hours',    label: 'المواعيد' },
  { href: '#contact',  label: 'تواصل' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-cream-50/85 backdrop-blur-md border-b border-gold-light/15 shadow-sm">
        <div className="container-brand flex items-center justify-between py-3 md:py-4">
          {/* الشعار */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/logo.svg"
              alt="Be First Lady"
              width={44}
              height={44}
              priority
            />
            <div className="hidden sm:block">
              <div className="font-en-display italic text-gold-deep text-xl leading-none">Be First Lady</div>
              <div className="font-en-label text-[9px] tracking-[0.3em] text-gold-light mt-0.5">SPA & SALON</div>
            </div>
          </Link>

          {/* روابط الديسكتوب */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-ink-soft hover:text-gold-deep transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* زر الحجز + الهمبرغر */}
          <div className="flex items-center gap-2">
            <a href={waLink()} target="_blank" rel="noopener" className="btn-primary text-sm !py-2 !px-4">
              <MessageCircle className="w-4 h-4" />
              <span>احجزي</span>
            </a>
            <button
              onClick={() => setMenuOpen(true)}
              className="lg:hidden p-2 rounded-full hover:bg-cream-100 transition-colors"
              aria-label="فتح القائمة"
            >
              <Menu className="w-6 h-6 text-gold-deep" />
            </button>
          </div>
        </div>
      </header>

      {/* القائمة الجانبية (الجوال) */}
      <div
        className={`fixed inset-0 z-[100] transition-opacity duration-300 ${
          menuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        {/* Overlay */}
        <div
          onClick={() => setMenuOpen(false)}
          className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
        />
        {/* Panel */}
        <nav
          className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-cream-50 shadow-2xl transition-transform duration-300 ease-out ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between p-5 border-b border-gold-light/15">
            <span className="font-ar-display text-xl text-gold-deep">القائمة</span>
            <button
              onClick={() => setMenuOpen(false)}
              className="p-2 rounded-full hover:bg-cream-100"
              aria-label="إغلاق"
            >
              <X className="w-5 h-5 text-gold-deep" />
            </button>
          </div>
          <ul className="p-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl text-ink font-semibold hover:bg-cream-100 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li className="pt-4 border-t border-gold-light/15 mt-4">
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 rounded-xl text-gold-deep font-semibold hover:bg-cream-100"
              >
                👤 حسابي
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
}
