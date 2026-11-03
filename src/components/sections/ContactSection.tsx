'use client';

/**
 * ContactSection v2 — luxurious contact cards + ambient background
 */
import { MessageCircle, MapPin, Instagram, Phone, Clock, Mail, Navigation, Copy } from 'lucide-react';
import { waLink } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ContactSection() {
  const [copied, setCopied] = useState<string | null>(null);

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success('نُسخ ✓');
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <section id="contact" className="section-pad relative overflow-hidden">
      {/* زخارف خلفيّة */}
      <div className="absolute inset-0 bg-gradient-to-b from-cream-50 via-cream-100 to-cream-50" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold-light/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-200/15 rounded-full blur-3xl pointer-events-none" />

      <div className="container-brand max-w-5xl relative">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="heading-eyebrow">CONTACT</span>
          <h2 className="font-ar-display text-3xl md:text-4xl font-bold text-gold-deep mt-1">
            تواصلي معنا
          </h2>
          <span className="divider-gold" />
          <p className="font-en-display italic text-ink-soft mt-2 text-sm">
            We'd love to hear from you · هنا دائماً لخدمتكِ
          </p>
        </div>

        {/* ─── Main Contact Cards · 3 columns ─── */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          {/* WhatsApp · أهم زر */}
          <a
            href={waLink()}
            target="_blank"
            rel="noopener"
            className="group relative bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-3xl p-6 overflow-hidden hover:scale-[1.02] transition-transform shadow-xl shadow-emerald-500/20"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                <MessageCircle className="w-7 h-7" />
              </div>
              <div className="editorial-eyebrow text-white/70 mb-1">INSTANT</div>
              <div className="font-ar-display text-xl font-bold mb-1">واتساب</div>
              <div className="text-sm opacity-90 font-en-display" dir="ltr">+966 50 438 9329</div>
              <div className="mt-4 pt-4 border-t border-white/20 text-xs opacity-80">
                الردّ خلال 5 دقائق · 10 ص - 11 م
              </div>
            </div>
          </a>

          {/* Location */}
          <div className="group relative bg-gradient-to-br from-cream-50 to-amber-50 border-2 border-gold-light/30 rounded-3xl p-6 overflow-hidden hover:scale-[1.02] transition-transform">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold-light/15 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-deep to-ink text-cream-50 flex items-center justify-center mb-4 shadow-md group-hover:rotate-12 transition-transform">
                <MapPin className="w-7 h-7" />
              </div>
              <div className="editorial-eyebrow text-gold-deep/60 mb-1">LOCATION</div>
              <div className="font-ar-display text-xl font-bold text-gold-deep mb-1">المدينة المنوّرة</div>
              <div className="text-sm text-ink-soft">حي العوالي · شارع الملك عبدالله</div>
              <div className="mt-4 pt-4 border-t border-gold-light/20">
                <a
                  href="https://maps.google.com/?q=Be+First+Lady+Madinah"
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-deep hover:text-ink transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  فتح الخريطة
                </a>
              </div>
            </div>
          </div>

          {/* Instagram */}
          <a
            href="https://instagram.com/befirstlady"
            target="_blank"
            rel="noopener"
            className="group relative bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 text-white rounded-3xl p-6 overflow-hidden hover:scale-[1.02] transition-transform shadow-xl shadow-rose-500/20"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform">
                <Instagram className="w-7 h-7" />
              </div>
              <div className="editorial-eyebrow text-white/70 mb-1">FOLLOW US</div>
              <div className="font-ar-display text-xl font-bold mb-1">إنستقرام</div>
              <div className="text-sm opacity-90 font-en-display">@befirstlady</div>
              <div className="mt-4 pt-4 border-t border-white/20 text-xs opacity-80">
                شاهدي أحدث أعمالنا · عروض خاصّة للمتابعات
              </div>
            </div>
          </a>
        </div>

        {/* ─── Secondary Contact Row ─── */}
        <div className="grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() => copyToClipboard('+966504389329', 'phone')}
            className="group bg-white/80 backdrop-blur-sm border border-gold-light/15 rounded-2xl p-4 flex items-center gap-3 text-right hover:border-gold-light/40 hover:bg-white transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gold-light/15 text-gold-deep flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-ink-soft">اتصال مباشر</div>
              <div className="font-en-display font-bold text-sm text-gold-deep" dir="ltr">
                +966 50 438 9329
              </div>
            </div>
            <Copy className={`w-4 h-4 ${copied === 'phone' ? 'text-emerald-500' : 'text-ink-soft opacity-50 group-hover:opacity-100'} transition-colors`} />
          </button>

          <button
            type="button"
            onClick={() => copyToClipboard('info@befirstlady.com', 'email')}
            className="group bg-white/80 backdrop-blur-sm border border-gold-light/15 rounded-2xl p-4 flex items-center gap-3 text-right hover:border-gold-light/40 hover:bg-white transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-gold-light/15 text-gold-deep flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-ink-soft">إيميل</div>
              <div className="font-en-display font-bold text-sm text-gold-deep truncate" dir="ltr">
                info@befirstlady.com
              </div>
            </div>
            <Copy className={`w-4 h-4 ${copied === 'email' ? 'text-emerald-500' : 'text-ink-soft opacity-50 group-hover:opacity-100'} transition-colors`} />
          </button>

          <div className="bg-white/80 backdrop-blur-sm border border-gold-light/15 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-light/15 text-gold-deep flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] text-ink-soft">ساعات العمل</div>
              <div className="font-ar-display font-bold text-sm text-gold-deep">
                يومياً · 10 ص - 11 م
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
