/**
 * /admin/calls — سجلّ المكالمات (Call Center)
 */
'use client';

import { useState, useEffect } from 'react';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Loader2, Plus, X, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function CallsPage() {
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/admin/calls');
    const d = await r.json();
    if (d.ok) setCalls(d.calls);
    setLoading(false);
  }

  const todayCalls = calls.filter((c) => {
    const d = new Date(c.created_at).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    return d === today;
  });

  const missed = calls.filter((c) => c.outcome === 'missed' && c.callback_requested && !c.callback_at);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto pb-32">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-ar-display text-3xl font-bold text-gold-deep flex items-center gap-2">
            <Phone className="w-7 h-7" />
            سجلّ المكالمات
          </h1>
          <p className="text-ink-soft text-sm mt-1">متابعة كل المكالمات · والاتّصالات المُفوّتة</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> تسجيل مكالمة
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Stat value={todayCalls.length} label="اليوم" color="blue" />
        <Stat value={missed.length} label="بحاجة لمعاودة" color="amber" />
        <Stat value={calls.length} label="إجمالي" color="gold" />
      </div>

      {showNew && <CallForm onClose={() => setShowNew(false)} onSaved={load} />}

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" /></div>
      ) : (
        <div className="bg-white rounded-3xl border border-cream-200 overflow-hidden">
          {calls.length === 0 ? (
            <div className="p-10 text-center">
              <Phone className="w-10 h-10 mx-auto text-ink-soft/30 mb-2" />
              <p className="text-ink-soft text-sm">لا توجد مكالمات مسجّلة</p>
            </div>
          ) : (
            <ul className="divide-y divide-cream-100">
              {calls.map((c) => (
                <li key={c.id} className="p-4 flex items-center gap-3 hover:bg-cream-50/30">
                  <CallIcon direction={c.direction} outcome={c.outcome} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-ink">{c.customer?.full_name || c.customer_name || c.customer_phone}</span>
                      {c.outcome === 'booking_created' && <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">✓ حجز</span>}
                    </div>
                    <div className="text-[11px] text-ink-soft font-en-display mt-0.5">{c.customer_phone}</div>
                    {c.notes && <div className="text-[11px] text-ink-soft mt-1 line-clamp-1">{c.notes}</div>}
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-[10px] text-ink-soft">
                      {new Date(c.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Riyadh' })}
                    </div>
                    <div className="text-[10px] text-ink-soft">
                      {new Date(c.created_at).toLocaleDateString('ar-SA', { timeZone: 'Asia/Riyadh' })}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function CallIcon({ direction, outcome }: { direction: string; outcome: string }) {
  const bg = outcome === 'missed' ? 'bg-rose-100 text-rose-600'
    : direction === 'incoming' ? 'bg-emerald-100 text-emerald-600'
    : 'bg-blue-100 text-blue-600';
  const Icon = outcome === 'missed' ? PhoneMissed : direction === 'incoming' ? PhoneIncoming : PhoneOutgoing;
  return <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bg}`}><Icon className="w-4 h-4" /></div>;
}

function Stat({ value, label, color }: { value: number; label: string; color: 'blue' | 'amber' | 'gold' }) {
  const colors = {
    blue: 'from-blue-100 to-blue-50 text-blue-700',
    amber: 'from-amber-100 to-amber-50 text-amber-700',
    gold: 'from-gold-light/30 to-cream-100 text-gold-deep',
  }[color];
  return (
    <div className={`bg-gradient-to-br ${colors} rounded-2xl p-4 text-center border border-cream-200`}>
      <div className="font-en-display text-2xl font-bold">{value}</div>
      <div className="text-xs font-semibold mt-1">{label}</div>
    </div>
  );
}

function CallForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    direction: 'incoming' as 'incoming' | 'outgoing',
    customer_phone: '',
    customer_name: '',
    outcome: 'answered' as string,
    notes: '',
    callback_requested: false,
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!form.customer_phone) { toast.error('رقم الجوال مطلوب'); return; }
    setBusy(true);
    const r = await fetch('/api/admin/calls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    setBusy(false);
    if (d.ok) {
      toast.success('تمّ تسجيل المكالمة');
      onClose();
      onSaved();
    } else {
      toast.error(d.error || 'فشل');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-ar-display text-xl font-bold text-gold-deep">تسجيل مكالمة</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-ink-soft" /></button>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <button onClick={() => setForm({ ...form, direction: 'incoming' })} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${form.direction === 'incoming' ? 'bg-emerald-500 text-white' : 'bg-cream-100 text-ink-soft'}`}>
              📥 واردة
            </button>
            <button onClick={() => setForm({ ...form, direction: 'outgoing' })} className={`flex-1 py-2.5 rounded-xl text-sm font-bold ${form.direction === 'outgoing' ? 'bg-blue-500 text-white' : 'bg-cream-100 text-ink-soft'}`}>
              📤 صادرة
            </button>
          </div>

          <input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} placeholder="رقم الجوال" className="inp" dir="ltr" />
          <input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} placeholder="الاسم (اختياري)" className="inp" />

          <select value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} className="inp">
            <option value="answered">تمّ الرد</option>
            <option value="missed">لم ترد</option>
            <option value="voicemail">بريد صوتي</option>
            <option value="busy">مشغول</option>
            <option value="booking_created">حجز تمّ</option>
            <option value="inquiry">استفسار</option>
            <option value="complaint">شكوى</option>
            <option value="follow_up">متابعة</option>
          </select>

          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="ملاحظات..." className="inp" />

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.callback_requested} onChange={(e) => setForm({ ...form, callback_requested: e.target.checked })} className="accent-gold-deep" />
            <span className="text-sm">تطلب معاودة الاتّصال</span>
          </label>

          <button onClick={save} disabled={busy} className="btn-primary w-full !py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}
