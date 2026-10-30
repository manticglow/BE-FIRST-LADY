/**
 * useScrollReveal — Hook للكشف عن العناصر عند السكرول
 * ═══════════════════════════════════════════════════════════
 * يضيف class 'is-visible' للعنصر لمّا يدخل الشاشة
 * - أداء عالي (IntersectionObserver)
 * - يحترم prefers-reduced-motion
 */
'use client';

import { useEffect, useRef } from 'react';

interface Options {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: Options = {}
) {
  const { threshold = 0.1, rootMargin = '0px 0px -10% 0px', once = true } = options;
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // احترم prefers-reduced-motion
    if (typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-visible');
            if (once) observer.unobserve(el);
          } else if (!once) {
            el.classList.remove('is-visible');
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return ref;
}
