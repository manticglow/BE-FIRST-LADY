/**
 * useCart — سلة الخدمات (محفوظة في localStorage)
 * ═══════════════════════════════════════════════════════════
 * - تبقى محفوظة لمّا العميلة تتنقل بين الصفحات
 * - تنتشر بين كل التبويبات/المكوّنات تلقائياً
 * - آمنة على السيرفر (SSR) · ما تنكسر لو localStorage مو متاح
 */
'use client';

import { useState, useEffect, useCallback } from 'react';

const KEY = 'bfl_cart';
const EVENT = 'bfl-cart-change';

function readCart(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeCart(items: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EVENT));
  } catch {}
}

export function useCart() {
  const [items, setItems] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setHydrated(true);
    const handler = () => setItems(readCart());
    window.addEventListener(EVENT, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const add = useCallback((id: string) => {
    const current = readCart();
    if (!current.includes(id)) {
      writeCart([...current, id]);
    }
  }, []);

  const remove = useCallback((id: string) => {
    const current = readCart();
    writeCart(current.filter((x) => x !== id));
  }, []);

  const toggle = useCallback((id: string) => {
    const current = readCart();
    writeCart(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }, []);

  const clear = useCallback(() => writeCart([]), []);

  const has = useCallback((id: string) => items.includes(id), [items]);

  return { items, count: items.length, hydrated, add, remove, toggle, clear, has };
}
