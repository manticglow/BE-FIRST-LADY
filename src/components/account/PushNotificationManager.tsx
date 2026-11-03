'use client';

/**
 * PushNotificationManager — تفعيل/تعطيل الإشعارات
 * ═══════════════════════════════════════════════════════════
 * - يسأل الصلاحيّة · يسجّل الـsubscription
 * - يعرض الحالة الحيّة
 * - يسمح بالتعطيل
 */
import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2, CheckCircle2, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

type PushState = 'unsupported' | 'denied' | 'granted' | 'default' | 'checking';

export default function PushNotificationManager() {
  const [state, setState] = useState<PushState>('checking');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [busy, setBusy] = useState(false);

  // فحص الحالة عند التحميل
  useEffect(() => {
    checkState();
  }, []);

  async function checkState() {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setState('unsupported');
      return;
    }

    const permission = Notification.permission;
    if (permission === 'denied') {
      setState('denied');
      return;
    }

    // اجلبي الـsubscription الحاليّة
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setSubscription(sub);
      if (sub) setState('granted');
      else setState(permission === 'granted' ? 'granted' : 'default');
    } catch {
      setState('default');
    }
  }

  async function enable() {
    if (!VAPID_PUBLIC) {
      toast.error('الإشعارات غير مُفعّلة حالياً · يرجى التواصل مع الإدارة');
      return;
    }
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('رفضتِ الإذن · تقدرين تفعّلينه من إعدادات المتصفّح');
        setState(permission === 'denied' ? 'denied' : 'default');
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC) as BufferSource,
      });

      // أرسلي للسيرفر
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: arrayBufferToBase64(sub.getKey('p256dh')!),
            auth: arrayBufferToBase64(sub.getKey('auth')!),
          },
        }),
      });

      if (!res.ok) {
        throw new Error('فشل الحفظ');
      }

      setSubscription(sub);
      setState('granted');
      toast.success('🔔 تم تفعيل الإشعارات!');
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'فشل التفعيل');
    } finally { setBusy(false); }
  }

  async function disable() {
    setBusy(true);
    try {
      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setSubscription(null);
      setState('default');
      toast.success('تم إيقاف الإشعارات');
    } catch (e: any) {
      toast.error('فشل الإيقاف');
    } finally { setBusy(false); }
  }

  if (state === 'checking') {
    return (
      <div className="bg-cream-50 border border-cream-200 rounded-2xl p-5 flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-gold-deep" />
        <span className="text-sm text-ink-soft">جارِ فحص حالة الإشعارات...</span>
      </div>
    );
  }

  if (state === 'unsupported') {
    return (
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
        <div className="font-bold text-stone-700 text-sm mb-1 flex items-center gap-2">
          <BellOff className="w-4 h-4" />
          الإشعارات غير مدعومة
        </div>
        <p className="text-xs text-stone-600">
          متصفّحكِ لا يدعم إشعارات الـweb · جرّبي Chrome أو Safari حديث
        </p>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="font-bold text-amber-900 text-sm mb-1 flex items-center gap-2">
          <BellOff className="w-4 h-4" />
          الإشعارات محظورة
        </div>
        <p className="text-xs text-amber-800 mb-2">
          رفضتِ الإذن سابقاً · لتفعيلها افتحي إعدادات المتصفّح وأعيدي الصلاحيّة
        </p>
        <div className="text-[10px] text-amber-700 bg-amber-100 rounded-lg p-2">
          <strong>Chrome:</strong> اضغطي القفل بجنب العنوان → الإشعارات → السماح
        </div>
      </div>
    );
  }

  if (state === 'granted' && subscription) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-emerald-900 text-sm">الإشعارات مُفعّلة ✨</div>
            <p className="text-xs text-emerald-800 mt-1">
              راح يصلك إشعار قبل كل موعد · عند تأكيد الحجز · والعروض الخاصّة
            </p>
            <button
              onClick={disable}
              disabled={busy}
              className="mt-3 text-xs text-emerald-700 hover:text-rose-700 font-bold disabled:opacity-50"
            >
              {busy ? 'جارِ الإيقاف...' : '⏸ إيقاف الإشعارات'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // default · لم تُطلب بعد
  return (
    <div className="bg-gradient-to-br from-gold-light/15 to-amber-50 border border-gold-light/30 rounded-2xl p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-deep to-ink text-cream-50 flex items-center justify-center shadow-md">
            <Bell className="w-6 h-6" />
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
        </div>
        <div className="flex-1">
          <div className="font-ar-display font-bold text-gold-deep text-base">
            فعّلي الإشعارات
          </div>
          <p className="text-xs text-ink-soft mt-1 leading-relaxed">
            لا تفوّتي:
          </p>
          <ul className="text-xs text-ink mt-2 space-y-0.5">
            <li className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-gold-deep" />
              تذكير قبل موعدكِ بـ24 ساعة
            </li>
            <li className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-gold-deep" />
              عروض حصريّة ومفاجآت
            </li>
            <li className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-gold-deep" />
              تأكيد الحجز وتحديثاته
            </li>
          </ul>
        </div>
      </div>

      <button
        onClick={enable}
        disabled={busy}
        className="btn-shimmer w-full py-3 rounded-xl bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg transition-all overflow-hidden"
      >
        {busy
          ? <><Loader2 className="w-4 h-4 animate-spin" /> جارِ التفعيل...</>
          : <><Bell className="w-4 h-4" /> فعّلي الإشعارات</>}
      </button>
    </div>
  );
}

// ─── Helpers ───
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
