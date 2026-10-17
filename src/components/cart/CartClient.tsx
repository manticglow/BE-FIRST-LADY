/**
 * CartClient — واجهة صفحة السلة
 */
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, X, Clock, Sparkles, ArrowLeft, Plus } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { formatPrice, formatDuration } from '@/lib/utils';
import type { Service } from '@/types/database';

export default function CartClient({ services }: { services: Service[] }) {
  const cart = useCart();
  const router = useRouter();

  if (!cart.hydrated) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="animate-pulse text-ink-soft">...جاري التحميل</div>
      </div>
    );
  }

  const cartItems = cart.items
    .map((id) => services.find((s) => s.id === id))
    .filter(Boolean) as Service[];

  const subtotal = cartItems.reduce((sum, s) => sum + Number(s.price), 0);
  const totalDuration = cartItems.reduce((sum, s) => sum + s.duration_min, 0);

  function proceedToBooking() {
    if (cartItems.length === 0) return;
    router.push(`/booking?service=${cartItems.map((s) => s.id).join(',')}`);
  }

  return (
    <div className="min-h-screen bg-cream-50 pb-32 md:pb-20">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="w-10 h-10 rounded-full hover:bg-cream-100 flex items-center justify-center text-ink-soft hover:text-gold-deep transition-colors"
            aria-label="رجوع"
          >
            <ArrowLeft className="w-5 h-5 rotate-180" />
          </Link>
          <div className="text-center">
            <h1 className="font-ar-display text-lg font-bold text-gold-deep">السلة</h1>
            {cartItems.length > 0 && (
              <p className="text-[11px] text-ink-soft">{cartItems.length} خدمة</p>
            )}
          </div>
          <div className="w-10" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {cartItems.length === 0 ? (
          <EmptyCart />
        ) : (
          <>
            {/* قائمة الخدمات */}
            <section className="space-y-3 mb-6">
              {cartItems.map((service) => (
                <CartItemCard
                  key={service.id}
                  service={service}
                  onRemove={() => cart.remove(service.id)}
                />
              ))}
            </section>

            {/* زر إضافة المزيد */}
            <Link
              href="/#services"
              className="block w-full text-center py-3 border-2 border-dashed border-cream-300 text-ink-soft rounded-2xl hover:border-gold-light hover:text-gold-deep transition-colors mb-6 text-sm font-semibold"
            >
              <Plus className="w-4 h-4 inline ml-1" />
              إضافة المزيد من الخدمات
            </Link>

            {/* ملخّص الحساب */}
            <section className="bg-white rounded-3xl border border-cream-200 p-5 mb-6 shadow-sm">
              <h3 className="font-ar-display text-lg font-bold text-gold-deep mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                الملخّص
              </h3>

              <div className="space-y-2.5 pb-4 border-b border-cream-100">
                <SummaryRow label={`${cartItems.length} خدمة`} value={formatPrice(subtotal)} />
                <SummaryRow label="المدة الإجمالية" value={formatDuration(totalDuration)} muted />
              </div>

              <div className="flex items-center justify-between pt-4">
                <span className="font-ar-display font-bold text-ink text-lg">الإجمالي</span>
                <span className="font-en-display font-bold text-2xl text-gold-deep">
                  {formatPrice(subtotal)}
                </span>
              </div>
            </section>

            {/* زر المتابعة */}
            <button
              onClick={proceedToBooking}
              className="w-full bg-gradient-to-br from-gold-deep via-gold-deep to-ink text-cream-50 font-ar-display font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-gold-deep/20 hover:shadow-2xl hover:scale-[1.01] active:scale-95 transition-all"
            >
              <span>اختاري الموعد وتابعي</span>
              <ArrowLeft className="w-5 h-5" />
            </button>

            <p className="text-[11px] text-ink-soft text-center mt-3 leading-relaxed">
              📅 الخطوة الجاية: اختاري التاريخ والوقت والاختصاصية لكل خدماتكِ · ثم تأكيد الحجز
            </p>
          </>
        )}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════

function CartItemCard({ service, onRemove }: { service: Service; onRemove: () => void }) {
  const img = service.image_url || `/images/services/${(service as any).slug || 'default'}.jpg`;

  return (
    <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden flex gap-3 shadow-sm">
      {/* صورة */}
      <div className="relative w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-gold-light/10 to-cream-100 shrink-0">
        {service.image_url && (
          <Image
            src={img}
            alt={service.name_ar}
            fill
            className="object-cover"
            sizes="112px"
          />
        )}
        {!service.image_url && (
          <div className="w-full h-full flex items-center justify-center text-gold-deep/30">
            <Sparkles className="w-8 h-8" />
          </div>
        )}
      </div>

      {/* معلومات */}
      <div className="flex-1 min-w-0 py-3 pl-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-ar-display font-bold text-sm md:text-base text-ink line-clamp-1">
              {service.name_ar}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-ink-soft">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-gold-deep" />
                <span className="font-en-display">{formatDuration(service.duration_min)}</span>
              </span>
            </div>
            {service.description_ar && (
              <p className="text-[11px] text-ink-soft mt-1 line-clamp-2 leading-relaxed">
                {service.description_ar}
              </p>
            )}
          </div>
          <button
            onClick={onRemove}
            className="w-8 h-8 rounded-full bg-cream-50 hover:bg-danger/10 hover:text-danger text-ink-soft flex items-center justify-center transition-colors shrink-0"
            aria-label="حذف من السلة"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 font-en-display font-bold text-gold-deep text-base">
          {formatPrice(service.price, { showFrom: service.price_from })}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-soft">{label}</span>
      <span className={`font-en-display font-semibold ${muted ? 'text-ink-soft' : 'text-ink'}`}>
        {value}
      </span>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-gold-light/20 to-cream-100 flex items-center justify-center mb-5">
        <ShoppingBag className="w-12 h-12 text-gold-deep/40" />
      </div>
      <h2 className="font-ar-display text-2xl font-bold text-gold-deep mb-2">
        سلتكِ فارغة
      </h2>
      <p className="text-sm text-ink-soft mb-6 max-w-xs">
        تصفّحي خدماتنا الفاخرة وأضيفي ما يعجبكِ للسلة · ثم اختاري موعدكِ وأكّدي الحجز
      </p>
      <Link
        href="/#services"
        className="inline-flex items-center gap-2 bg-gradient-to-br from-gold-deep to-ink text-cream-50 font-bold py-3 px-7 rounded-2xl shadow-lg shadow-gold-deep/20 hover:shadow-xl hover:scale-105 transition-all"
      >
        <Sparkles className="w-4 h-4" />
        تصفّحي الخدمات
      </Link>
    </div>
  );
}
