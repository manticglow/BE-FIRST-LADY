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

const HIDDEN_PATHS = ['/admin', '/booking', '/login', '/signup', '/account/attendance', '/account/leaves'];

export default function CartFab() {
  const cart = useCart();
  const router = useRouter();
  const pathname = usePathname();

  if (!cart.hydrated) return null;
  if (cart.count === 0) return null;
  if (pathname && HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;

  function goToBooking() {
    router.push(`/booking?service=${cart.items.join(',')}`);
  }

  return (
    <button
      onClick={goToBooking}
      className="fixed bottom-24 md:bottom-6 right-4 z-40 bg-gradient-to-br from-gold-deep to-ink text-cream-50 pr-4 pl-5 py-3 rounded-full shadow-2xl shadow-gold-deep/40 flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform animate-in slide-in-from-bottom-4"
      aria-label={`إكمال الحجز · ${cart.count} خدمات في السلة`}
    >
      <div className="relative">
        <ShoppingBag className="w-5 h-5" />
        <span className="absolute -top-2 -right-2 bg-cream-50 text-gold-deep rounded-full min-w-[20px] h-[20px] flex items-center justify-center text-[11px] font-en-display font-bold shadow">
          {cart.count}
        </span>
      </div>
      <span className="font-ar-display font-bold text-sm">إكمال الحجز</span>
    </button>
  );
}
