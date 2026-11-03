'use client';

/**
 * FloatingButtons · أزرار عائمة
 * ═══════════════════════════════════════════════════════════
 * - واتساب يسار سفلي · صعود للأعلى يمين سفلي
 * - على الجوّال · ترتفع فوق الـMobileBottomNav
 * - واتساب مخفيّ على الديسكتوب (عندنا زرار واتساب في الـheader)
 */
import { useEffect, useState } from 'react';
import { ArrowUp, MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { waLink } from '@/lib/utils';

// الصفحات اللي ما فيها MobileBottomNav (فيها شريط سفلي خاص)
const NO_BOTTOM_NAV = ['/admin', '/booking', '/cart', '/login', '/signup', '/legal'];

export default function FloatingButtons() {
  const [showTop, setShowTop] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // ✅ هل هاي الصفحة فيها MobileBottomNav؟ · لتعديل الـposition
  const hasBottomNav = !NO_BOTTOM_NAV.some((p) => pathname?.startsWith(p));

  // position للـjawal: ارفعي الزرار فوق الـbottom nav (تقريباً 70px)
  const bottomClass = hasBottomNav ? 'bottom-24 md:bottom-5' : 'bottom-5';

  return (
    <>
      {/* زر واتساب (يسار أسفل) · مخفيّ على الديسكتوب لأن عندنا زرار في الـheader */}
      <a
        href={waLink()}
        target="_blank"
        rel="noopener"
        aria-label="تواصل عبر واتساب"
        className={`md:hidden fixed left-5 z-40 w-14 h-14 rounded-full bg-whatsapp text-white flex items-center justify-center shadow-xl hover:scale-110 transition-all ${bottomClass}`}
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      {/* زر للأعلى (يمين أسفل) */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="العودة للأعلى"
        className={`fixed right-5 z-40 w-12 h-12 rounded-full bg-white text-gold-deep border border-gold-light/30 flex items-center justify-center shadow-xl transition-all ${bottomClass} ${
          showTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </>
  );
}
