'use client';

import { MessageCircle, MapPin, Instagram, Phone } from 'lucide-react';
import { waLink } from '@/lib/utils';

export default function ContactSection() {
  return (
    <section id="contact" className="section-pad bg-cream-100">
      <div className="container-brand max-w-4xl">
        <div className="text-center mb-10">
          <span className="heading-eyebrow">CONTACT</span>
          <h2 className="font-ar-display text-3xl md:text-4xl font-bold text-gold-deep mt-1">تواصلي معنا</h2>
          <span className="divider-gold" />
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <a href={waLink()} target="_blank" rel="noopener" className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gold-light/15 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 rounded-full bg-whatsapp/10 text-whatsapp flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-7 h-7" />
            </div>
            <div className="font-ar-display text-lg font-bold text-gold-deep">واتساب</div>
            <div className="text-sm text-ink-soft mt-1" dir="ltr">0504389329</div>
          </a>

          <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gold-light/15">
            <div className="w-14 h-14 rounded-full bg-gold-light/10 text-gold flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-7 h-7" />
            </div>
            <div className="font-ar-display text-lg font-bold text-gold-deep">الموقع</div>
            <div className="text-sm text-ink-soft mt-1">المدينة المنوّرة</div>
          </div>

          <a href="https://instagram.com/befirstlady" target="_blank" rel="noopener" className="bg-white rounded-2xl p-6 text-center shadow-sm border border-gold-light/15 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 rounded-full bg-pink-500/10 text-pink-500 flex items-center justify-center mx-auto mb-3">
              <Instagram className="w-7 h-7" />
            </div>
            <div className="font-ar-display text-lg font-bold text-gold-deep">إنستقرام</div>
            <div className="text-sm text-ink-soft mt-1">@befirstlady</div>
          </a>
        </div>
      </div>
    </section>
  );
}
