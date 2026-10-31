/**
 * SalonLocationManager — إدارة موقع الصالون للـgeofence
 * ═══════════════════════════════════════════════════════════
 * - خريطة بسيطة بإحداثيات
 * - أزرار: "استخدم موقعي الحالي" / "تحديد يدوي"
 * - ضبط نصف قطر النطاق المسموح (10-500 م)
 * - معاينة مرئيّة للنطاق
 */
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  MapPin, Navigation, Save, Loader2, Target,
  CheckCircle2, AlertCircle, Compass, Building2,
} from 'lucide-react';

interface SalonLocation {
  id?: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_m: number;
}

const PRESET_RADII = [
  { value: 50,  label: '50 م', desc: 'صالون صغير' },
  { value: 100, label: '100 م', desc: 'الموصى به' },
  { value: 200, label: '200 م', desc: 'صالون كبير' },
  { value: 500, label: '500 م', desc: 'منطقة واسعة' },
];

export default function SalonLocationManager() {
  const [location, setLocation] = useState<SalonLocation>({
    name: 'Be First Lady',
    address: '',
    latitude: null,
    longitude: null,
    radius_m: 100,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [manualMode, setManualMode] = useState(false);

  /* ═══ تحميل الموقع الحالي من الـAPI ═══ */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/salon-location');
        const data = await res.json();
        if (data.location) {
          setLocation({
            id: data.location.id,
            name: data.location.name || 'Be First Lady',
            address: data.location.address || '',
            latitude: Number(data.location.latitude),
            longitude: Number(data.location.longitude),
            radius_m: data.location.radius_m || 100,
          });
        }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  /* ═══ استخدم موقعي الحالي ═══ */
  async function useCurrentLocation() {
    setDetecting(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) return reject(new Error('المتصفح ما يدعم تحديد الموقع'));
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });
      setLocation((prev) => ({
        ...prev,
        latitude: Number(position.coords.latitude.toFixed(6)),
        longitude: Number(position.coords.longitude.toFixed(6)),
      }));
      toast.success(`✅ تم تحديد الموقع بدقّة ${Math.round(position.coords.accuracy)} م`);
    } catch (err: any) {
      toast.error(err.message || 'فشل تحديد الموقع · فعّلي GPS');
    } finally { setDetecting(false); }
  }

  /* ═══ حفظ ═══ */
  async function save() {
    if (!location.latitude || !location.longitude) {
      toast.error('حدّدي الموقع أولاً');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/salon-location', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: location.name,
          address: location.address,
          latitude: location.latitude,
          longitude: location.longitude,
          radius_m: location.radius_m,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'فشل الحفظ');
        return;
      }
      toast.success('✅ تم حفظ موقع الصالون');
    } catch {
      toast.error('خطأ في الاتصال');
    } finally { setSaving(false); }
  }

  const isConfigured = location.latitude && location.longitude;
  const mapUrl = isConfigured
    ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}&z=18`
    : null;

  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-cream-200">
        <Loader2 className="w-6 h-6 text-gold-deep animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* ═══ Header + حالة الحفظ ═══ */}
      <div className={`relative rounded-3xl p-5 md:p-6 overflow-hidden shadow-md ${
        isConfigured
          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
          : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
      }`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex items-start justify-between gap-4">
          <div>
            <div className="editorial-eyebrow text-white/80 mb-1">GEOFENCE</div>
            <h2 className="font-ar-display text-2xl font-bold mb-1 flex items-center gap-2">
              {isConfigured ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              {isConfigured ? 'موقع الصالون مُحدَّد' : 'لازم تحدّدي موقع الصالون'}
            </h2>
            <p className="text-xs opacity-90">
              {isConfigured
                ? `الموظفات ما يقدرن يسجّلن حضور/انصراف إلا داخل ${location.radius_m} م من الصالون`
                : 'النظام ما يقدر يتحقّق من حضور الموظفات بدون الموقع'}
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ═══ معلومات الصالون ═══ */}
      <div className="bg-white rounded-3xl border border-cream-200 p-5 md:p-6 shadow-sm space-y-4">

        <div className="flex items-center gap-2 mb-2">
          <Building2 className="w-5 h-5 text-gold-deep" />
          <h3 className="font-ar-display text-lg font-bold text-gold-deep">معلومات الصالون</h3>
        </div>

        <div>
          <label className="block text-xs font-bold text-ink-soft mb-1.5">اسم الصالون</label>
          <input
            type="text"
            value={location.name}
            onChange={(e) => setLocation({ ...location, name: e.target.value })}
            placeholder="Be First Lady"
            className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:border-gold-deep outline-none bg-white text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-ink-soft mb-1.5">العنوان (اختياري)</label>
          <input
            type="text"
            value={location.address || ''}
            onChange={(e) => setLocation({ ...location, address: e.target.value })}
            placeholder="المدينة المنوّرة · حي العوالي · شارع ..."
            className="w-full px-4 py-2.5 rounded-xl border border-cream-200 focus:border-gold-deep outline-none bg-white text-sm"
          />
        </div>
      </div>

      {/* ═══ تحديد الإحداثيات ═══ */}
      <div className="bg-white rounded-3xl border border-cream-200 p-5 md:p-6 shadow-sm space-y-4">

        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-gold-deep" />
            <h3 className="font-ar-display text-lg font-bold text-gold-deep">إحداثيات الموقع</h3>
          </div>
          <button
            onClick={() => setManualMode(!manualMode)}
            className="text-xs text-gold-deep hover:text-ink font-bold"
          >
            {manualMode ? 'إغلاق التعديل اليدوي' : 'تعديل يدوي'}
          </button>
        </div>

        {/* زر استخدم موقعي */}
        <button
          onClick={useCurrentLocation}
          disabled={detecting}
          className="w-full bg-gradient-to-br from-gold-deep to-ink text-cream-50 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.01] transition-transform disabled:opacity-50"
        >
          {detecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Compass className="w-5 h-5" />}
          {detecting ? 'جارِ تحديد الموقع...' : 'استخدم موقعي الحالي'}
        </button>

        {/* إحداثيات */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-ink-soft mb-1.5">خط العرض (Latitude)</label>
            <input
              type="number"
              step="0.000001"
              value={location.latitude ?? ''}
              onChange={(e) => setLocation({ ...location, latitude: Number(e.target.value) || null })}
              disabled={!manualMode}
              placeholder="24.4686"
              dir="ltr"
              className="w-full px-3 py-2.5 rounded-xl border border-cream-200 focus:border-gold-deep outline-none bg-white text-sm font-en-display disabled:bg-cream-50 disabled:text-ink-soft"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink-soft mb-1.5">خط الطول (Longitude)</label>
            <input
              type="number"
              step="0.000001"
              value={location.longitude ?? ''}
              onChange={(e) => setLocation({ ...location, longitude: Number(e.target.value) || null })}
              disabled={!manualMode}
              placeholder="39.6142"
              dir="ltr"
              className="w-full px-3 py-2.5 rounded-xl border border-cream-200 focus:border-gold-deep outline-none bg-white text-sm font-en-display disabled:bg-cream-50 disabled:text-ink-soft"
            />
          </div>
        </div>

        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener"
            className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors"
          >
            <Navigation className="w-4 h-4" />
            عرض على خرائط Google
          </a>
        )}
      </div>

      {/* ═══ نصف القطر ═══ */}
      <div className="bg-white rounded-3xl border border-cream-200 p-5 md:p-6 shadow-sm space-y-4">

        <div className="flex items-center gap-2 mb-2">
          <Target className="w-5 h-5 text-gold-deep" />
          <h3 className="font-ar-display text-lg font-bold text-gold-deep">نطاق المسموح</h3>
        </div>

        <p className="text-xs text-ink-soft">
          يحدّد المسافة المسموح للموظفة فيها لتسجيل الحضور/الانصراف.
          مثلاً · لو نصف القطر 100 م · ومتر 101 م خارج النطاق → يُرفض.
        </p>

        {/* الـpreset buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {PRESET_RADII.map((p) => (
            <button
              key={p.value}
              onClick={() => setLocation({ ...location, radius_m: p.value })}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border-2 ${
                location.radius_m === p.value
                  ? 'bg-gold-deep text-cream-50 border-gold-deep'
                  : 'bg-cream-50 text-ink-soft border-cream-200 hover:border-gold-light'
              }`}
            >
              <div>{p.label}</div>
              <div className={`text-[9px] mt-0.5 ${location.radius_m === p.value ? 'opacity-80' : 'opacity-60'}`}>
                {p.desc}
              </div>
            </button>
          ))}
        </div>

        {/* القيمة الدقيقة */}
        <div>
          <label className="block text-xs font-bold text-ink-soft mb-1.5">
            أو ضبطي قيمة محدّدة (10 - 500 م)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={location.radius_m}
              onChange={(e) => setLocation({ ...location, radius_m: Number(e.target.value) })}
              className="flex-1"
            />
            <div className="w-24 px-3 py-2 bg-gold-light/10 text-gold-deep font-bold text-center rounded-xl font-en-display">
              {location.radius_m} م
            </div>
          </div>
        </div>
      </div>

      {/* ═══ زر الحفظ الكبير ═══ */}
      <button
        onClick={save}
        disabled={saving || !isConfigured}
        className="w-full bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50 font-ar-display font-bold text-lg py-4 rounded-2xl shadow-xl shadow-gold-deep/20 hover:scale-[1.01] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
        {saving ? 'جارِ الحفظ...' : 'حفظ موقع الصالون'}
      </button>
    </div>
  );
}
