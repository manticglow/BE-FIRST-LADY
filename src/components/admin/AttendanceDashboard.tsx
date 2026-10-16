/**
 * AttendanceDashboard — لوحة الحضور للمالكة
 */
'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin, Users, Calendar, Loader2, CheckCircle2 } from 'lucide-react';

interface Record {
  id: string;
  check_in_at: string;
  check_out_at: string | null;
  total_minutes: number | null;
  user: { full_name: string; role: string };
}

interface LocationData {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius_m: number;
}

export default function AttendanceDashboard({ initialLocation }: { initialLocation: LocationData | null }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<LocationData | null>(initialLocation);
  const [editingLoc, setEditingLoc] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/admin/attendance?date=${date}`);
    const data = await res.json();
    setRecords(data.records || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [date]);

  const openNow = records.filter((r) => !r.check_out_at);
  const completed = records.filter((r) => r.check_out_at);
  const totalMinutes = completed.reduce((s, r) => s + (r.total_minutes || 0), 0);

  return (
    <div className="space-y-5">
      {/* الفلتر */}
      <div className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-cream-200">
        <Calendar className="w-5 h-5 text-gold-deep" />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm font-en-display"
        />
        <button
          onClick={() => setDate(new Date().toISOString().split('T')[0])}
          className="text-xs text-gold-deep font-bold hover:underline"
        >
          اليوم
        </button>
      </div>

      {/* إحصائيات اليوم */}
      <div className="grid grid-cols-3 gap-3">
        <StatBox label="في العمل الآن" value={String(openNow.length)} icon={CheckCircle2} color="success" />
        <StatBox label="أكملت دوامها" value={String(completed.length)} icon={Users} color="gold" />
        <StatBox
          label="إجمالي الساعات"
          value={`${Math.floor(totalMinutes / 60)}س ${totalMinutes % 60}د`}
          icon={Clock}
          color="gold"
        />
      </div>

      {/* موقع الصالون */}
      <div className="bg-white rounded-2xl p-5 border border-cream-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-ar-display font-bold text-gold-deep flex items-center gap-2">
            <MapPin className="w-4 h-4" /> موقع الصالون (geofence)
          </h3>
          <button
            onClick={() => setEditingLoc(!editingLoc)}
            className="text-xs text-gold-deep font-bold hover:underline"
          >
            {editingLoc ? 'إلغاء' : 'تعديل'}
          </button>
        </div>
        {editingLoc ? (
          <LocationEditor
            current={location}
            onSaved={(l) => { setLocation(l); setEditingLoc(false); }}
          />
        ) : (
          <div className="text-sm space-y-1">
            <div><span className="text-ink-soft">الاسم:</span> {location?.name || '—'}</div>
            {location?.address && <div><span className="text-ink-soft">العنوان:</span> {location.address}</div>}
            <div className="font-en-display">
              <span className="text-ink-soft">الإحداثيات:</span> {location?.latitude?.toFixed(5)}, {location?.longitude?.toFixed(5)}
            </div>
            <div><span className="text-ink-soft">نصف القطر المسموح:</span> <strong>{location?.radius_m} متر</strong></div>
          </div>
        )}
      </div>

      {/* السجلات */}
      <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-cream-200 bg-cream-50">
          <h3 className="font-ar-display font-bold text-gold-deep">
            سجلات اليوم {new Date(date).toLocaleDateString('en-GB')}
          </h3>
        </div>
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" />
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-sm text-ink-soft">
            ما فيه سجلات حضور لهذا اليوم
          </div>
        ) : (
          <ul className="divide-y divide-cream-100">
            {records.map((r) => {
              const inTime = new Date(r.check_in_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
              const outTime = r.check_out_at
                ? new Date(r.check_out_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                : null;
              const duration = r.total_minutes
                ? `${Math.floor(r.total_minutes / 60)}س ${r.total_minutes % 60}د`
                : 'جارٍ...';
              const roleLabel = { owner: 'مالكة', manager: 'مديرة', staff: 'موظفة' }[r.user.role] || r.user.role;

              return (
                <li key={r.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-light to-gold-deep text-cream-50 flex items-center justify-center font-bold shrink-0">
                      {r.user.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-sm text-ink">{r.user.full_name}</div>
                      <div className="text-[10px] text-ink-soft">{roleLabel}</div>
                    </div>
                  </div>
                  <div className="text-sm text-ink font-en-display shrink-0">
                    {inTime} ← {outTime || '—'}
                  </div>
                  <div className="text-left shrink-0 min-w-[80px]">
                    <div className="font-en-display font-bold text-gold-deep text-sm">{duration}</div>
                    {!r.check_out_at && (
                      <div className="text-[10px] text-success font-bold">نشطة ✓</div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color }: any) {
  const colors = {
    success: 'bg-success/10 text-success',
    gold: 'bg-gold-deep/10 text-gold-deep',
  };
  return (
    <div className="bg-white rounded-2xl p-4 border border-cream-200">
      <div className={`w-10 h-10 rounded-full ${colors[color]} flex items-center justify-center mb-2`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="font-en-display text-xl font-bold text-ink">{value}</div>
      <div className="text-xs text-ink-soft mt-1">{label}</div>
    </div>
  );
}

function LocationEditor({ current, onSaved }: { current: LocationData | null; onSaved: (l: LocationData) => void }) {
  const [form, setForm] = useState({
    name: current?.name || 'الصالون الرئيسي',
    address: current?.address || '',
    latitude: current?.latitude || 24.4686,
    longitude: current?.longitude || 39.6142,
    radius_m: current?.radius_m || 100,
  });
  const [busy, setBusy] = useState(false);

  async function useCurrentLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm({ ...form, latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => alert('تعذر الحصول على الموقع'),
      { enableHighAccuracy: true }
    );
  }

  async function save() {
    setBusy(true);
    const res = await fetch('/api/admin/salon-location', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (res.ok) {
      onSaved({ ...current, ...form, id: current?.id || '' } as LocationData);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-ink-soft mb-1">الاسم</label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-cream-50 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs text-ink-soft mb-1">العنوان</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-cream-50 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-ink-soft mb-1">خط العرض</label>
          <input
            type="number" step="0.0000001"
            value={form.latitude}
            onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-cream-50 text-sm font-en-display"
          />
        </div>
        <div>
          <label className="block text-xs text-ink-soft mb-1">خط الطول</label>
          <input
            type="number" step="0.0000001"
            value={form.longitude}
            onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-cream-50 text-sm font-en-display"
          />
        </div>
      </div>
      <button
        onClick={useCurrentLocation}
        className="w-full py-2 bg-gold-light/15 text-gold-deep rounded-lg text-xs font-bold hover:bg-gold-light/30 flex items-center justify-center gap-1"
      >
        <MapPin className="w-3 h-3" />
        استخدمي موقعي الحالي (كوني داخل الصالون)
      </button>
      <div>
        <label className="block text-xs text-ink-soft mb-1">نصف القطر المسموح (متر)</label>
        <input
          type="number" min="20" max="2000"
          value={form.radius_m}
          onChange={(e) => setForm({ ...form, radius_m: Number(e.target.value) })}
          className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-cream-50 text-sm font-en-display"
        />
        <p className="text-[10px] text-ink-soft mt-1">يُنصح بـ 50-150 متر</p>
      </div>
      <button
        onClick={save}
        disabled={busy}
        className="btn-primary w-full !py-2 text-sm disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'حفظ الموقع'}
      </button>
    </div>
  );
}
