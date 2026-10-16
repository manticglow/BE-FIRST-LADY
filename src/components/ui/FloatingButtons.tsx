'use client';

import { useEffect, useState } from 'react';
import { ArrowUp, MessageCircle } from 'lucide-react';
import { waLink } from '@/lib/utils';

export default function FloatingButtons() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const handler = () => setShowTop(window.scrollY > 500);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <>
      {/* زر واتساب (يسار أسفل) */}
      <a
        href={waLink()}
        target="_blank"
        rel="noopener"
        aria-label="تواصل عبر واتساب"
        className="fixed bottom-5 left-5 z-40 w-14 h-14 rounded-full bg-whatsapp text-white flex items-center justify-center shadow-xl hover:scale-110 transition-transform"
      >
        <MessageCircle className="w-6 h-6" />
      </a>

      {/* زر للأعلى (يمين أسفل) */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="العودة للأعلى"
        className={`fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-white text-gold-deep border border-gold-light/30 flex items-center justify-center shadow-xl transition-all ${
          showTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </>
  );
}
