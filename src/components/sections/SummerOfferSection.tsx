'use client';

import { MessageCircle } from 'lucide-react';
import { formatPrice, waLink } from '@/lib/utils';
import type { Package } from '@/types/database';

export default function SummerOfferSection({ offer }: { offer: Package & { services?: any[] } }) {
  const services = offer.services?.map((s: any) => s.service) || [];

  return (
    <section id="offer" className="section-pad relative overflow-hidden">
      <div className="container-brand max-w-2xl text-center">
        {/* شمس ذهبية */}
        <div className="flex justify-center mb-4">
          <svg viewBox="0 0 100 100" className="w-16 h-16 animate-spin" style={{ animationDuration: '22s' }}>
            <defs>
              <radialGradient id="sunGrad" cx=".5" cy=".5">
                <stop offset="0" stopColor="#fde3a7" />
                <stop offset=".6" stopColor="#f5b83d" />
                <stop offset="1" stopColor="#c9a96e" />
              </radialGradient>
            </defs>
            <g stroke="#c9a96e" strokeWidth="2.5" strokeLinecap="round">
              <line x1="50" y1="8"  x2="50" y2="20"/>
              <line x1="50" y1="80" x2="50" y2="92"/>
              <line x1="8"  y1="50" x2="20" y2="50"/>
              <line x1="80" y1="50" x2="92" y2="50"/>
              <line x1="20" y1="20" x2="28" y2="28"/>
              <line x1="72" y1="72" x2="80" y2="80"/>
              <line x1="80" y1="20" x2="72" y2="28"/>
              <line x1="20" y1="80" x2="28" y2="72"/>
            </g>
            <circle cx="50" cy="50" r="20" fill="url(#sunGrad)" />
          </svg>
        </div>

        <span className="heading-eyebrow">SUMMER PACKAGE</span>
        <h2 className="font-ar-display text-4xl md:text-5xl font-bold text-gold-deep mt-2">
          {offer.name_ar}
        </h2>

        <div className="mt-6">
          <div className="text-sm text-ink-soft">خدمتين من اختيارك بـ</div>
          <div className="inline-flex items-baseline gap-2 mt-1">
            <span className="font-en-display text-6xl md:text-7xl font-semibold bg-gold-gradient bg-clip-text text-transparent">
              {offer.price}
            </span>
            <span className="text-sm font-bold text-gold">ريال بس!</span>
          </div>
        </div>

        {/* الخدمات */}
        <ul className="mt-8 space-y-3 max-w-md mx-auto">
          {services.map((s: any) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 bg-white px-5 py-3 rounded-full border border-gold-light/25 shadow-sm"
            >
              <span className="w-10 h-10 flex items-center justify-center rounded-full bg-cream-100 text-gold text-lg">
                ✦
              </span>
              <span className="font-semibold text-ink">{s.name_ar}</span>
            </li>
          ))}
        </ul>

        {/* خصم إضافي */}
        <div className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full bg-gold-light/15 border border-dashed border-gold-light text-gold-deep text-sm font-semibold">
          <span className="w-6 h-6 rounded-full bg-gold text-white flex items-center justify-center font-bold">+</span>
          <span>خصم إضافي <b>15٪</b> على البديكير والمنكير</span>
        </div>

        {/* زر الحجز */}
        <div className="mt-8">
          <a
            href={waLink(`أرغب بحجز ${offer.name_ar} بسعر ${formatPrice(offer.price)}`)}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-3 px-7 py-4 rounded-full bg-gradient-to-r from-whatsapp to-[#128C7E] text-white font-bold text-base shadow-lg hover:-translate-y-0.5 transition-transform"
          >
            <span className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-whatsapp" />
            </span>
            <span>احجز الآن</span>
          </a>
        </div>
      </div>
    </section>
  );
}
