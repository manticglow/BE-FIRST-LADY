'use client';

/**
 * SessionHeartbeat — يرسل heartbeat كل دقيقتين لتتبع نشاط الجلسة
 * ═══════════════════════════════════════════════════════════
 * - يُركّب في admin layout
 * - يرسل POST /api/session/heartbeat على:
 *   · mount
 *   · كل دقيقتين (interval)
 *   · عند كل نشاط من المستخدم (click/keydown · throttled)
 * - يفحص الجلسة كل دقيقة · لو idle_timeout → redirect to login
 * - يعرض تحذير قبل انتهاء الجلسة بـ5 دقائق
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock } from 'lucide-react';

const HEARTBEAT_MS = 2 * 60 * 1000;      // دقيقتين
const CHECK_MS = 60 * 1000;              // دقيقة
const WARN_MINUTES = 5;                  // تحذير قبل 5 دقائق

export default function SessionHeartbeat() {
  const router = useRouter();
  const [warning, setWarning] = useState<number | null>(null);
  const lastSentRef = useRef<number>(0);
  const timeoutMinRef = useRef<number>(30);

  // ─── إرسال heartbeat ───
  const sendHeartbeat = useCallback(async () => {
    const now = Date.now();
    // throttle: ما نرسل أكثر من مرة في 30 ثانية
    if (now - lastSentRef.current < 30000) return;
    lastSentRef.current = now;
    try {
      const res = await fetch('/api/session/heartbeat', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.timeout_minutes) timeoutMinRef.current = data.timeout_minutes;
      }
    } catch {
      // silent
    }
  }, []);

  // ─── فحص الجلسة ───
  const checkSession = useCallback(async () => {
    try {
      const res = await fetch('/api/session/heartbeat', { method: 'GET' });
      const data = await res.json();

      if (!res.ok && data.reason === 'idle_timeout') {
        // انتهت الجلسة · redirect
        alert(data.message || 'تم تسجيل خروجكِ تلقائياً');
        router.push('/login?next=/admin');
        return;
      }

      // حساب الوقت المتبقي للتحذير
      const minutesIdle = data.minutes_idle || 0;
      const remaining = (data.timeout_minutes || 30) - minutesIdle;

      if (remaining <= WARN_MINUTES && remaining > 0) {
        setWarning(remaining);
      } else {
        setWarning(null);
      }
    } catch {
      // silent
    }
  }, [router]);

  useEffect(() => {
    // Initial heartbeat
    sendHeartbeat();

    // Interval heartbeat
    const heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_MS);

    // Interval check
    const checkInterval = setInterval(checkSession, CHECK_MS);

    // Activity listeners (throttled في sendHeartbeat)
    const activityHandler = () => sendHeartbeat();
    window.addEventListener('click', activityHandler);
    window.addEventListener('keydown', activityHandler);
    window.addEventListener('mousemove', activityHandler);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(checkInterval);
      window.removeEventListener('click', activityHandler);
      window.removeEventListener('keydown', activityHandler);
      window.removeEventListener('mousemove', activityHandler);
    };
  }, [sendHeartbeat, checkSession]);

  // ─── تحذير قبل انتهاء الجلسة ───
  if (!warning) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-lg max-w-sm animate-slide-up">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs">
          <div className="font-bold text-amber-900 mb-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            تنبيه الجلسة
          </div>
          <div className="text-amber-700">
            سيتم تسجيل خروجكِ تلقائياً خلال <strong>{warning}</strong>{' '}
            {warning === 1 ? 'دقيقة' : 'دقائق'} بسبب الخمول · أي حركة ستجدّد الجلسة
          </div>
        </div>
      </div>
    </div>
  );
}
