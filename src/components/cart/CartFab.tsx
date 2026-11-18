/**
 * CartFab — زر عائم يعرض عدد الخدمات في السلة
 * ═══════════════════════════════════════════════════════════
 * - يظهر فقط لمّا فيه خدمات في السلة
 * - اضغطيه → ينقلك لصفحة الحجز بكل خدمات السلة محددة
 * - يختفي في صفحات معيّنة (/admin, /booking, /login)
 */
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

const HIDDEN_PATHS = ['/admin', '/booking', '/cart', '/login', '/signup', '/account/attendance', '/account/leaves'];

export default function CartFab() {
  const cart = useCart();
  const router = useRouter();
  const pathname = usePathname();

  if (!cart.hydrated) return null;
  if (cart.count === 0) return null;
  if (pathname && HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;

  function goToCart() {
    router.push('/cart');
  }

  return (
    <button
      data-cart-badge
      onClick={goToCart}
      className="fixed bottom-24 md:bottom-6 right-4 z-40 bg-gold-deep text-cream-50 pr-4 pl-5 py-3 shadow-[0_12px_32px_-8px_rgba(201,169,110,0.5)] flex items-center gap-2 transition-all duration-300 hover:bg-ink active:scale-[0.95] animate-in slide-in-from-bottom-4"
      aria-label={`السلة · ${cart.count} خدمات`}
      style={{ borderRadius: '2px' }}
    >
      <div className="relative">
        <ShoppingBag className="w-5 h-5" />
        <span className="absolute -top-2 -right-2 bg-cream-50 text-gold-deep min-w-[20px] h-[20px] flex items-center justify-center text-[11px] font-en-display font-bold shadow" style={{ borderRadius: '10px' }}>
          {cart.count}
        </span>
      </div>
      <span className="font-bold text-[13px] uppercase" style={{ letterSpacing: '0.1em' }}>عرض السلة</span>
    </button>
  );
}
