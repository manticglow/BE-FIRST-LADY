/**
 * /admin/campaigns — الحملات التسويقيّة
 */
'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Send, Loader2, Plus, Users, Check, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const SEGMENTS = [
  { value: 'all', label: '🌸 كل العميلات', desc: 'ترسل لكل من في قاعدة البيانات' },
  { value: 'inactive_60d', label: '💤 لم تزرنا من 60 يوم', desc: 'ذكّريهنّ بعودة' },
  { value: 'inactive_90d', label: '💤 لم تزرنا من 90 يوم', desc: 'عرض استرجاع' },
  { value: 'vip', label: '👑 عميلات VIP (Gold+)', desc: 'عروض خاصّة للـVIP' },
  { value: 'birthdays_this_month', label: '🎂 أعياد الميلاد هذا الشهر', desc: 'تهنئة جماعيّة' },
  { value: 'new_customers', label: '✨ عميلات جُدد (آخر 30 يوم)', desc: 'رحّبي بهنّ' },
];

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const r = await fetch('/api/admin/campaigns');
    const d = await r.json();
    if (d.ok) setCampaigns(d.campaigns);
    setLoading(false);
  }

  async function sendCampaign(id: string) {
    if (!confirm('هل أنتِ متأكّدة من إرسال الحملة؟ لا يمكن التراجع.')) return;
    const toastId = toast.loading('جاري الإرسال...');
    const r = await fetch(`/api/admin/campaigns/${id}/send`, { method: 'POST' });
    const d = await r.json();
    toast.dismiss(toastId);
    if (d.ok) {
      toast.success(`تمّ إرسال ${d.sent} رسالة بنجاح`);
      load();
    } else {
      toast.error(d.error || 'فشل الإرسال');
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-gold-deep" /></div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto pb-32">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-ar-display text-3xl font-bold text-gold-deep flex items-center gap-2">
            <Megaphone className="w-7 h-7" />
            الحملات التسويقيّة
          </h1>
          <p className="text-ink-soft text-sm mt-1">أرسلي رسائل واتساب لعميلاتكِ · باستهداف ذكي</p>
        </div>

        <button
          onClick={() => setShowNew(true)}
          className="btn-primary flex items-center gap-2 !px-5 !py-2.5"
        >
          <Plus className="w-4 h-4" />
          حملة جديدة
        </button>
      </div>

      {showNew && <NewCampaignForm onClose={() => setShowNew(false)} onSaved={load} />}

      <div className="grid gap-4">
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center border border-cream-200">
            <Megaphone className="w-10 h-10 mx-auto text-ink-soft/40 mb-3" />
            <p className="text-ink-soft">لا توجد حملات بعد · أنشئي أوّل حملة!</p>
          </div>
        ) : (
          campaigns.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl p-5 border border-cream-200 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-ink">{c.name}</h3>
                  <p className="text-xs text-ink-soft mt-0.5">
                    {SEGMENTS.find((s) => s.value === c.target_segment)?.label || c.target_segment}
                    {' · '}
                    <span className="font-en-display font-bold">{c.total_recipients}</span> مستلمة
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>

              <div className="bg-cream-50 rounded-xl p-3 text-sm text-ink-soft mb-3 whitespace-pre-wrap">
                {c.message_ar}
              </div>

              {c.status === 'sent' && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Stat label="أُرسلت" value={c.total_delivered} />
                  <Stat label="فُتحت" value={c.total_clicked} />
                  <Stat label="حجوزات" value={c.total_converted} />
                </div>
              )}

              {(c.status === 'draft' || c.status === 'scheduled') && (
                <button
                  onClick={() => sendCampaign(c.id)}
                  className="w-full bg-gold-deep hover:bg-gold-light text-white py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold"
                >
                  <Send className="w-4 h-4" />
                  إرسال الآن
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function NewCampaignForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('');
  const [segment, setSegment] = useState('all');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!name || !message) {
      toast.error('أدخلي الاسم والرسالة');
      return;
    }
    setBusy(true);
    const r = await fetch('/api/admin/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, target_segment: segment, message_ar: message }),
    });
    const d = await r.json();
    setBusy(false);
    if (d.ok) {
      toast.success(`تمّ إنشاء الحملة · ${d.audienceCount} مستلمة`);
      onClose();
      onSaved();
    } else {
      toast.error(d.error || 'فشل الإنشاء');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-ar-display text-xl font-bold text-gold-deep flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            حملة جديدة
          </h2>
          <button onClick={onClose} className="text-ink-soft hover:text-ink"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink-soft mb-1.5">اسم الحملة</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="inp" placeholder="عرض نهاية الأسبوع · نوفمبر" />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-soft mb-1.5">الجمهور المستهدف</label>
            <div className="space-y-2">
              {SEGMENTS.map((s) => (
                <label key={s.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${segment === s.value ? 'bg-gold-light/10 border-gold-light' : 'border-cream-200 hover:bg-cream-50'}`}>
                  <input type="radio" name="segment" checked={segment === s.value} onChange={() => setSegment(s.value)} className="mt-1 accent-gold-deep" />
                  <div>
                    <div className="font-bold text-sm text-ink">{s.label}</div>
                    <div className="text-[11px] text-ink-soft">{s.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-soft mb-1.5">نصّ الرسالة</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="inp"
              placeholder="💕 اشتقنا لكِ يا عزيزتي&#10;&#10;هديّة خاصّة لعودتكِ: خصم 20% على أي خدمة هذا الأسبوع&#10;استخدمي كوبون: WELCOME20&#10;&#10;احجزي: thefirstlady.sa"
            />
            <p className="text-[10px] text-ink-soft mt-1">{message.length} حرف</p>
          </div>

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 bg-cream-100 hover:bg-cream-200 text-ink py-2.5 rounded-xl font-bold text-sm">إلغاء</button>
            <button onClick={save} disabled={busy} className="flex-1 btn-primary !py-2.5 flex items-center justify-center gap-2 disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              حفظ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-cream-50 rounded-xl p-2 text-center">
      <div className="font-en-display text-base font-bold text-gold-deep">{value || 0}</div>
      <div className="text-[9px] text-ink-soft font-bold">{label}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    draft: { label: 'مسودّة', color: 'bg-slate-100 text-slate-700' },
    scheduled: { label: 'مجدولة', color: 'bg-blue-100 text-blue-700' },
    sending: { label: 'ترسل الآن', color: 'bg-amber-100 text-amber-700 animate-pulse' },
    sent: { label: '✓ أُرسلت', color: 'bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'ملغاة', color: 'bg-rose-100 text-rose-700' },
  };
  const s = map[status] || { label: status, color: 'bg-slate-100' };
  return <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.color}`}>{s.label}</span>;
}
