/**
 * AttendanceCard — بطاقة الحضور والانصراف للموظفة
 * ═══════════════════════════════════════════════════════════
 * - يطلب الموقع الجغرافي
 * - يرسل للخادم للتحقق
 * - يعرض الحالة الحالية + الوقت المنقضي
 */
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Clock, MapPin, Loader2, LogIn, LogOut, AlertCircle,
  CheckCircle2, Calendar, TrendingUp,
} from 'lucide-react';
import { getCurrentPosition } from '@/lib/mobile/geolocation';
import { haptic } from '@/lib/mobile/haptics';

interface AttendanceRecord {
  id: string;
  check_in_at: string;
  check_out_at: string | null;
  total_minutes: number | null;
  check_in_accuracy_m: number | null;
}

interface Status {
  open: AttendanceRecord | null;
  location: {
    name: string;
    address: string | null;
    latitude: number;
    longitude: number;
    radius_m: number;
  } | null;
  history: AttendanceRecord[];
  stats: {
    week_hours: number;
    week_minutes: number;
    week_days: number;
  };
}

export default function AttendanceCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState('');

  // جلب الحالة
  async function loadStatus() {
    try {
      const res = await fetch('/api/attendance/status');
      if (res.status === 403) {
        // ليست موظفة — ما يفترض تصل هنا
        setStatus({ open: null, location: null, history: [], stats: { week_hours: 0, week_minutes: 0, week_days: 0 } });
        toast.error('الحضور متاح للموظفات فقط');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setStatus(data);
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { loadStatus(); }, []);

  // عدّاد الوقت المنقضي
  useEffect(() => {
    if (!status?.open) return;
    const update = () => {
      const start = new Date(status.open!.check_in_at).getTime();
      const now = Date.now();
      const diffMin = Math.floor((now - start) / 60000);
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      setElapsed(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    };
    update();
    const t = setInterval(update, 1000 * 30);
    return () => clearInterval(t);
  }, [status?.open]);

  async function getLocation() {
    const pos = await getCurrentPosition();
    if (!pos) {
      toast.error('تعذّر الحصول على الموقع — تأكّدي من السماح بالوصول وتفعيل GPS');
      return null;
    }
    return {
      coords: {
        latitude: pos.latitude,
        longitude: pos.longitude,
        accuracy: pos.accuracy,
      },
    };
  }

  async function checkIn() {
    setBusy(true);
    const pos = await getLocation();
    if (!pos) { setBusy(false); return; }

    try {
      const res = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'فشل تسجيل الحضور');
        return;
      }
      haptic('success');
      toast.success(data.message || 'تم تسجيل حضوركِ ✨');
      await loadStatus();
    } finally { setBusy(false); }
  }

  async function checkOut() {
    if (!confirm('تأكدي من رغبتكِ بتسجيل الانصراف؟')) return;
    setBusy(true);
    const pos = await getLocation();
    try {
      const res = await fetch('/api/attendance/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: pos?.coords.latitude,
          longitude: pos?.coords.longitude,
          accuracy: pos?.coords.accuracy,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'فشل تسجيل الانصراف');
        return;
      }
      haptic('success');
      toast.success(data.message || 'تم تسجيل انصرافكِ 💛');
      await loadStatus();
    } finally { setBusy(false); }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-cream-200">
        <Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" />
      </div>
    );
  }

  const isCheckedIn = !!status?.open;

  return (
    <div className="space-y-5">
      {/* بطاقة الحالة الرئيسية */}
      <div
        className={`rounded-3xl shadow-lg overflow-hidden border ${
          isCheckedIn
            ? 'border-success/40 bg-gradient-to-b from-success/5 to-white'
            : 'border-cream-200 bg-white'
        }`}
      >
        <div
          className={`p-6 text-center ${
            isCheckedIn ? 'bg-gradient-to-l from-success to-emerald-700 text-white' : 'bg-gradient-to-l from-gold-deep to-ink text-cream-50'
          }`}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            {isCheckedIn ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Clock className="w-6 h-6" />
            )}
            <div className="font-ar-display text-xl font-bold">
              {isCheckedIn ? 'أنتِ في العمل الآن' : 'لم تسجّلي حضورك اليوم'}
            </div>
          </div>

          {isCheckedIn && (
            <>
              <div className="font-en-display text-5xl font-bold tabular-nums tracking-wider my-4">
                {elapsed || '00:00'}
              </div>
              <div className="text-xs opacity-80">
                بدأتِ الساعة {new Date(status.open!.check_in_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </>
          )}

          {!isCheckedIn && (
            <div className="text-sm opacity-80 mt-1">
              اضغطي الزر لتسجيل الحضور
            </div>
          )}
        </div>

        <div className="p-5">
          {isCheckedIn ? (
            <button
              onClick={checkOut}
              disabled={busy}
              className="w-full py-4 bg-danger hover:bg-danger/90 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
              تسجيل انصراف
            </button>
          ) : (
            <button
              onClick={checkIn}
              disabled={busy}
              className="w-full py-4 bg-success hover:bg-success/90 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              تسجيل حضور
            </button>
          )}

          {status?.location && (
            <div className="mt-3 flex items-start gap-2 text-xs text-ink-soft">
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <div>
                يجب أن تكوني داخل نطاق <strong>{status.location.name}</strong> ({status.location.radius_m} متر)
              </div>
            </div>
          )}
        </div>
      </div>

      {/* إحصائيات الأسبوع */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-cream-200">
          <div className="flex items-center gap-2 text-xs text-ink-soft mb-2">
            <TrendingUp className="w-4 h-4 text-gold-deep" />
            هذا الأسبوع
          </div>
          <div className="font-en-display text-2xl font-bold text-ink">
            {status?.stats.week_hours || 0}<span className="text-sm text-ink-soft">س</span>
            {' '}{status?.stats.week_minutes || 0}<span className="text-sm text-ink-soft">د</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-cream-200">
          <div className="flex items-center gap-2 text-xs text-ink-soft mb-2">
            <Calendar className="w-4 h-4 text-gold-deep" />
            أيام الحضور
          </div>
          <div className="font-en-display text-2xl font-bold text-ink">
            {status?.stats.week_days || 0}<span className="text-sm text-ink-soft"> يوم</span>
          </div>
        </div>
      </div>

      {/* السجلّ */}
      {status?.history && status.history.length > 0 && (
        <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-cream-200 bg-cream-50">
            <h3 className="font-ar-display font-bold text-gold-deep">آخر 14 يوم</h3>
          </div>
          <ul className="divide-y divide-cream-100 max-h-96 overflow-y-auto">
            {status.history.map((r) => {
              const checkIn = new Date(r.check_in_at);
              const checkOut = r.check_out_at ? new Date(r.check_out_at) : null;
              const date = checkIn.toLocaleDateString('en-GB');
              const inTime = checkIn.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
              const outTime = checkOut ? checkOut.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—';
              const duration = r.total_minutes
                ? `${Math.floor(r.total_minutes / 60)}س ${r.total_minutes % 60}د`
                : 'جارٍ...';
              return (
                <li key={r.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-en-display font-bold text-ink">{date}</div>
                    <div className="text-xs text-ink-soft mt-0.5 font-en-display">
                      {inTime} ← {outTime}
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="font-en-display font-bold text-gold-deep text-sm">{duration}</div>
                    {!checkOut && (
                      <div className="text-[10px] text-success font-bold">نشط</div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
