/**
 * CheckInButton — زر الحضور الذكي
 * ═══════════════════════════════════════════════════════════
 * - زر كبير فاخر في أعلى الرئيسية
 * - يستدعي API checkin / checkout
 * - عدّاد مباشر (ثانية تلو الثانية) · ما يحتاج refresh
 * - اهتزاز خفيف عند الضغط
 */
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Clock, LogIn, LogOut, Loader2, MapPin } from 'lucide-react';

interface Props {
  initialCheckedIn: boolean;
  initialCheckInAt: string | null;
  locationName?: string | null;
  onChange?: () => void;
}

export default function CheckInButton({
  initialCheckedIn, initialCheckInAt, locationName, onChange,
}: Props) {
  const [isCheckedIn, setIsCheckedIn] = useState(initialCheckedIn);
  const [checkInAt, setCheckInAt] = useState<string | null>(initialCheckInAt);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  // عدّاد مباشر لكل ثانية
  useEffect(() => {
    if (!isCheckedIn) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [isCheckedIn]);

  // حساب المدّة
  const workedSeconds = checkInAt
    ? Math.floor((Date.now() - new Date(checkInAt).getTime()) / 1000)
    : 0;
  const h = Math.floor(workedSeconds / 3600);
  const m = Math.floor((workedSeconds % 3600) / 60);
  const s = workedSeconds % 60;
  const timeStr = h > 0 ? `${h}س ${m}د ${s}ث` : `${m}د ${s}ث`;
  // استخدم tick ليجبر رسم جديد كل ثانية
  void tick;

  async function toggle() {
    if (busy) return;
    setBusy(true);

    // اهتزاز خفيف للموبايل
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(30);
    }

    try {
      const endpoint = isCheckedIn ? '/api/attendance/checkout' : '/api/attendance/checkin';
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'حدث خطأ');
        return;
      }

      if (isCheckedIn) {
        setIsCheckedIn(false);
        setCheckInAt(null);
        toast.success(`✨ تم تسجيل الانصراف · ${data.total_minutes || 0} دقيقة اليوم`);
      } else {
        setIsCheckedIn(true);
        setCheckInAt(data.check_in_at || new Date().toISOString());
        toast.success('🌸 أهلاً بكِ · تم تسجيل الحضور');
      }
      onChange?.();
    } catch {
      toast.error('تعذّر الاتصال · حاولي مرة ثانية');
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`
        relative w-full overflow-hidden rounded-3xl p-5 shadow-xl transition-all active:scale-[0.98]
        ${isCheckedIn
          ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 shadow-emerald-500/30'
          : 'bg-gradient-to-br from-gold-deep via-amber-700 to-ink shadow-gold-deep/30'}
        disabled:opacity-70
      `}
    >
      {/* لمعة خلفيّة */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />

      <div className="relative flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`
            w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-white/15 backdrop-blur-sm
            ${isCheckedIn ? '' : 'rotate-0'}
          `}>
            {busy ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isCheckedIn ? (
              <LogOut className="w-5 h-5" />
            ) : (
              <LogIn className="w-5 h-5" />
            )}
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-widest opacity-80">
              {isCheckedIn ? 'في العمل الآن' : 'ابدئي اليوم'}
            </div>
            <div className="font-ar-display font-bold text-lg leading-tight">
              {isCheckedIn ? 'تسجيل انصراف' : 'تسجيل حضور'}
            </div>
            {locationName && (
              <div className="flex items-center gap-1 text-[10px] opacity-75 mt-0.5">
                <MapPin className="w-2.5 h-2.5" />
                <span className="truncate max-w-[180px]">{locationName}</span>
              </div>
            )}
          </div>
        </div>

        {isCheckedIn && (
          <div className="text-left">
            <div className="flex items-center gap-1 text-[10px] opacity-80 justify-end">
              <Clock className="w-3 h-3" />
              <span>الوقت المنقضي</span>
            </div>
            <div className="font-en-display font-bold text-xl leading-tight tabular-nums mt-0.5">
              {timeStr}
            </div>
          </div>
        )}
      </div>

      {/* نبض خفيف لمّا checked-in */}
      {isCheckedIn && (
        <span className="absolute top-3 right-3 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-white/60 animate-ping" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
      )}
    </button>
  );
}
