/**
 * AttendanceCard v2 — بطاقة الحضور بتحقّق موقع لحظي
 * ═══════════════════════════════════════════════════════════
 * - يفحص الموقع تلقائياً عند التحميل
 * - يبيّن المسافة من الصالون + نسبة الدقّة
 * - زرّ الحضور/الانصراف يُعطَّل إذا خارج النطاق
 * - تحديث لحظي لحالة الموقع كل 30 ثانية
 * - رسوم بصريّة واضحة لحالة التحقّق
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Clock, MapPin, Loader2, LogIn, LogOut, AlertCircle,
  CheckCircle2, Calendar, TrendingUp, Navigation, Shield,
  WifiOff, RefreshCw,
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
  stats: { week_hours: number; week_minutes: number; week_days: number };
}

interface LocationCheck {
  state: 'idle' | 'checking' | 'inside' | 'outside' | 'error';
  distance?: number;
  accuracy?: number;
  errorMessage?: string;
  latitude?: number;
  longitude?: number;
}

export default function AttendanceCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState('');
  const [locCheck, setLocCheck] = useState<LocationCheck>({ state: 'idle' });

  /* ═══ تحميل الحالة من الـAPI ═══ */
  async function loadStatus() {
    try {
      const res = await fetch('/api/attendance/status');
      if (res.status === 403) {
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

  /* ═══ تحقّق لحظي من الموقع ═══ */
  const checkLocation = useCallback(async () => {
    if (!status?.location) return;
    setLocCheck({ state: 'checking' });

    const position = await getCurrentPosition();
    if (!position) {
      setLocCheck({
        state: 'error',
        errorMessage: 'ما قدرنا نحدّد موقعكِ · فعّلي GPS وأذن الموقع',
      });
      return;
    }

    // احسب المسافة محلّياً (نفس formula الـserver)
    const distance = haversine(
      position.latitude,
      position.longitude,
      Number(status.location.latitude),
      Number(status.location.longitude)
    );
    const inside = distance <= status.location.radius_m;

    setLocCheck({
      state: inside ? 'inside' : 'outside',
      distance,
      accuracy: position.accuracy,
      latitude: position.latitude,
      longitude: position.longitude,
    });
  }, [status?.location]);

  // تحقّق تلقائي عند تحميل الحالة · ثم كل دقيقة
  useEffect(() => {
    if (!status?.location) return;
    checkLocation();
    const t = setInterval(checkLocation, 60000);
    return () => clearInterval(t);
  }, [status?.location, checkLocation]);

  /* ═══ عدّاد الوقت المنقضي ═══ */
  useEffect(() => {
    if (!status?.open) { setElapsed(''); return; }
    const update = () => {
      const start = new Date(status.open!.check_in_at).getTime();
      const diffMin = Math.floor((Date.now() - start) / 60000);
      const h = Math.floor(diffMin / 60);
      const m = diffMin % 60;
      setElapsed(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    };
    update();
    const t = setInterval(update, 15000);
    return () => clearInterval(t);
  }, [status?.open]);

  /* ═══ تسجيل حضور ═══ */
  async function handleCheckIn() {
    if (busy) return;
    if (locCheck.state !== 'inside') {
      toast.error('لا يمكنكِ تسجيل الحضور وأنتِ خارج نطاق الصالون');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: locCheck.latitude,
          longitude: locCheck.longitude,
          accuracy: locCheck.accuracy,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'فشل تسجيل الحضور');
        return;
      }
      haptic('success');
      toast.success('✅ تم تسجيل حضوركِ · أهلاً بكِ 💛');
      loadStatus();
    } catch {
      toast.error('خطأ في الاتصال');
    } finally { setBusy(false); }
  }

  /* ═══ تسجيل انصراف ═══ */
  async function handleCheckOut() {
    if (busy) return;
    if (locCheck.state !== 'inside') {
      toast.error('لا يمكنكِ تسجيل الانصراف وأنتِ خارج نطاق الصالون');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/attendance/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: locCheck.latitude,
          longitude: locCheck.longitude,
          accuracy: locCheck.accuracy,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'فشل تسجيل الانصراف');
        return;
      }
      haptic('success');
      toast.success(data.message || '✅ تم تسجيل انصرافكِ');
      loadStatus();
    } catch {
      toast.error('خطأ في الاتصال');
    } finally { setBusy(false); }
  }

  /* ═══════════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center shadow-sm border border-cream-200">
        <Loader2 className="w-8 h-8 text-gold-deep animate-spin mx-auto mb-3" />
        <div className="text-sm text-ink-soft">جارِ التحميل...</div>
      </div>
    );
  }

  if (!status?.location) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 text-center">
        <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
        <div className="font-bold text-amber-900 mb-1">موقع الصالون غير محدّد</div>
        <div className="text-sm text-amber-700">راجعي الإدارة لتحديد موقع الصالون في الإعدادات</div>
      </div>
    );
  }

  const isCheckedIn = !!status.open;

  return (
    <div className="space-y-4">

      {/* ═══ البطاقة الرئيسيّة ═══ */}
      <div className={`relative rounded-3xl p-6 md:p-8 overflow-hidden shadow-xl transition-colors duration-500 ${
        isCheckedIn
          ? 'bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white'
          : 'bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50'
      }`}>

        {/* زخرفة خلفيّة */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          {/* الحالة */}
          <div className="flex items-center justify-between mb-5">
            <div className="inline-flex items-center gap-1.5 bg-white/25 backdrop-blur-sm text-[11px] font-bold px-3 py-1.5 rounded-full">
              <span className={`w-1.5 h-1.5 rounded-full bg-white ${isCheckedIn ? 'animate-pulse' : ''}`} />
              {isCheckedIn ? 'داخل الدوام الآن' : 'خارج الدوام'}
            </div>

            <button
              onClick={checkLocation}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              aria-label="تحديث الموقع"
            >
              <RefreshCw className={`w-4 h-4 ${locCheck.state === 'checking' ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* الوقت المنقضي أو الاسم */}
          {isCheckedIn && elapsed ? (
            <>
              <div className="editorial-eyebrow text-white/80 mb-2">ELAPSED TIME</div>
              <div className="font-en-display font-bold text-6xl md:text-7xl leading-none tabular-nums mb-2">
                {elapsed}
              </div>
              <div className="text-xs opacity-80">
                بدأتِ الساعة {new Date(status.open!.check_in_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </>
          ) : (
            <>
              <div className="editorial-eyebrow text-white/80 mb-2">ATTENDANCE</div>
              <div className="font-ar-display text-3xl md:text-4xl font-bold mb-2">
                {status.location.name}
              </div>
              {status.location.address && (
                <div className="text-xs opacity-80">
                  {status.location.address}
                </div>
              )}
            </>
          )}

          {/* ─── مؤشّر الموقع ─── */}
          <LocationStatusBar locCheck={locCheck} allowedRadius={status.location.radius_m} />

          {/* ─── زر الحضور / الانصراف ─── */}
          {isCheckedIn ? (
            <button
              onClick={handleCheckOut}
              disabled={busy || locCheck.state !== 'inside'}
              className="w-full mt-5 bg-white text-ink font-ar-display font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-cream-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogOut className="w-5 h-5" />}
              {locCheck.state === 'inside' ? 'تسجيل الانصراف' : 'الموقع خارج النطاق'}
            </button>
          ) : (
            <button
              onClick={handleCheckIn}
              disabled={busy || locCheck.state !== 'inside'}
              className="w-full mt-5 bg-white text-ink font-ar-display font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-cream-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              {locCheck.state === 'inside' ? 'تسجيل الحضور' : 'الموقع خارج النطاق'}
            </button>
          )}
        </div>
      </div>

      {/* ═══ إحصائيّات الأسبوع ═══ */}
      <div className="grid grid-cols-3 gap-3">
        <StatMini
          icon={Clock}
          value={`${status.stats.week_hours}h`}
          label="ساعات الأسبوع"
          color="violet"
        />
        <StatMini
          icon={Calendar}
          value={String(status.stats.week_days)}
          label="أيام حضور"
          color="emerald"
        />
        <StatMini
          icon={TrendingUp}
          value={String(status.stats.week_minutes)}
          label="دقيقة إضافيّة"
          color="gold"
        />
      </div>

      {/* ═══ سجل الحضور الأخير ═══ */}
      {status.history.length > 0 && (
        <div className="bg-white rounded-3xl border border-cream-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-cream-200 bg-gradient-to-l from-gold-light/5 to-transparent">
            <h3 className="font-ar-display text-base font-bold text-gold-deep flex items-center gap-2">
              <Clock className="w-4 h-4" />
              سجل الحضور الأخير
            </h3>
          </div>
          <ul className="divide-y divide-cream-100 max-h-80 overflow-y-auto">
            {status.history.slice(0, 7).map((r) => <HistoryRow key={r.id} record={r} />)}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════ */

function LocationStatusBar({
  locCheck, allowedRadius,
}: {
  locCheck: LocationCheck;
  allowedRadius: number;
}) {
  if (locCheck.state === 'checking') {
    return (
      <div className="mt-5 bg-white/20 backdrop-blur-sm rounded-xl p-3 flex items-center gap-2.5">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        <span className="text-sm">جارِ تحديد موقعكِ...</span>
      </div>
    );
  }

  if (locCheck.state === 'error') {
    return (
      <div className="mt-5 bg-rose-500/25 backdrop-blur-sm rounded-xl p-3 flex items-center gap-2.5">
        <WifiOff className="w-4 h-4 shrink-0" />
        <span className="text-xs">{locCheck.errorMessage}</span>
      </div>
    );
  }

  if (locCheck.state === 'inside') {
    return (
      <div className="mt-5 bg-emerald-400/25 backdrop-blur-sm rounded-xl p-3 border border-emerald-300/30">
        <div className="flex items-center gap-2.5 mb-1.5">
          <Shield className="w-4 h-4 shrink-0" />
          <span className="text-sm font-bold">✓ أنتِ داخل نطاق الصالون</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] opacity-80 ps-6">
          <span className="flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            {Math.round(locCheck.distance!)} م
          </span>
          {locCheck.accuracy && (
            <span className="flex items-center gap-1">
              • دقّة ±{Math.round(locCheck.accuracy)} م
            </span>
          )}
        </div>
      </div>
    );
  }

  if (locCheck.state === 'outside') {
    const extra = Math.round(locCheck.distance! - allowedRadius);
    return (
      <div className="mt-5 bg-rose-500/25 backdrop-blur-sm rounded-xl p-3 border border-rose-300/30">
        <div className="flex items-center gap-2.5 mb-1.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm font-bold">✗ خارج نطاق الصالون</span>
        </div>
        <div className="text-[11px] opacity-90 ps-6">
          تبعدين {Math.round(locCheck.distance!)} م · (أبعد بـ {extra} م من المسموح)
        </div>
      </div>
    );
  }

  return null;
}

function StatMini({ icon: Icon, value, label, color }: { icon: any; value: string; label: string; color: 'violet' | 'emerald' | 'gold' }) {
  const colors = {
    violet: 'from-violet-500/15 to-violet-500/5 text-violet-700',
    emerald: 'from-emerald-500/15 to-emerald-500/5 text-emerald-700',
    gold: 'from-gold-light/20 to-gold-light/5 text-gold-deep',
  }[color];

  return (
    <div className={`bg-gradient-to-br ${colors} rounded-2xl p-3 text-center border border-white/50`}>
      <Icon className="w-4 h-4 mx-auto mb-1" />
      <div className="font-en-display font-bold text-xl text-ink leading-none">{value}</div>
      <div className="text-[9px] font-semibold mt-1 opacity-80">{label}</div>
    </div>
  );
}

function HistoryRow({ record }: { record: AttendanceRecord }) {
  const checkIn = new Date(record.check_in_at);
  const checkOut = record.check_out_at ? new Date(record.check_out_at) : null;
  const dateLabel = checkIn.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric', month: 'short' });

  const h = record.total_minutes ? Math.floor(record.total_minutes / 60) : 0;
  const m = record.total_minutes ? record.total_minutes % 60 : 0;

  return (
    <li className="px-5 py-3 flex items-center gap-3 hover:bg-cream-50/50 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-cream-100 flex items-center justify-center shrink-0">
        {record.check_out_at ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        ) : (
          <Clock className="w-5 h-5 text-gold-deep" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-ink truncate">{dateLabel}</div>
        <div className="text-[11px] text-ink-soft">
          <span className="font-en-display">
            {checkIn.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {checkOut && (
            <>
              {' → '}
              <span className="font-en-display">
                {checkOut.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </>
          )}
        </div>
      </div>
      {record.total_minutes && (
        <span className="font-en-display font-bold text-sm text-gold-deep shrink-0">
          {h}:{String(m).padStart(2, '0')}
        </span>
      )}
    </li>
  );
}

/* ═══ Helper · حساب المسافة (Haversine) ═══ */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // متر
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
