/**
 * NotificationBell — جرس الإشعارات مع:
 *   - polling كل 30 ثانية
 *   - صوت تنبيه عند حجز جديد (Web Audio · بدون ملف)
 *   - إشعار نظام (Browser Notification) للمتصفح
 *   - تذكير متكرر كل 3 دقائق لو فيه حجز معلّق
 *   - اهتزاز للجوال
 */
'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Volume2, VolumeX, BellRing } from 'lucide-react';
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

const SOUND_ENABLED_KEY = 'bfl_sound_enabled';
const REMINDER_INTERVAL_MS = 3 * 60 * 1000; // 3 دقائق

export default function NotificationBell() {
  const [items, setItems] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>('default');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number>(0);
  const firstLoadRef = useRef<boolean>(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const reminderIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      setSoundEnabled(localStorage.getItem(SOUND_ENABLED_KEY) === 'true');
    } catch {}
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  function playAlertSound() {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const frequencies = [880, 1046, 1318];
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = ctx.currentTime + i * 0.15;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.3, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch (err) {
      console.warn('[NotificationBell] تعذّر تشغيل الصوت', err);
    }
  }

  function vibrate() {
    try {
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
    } catch {}
  }

  function showSystemNotification(title: string, body: string, href: string) {
    try {
      if (!('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;
      const n = new Notification(title, {
        body,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-96.png',
        tag: 'bfl-booking',
        requireInteraction: true,
      });
      n.onclick = () => {
        window.focus();
        window.location.href = href;
        n.close();
      };
    } catch {}
  }

  function startReminder() {
    stopReminder();
    reminderIntervalRef.current = setInterval(() => {
      if (count > 0) {
        playAlertSound();
        vibrate();
        showSystemNotification(
          '⏰ تذكير — حجوزات بانتظار إجراء',
          `لديكِ ${count} ${count === 1 ? 'إشعار' : 'إشعارات'} بانتظار المراجعة`,
          '/admin/bookings?status=pending'
        );
      }
    }, REMINDER_INTERVAL_MS);
  }

  function stopReminder() {
    if (reminderIntervalRef.current) {
      clearInterval(reminderIntervalRef.current);
      reminderIntervalRef.current = null;
    }
  }

  async function load() {
    try {
      const res = await fetch('/api/admin/notifications');
      const data = await res.json();
      const newItems: Notification[] = data.notifications || [];
      const newCount: number = data.count || 0;

      if (!firstLoadRef.current && newCount > prevCountRef.current) {
        const latest = newItems[0];
        if (latest) {
          playAlertSound();
          vibrate();
          showSystemNotification(`🔔 ${latest.title}`, latest.subtitle, latest.href);
        }
      }

      prevCountRef.current = newCount;
      firstLoadRef.current = false;
      setItems(newItems);
      setCount(newCount);

      if (newCount > 0 && !reminderIntervalRef.current) startReminder();
      else if (newCount === 0 && reminderIntervalRef.current) stopReminder();
    } catch {}
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => {
      clearInterval(interval);
      stopReminder();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled]);

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

  async function toggleSound() {
    const next = !soundEnabled;
    try { localStorage.setItem(SOUND_ENABLED_KEY, String(next)); } catch {}
    setSoundEnabled(next);
    if (next) {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
        const osc = audioCtxRef.current.createOscillator();
        const gain = audioCtxRef.current.createGain();
        osc.frequency.value = 1046;
        gain.gain.setValueAtTime(0.2, audioCtxRef.current.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.2);
        osc.connect(gain).connect(audioCtxRef.current.destination);
        osc.start();
        osc.stop(audioCtxRef.current.currentTime + 0.2);
      } catch {}
      if ('Notification' in window && Notification.permission === 'default') {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
      }
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 hover:bg-white/10 rounded-lg transition-colors text-cream-100"
        title="الإشعارات"
      >
        {count > 0 ? <BellRing className="w-5 h-5 animate-pulse" /> : <Bell className="w-5 h-5" />}
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 animate-pulse">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-cream-200 overflow-hidden z-[100] max-h-[500px] flex flex-col">
          <div className="px-4 py-3 border-b border-cream-200 bg-cream-50 flex items-center justify-between gap-2">
            <h3 className="font-ar-display font-bold text-gold-deep flex-1">الإشعارات</h3>
            <button
              onClick={toggleSound}
              className={`p-1.5 rounded-lg transition-colors ${
                soundEnabled
                  ? 'bg-success/15 text-success hover:bg-success/25'
                  : 'bg-cream-100 text-ink-soft hover:bg-cream-200'
              }`}
              title={soundEnabled ? 'الصوت مفعّل' : 'فعّلي الصوت'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-cream-100 rounded">
              <X className="w-4 h-4 text-ink-soft" />
            </button>
          </div>

          {!soundEnabled && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-900">
              💡 اضغطي 🔇 لتفعيل الصوت والإشعارات · عشان ما يفوتك حجز
            </div>
          )}
          {soundEnabled && notifPermission === 'denied' && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-900">
              ⚠️ إشعارات المتصفح معطّلة · فعّليها من إعدادات الموقع
            </div>
          )}

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
