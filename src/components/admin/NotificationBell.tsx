/**
 * NotificationBell — جرس الإشعارات مع polling كل 30 ثانية
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  icon: string;
  title: string;
  subtitle: string;
  href: string;
  time: string;
}

export default function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      setItems(data.notifications || []);
      setCount(data.count || 0);
    } catch {}
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // كل 30 ثانية
    return () => clearInterval(interval);
  }, []);

  // إغلاق عند النقر خارج
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  function timeAgo(iso: string): string {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'الآن';
    if (diff < 3600) return `${Math.floor(diff / 60)}د`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}س`;
    return `${Math.floor(diff / 86400)}ي`;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 hover:bg-white/10 rounded-lg transition-colors text-cream-100"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 animate-pulse">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-cream-200 overflow-hidden z-[100] max-h-[500px] flex flex-col">
          <div className="px-4 py-3 border-b border-cream-200 bg-cream-50 flex items-center justify-between">
            <h3 className="font-ar-display font-bold text-gold-deep">الإشعارات</h3>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-cream-100 rounded">
              <X className="w-4 h-4 text-ink-soft" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {items.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-soft">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                لا توجد إشعارات جديدة
              </div>
            ) : (
              <ul className="divide-y divide-cream-100">
                {items.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 hover:bg-cream-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl shrink-0">{n.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-ink">{n.title}</div>
                          <div className="text-xs text-ink-soft mt-0.5">{n.subtitle}</div>
                          <div className="text-[10px] text-ink-soft/70 mt-1 font-en-display">
                            {timeAgo(n.time)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="p-2 border-t border-cream-200 bg-cream-50 text-center">
              <button
                onClick={() => { load(); }}
                className="text-xs text-gold-deep font-bold hover:text-gold"
              >
                تحديث
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
