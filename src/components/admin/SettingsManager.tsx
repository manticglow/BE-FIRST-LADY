/**
 * SettingsManager — تفعيل كامل للإعدادات
 * - ساعات العمل
 * - أيام الإغلاق (العطل)
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Clock, Calendar, Plus, Trash2, Loader2, Save } from 'lucide-react';

interface Hour {
  section: string;
  open_time: string;
  close_time: string;
  note?: string | null;
}

interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
  all_day: boolean;
}

export default function SettingsManager({
  initialHours, initialBlocked,
}: {
  initialHours: Hour[];
  initialBlocked: BlockedDate[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  // ساعات
  const [spa, setSpa] = useState<Hour>(
    initialHours.find((h) => h.section === 'spa') || { section: 'spa', open_time: '10:00', close_time: '00:00', note: '' }
  );
  const [salon, setSalon] = useState<Hour>(
    initialHours.find((h) => h.section === 'salon') || { section: 'salon', open_time: '13:00', close_time: '23:00', note: '' }
  );

  // أيام العطل
  const [blocked, setBlocked] = useState(initialBlocked);
  const [newBlock, setNewBlock] = useState({ date: '', reason: '' });

  async function saveHours() {
    setBusy('hours');
    const res = await fetch('/api/admin/hours', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hours: [spa, salon] }),
    });
    setBusy(null);
    if (!res.ok) { toast.error('فشل الحفظ'); return; }
    toast.success('تم حفظ ساعات العمل ⏰');
    router.refresh();
  }

  async function addBlock() {
    if (!newBlock.date) { toast.error('اختاري التاريخ'); return; }
    setBusy('add-block');
    const res = await fetch('/api/admin/blocked-dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: newBlock.date, reason: newBlock.reason, all_day: true }),
    });
    setBusy(null);
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || 'فشل'); return; }
    setBlocked([data.blocked, ...blocked]);
    setNewBlock({ date: '', reason: '' });
    toast.success('تمت الإضافة 📅');
  }

  async function removeBlock(id: string) {
    if (!confirm('متأكدة؟')) return;
    setBusy(id);
    await fetch(`/api/admin/blocked-dates?id=${id}`, { method: 'DELETE' });
    setBlocked(blocked.filter((b) => b.id !== id));
    setBusy(null);
    toast.success('تم الحذف');
  }

  return (
    <div className="space-y-6">
      {/* ساعات العمل */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-5 h-5 text-gold-deep" />
          <h2 className="font-ar-display text-lg font-bold text-gold-deep">ساعات العمل</h2>
        </div>

        <div className="space-y-5">
          {/* SPA */}
          <div className="p-4 rounded-xl border border-cream-200">
            <div className="font-bold text-sm text-ink mb-3">قسم السبا 💆‍♀️</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[10px] text-ink-soft mb-1">يفتح</label>
                <input
                  type="time"
                  value={spa.open_time?.slice(0, 5)}
                  onChange={(e) => setSpa({ ...spa, open_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-cream-50 text-sm font-en-display"
                />
              </div>
              <div>
                <label className="block text-[10px] text-ink-soft mb-1">يغلق</label>
                <input
                  type="time"
                  value={spa.close_time?.slice(0, 5)}
                  onChange={(e) => setSpa({ ...spa, close_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-cream-50 text-sm font-en-display"
                />
              </div>
            </div>
            <input
              type="text"
              value={spa.note || ''}
              onChange={(e) => setSpa({ ...spa, note: e.target.value })}
              placeholder="ملاحظة (مثل: 7 أيام في الأسبوع)"
              className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-cream-50 text-xs"
            />
          </div>

          {/* SALON */}
          <div className="p-4 rounded-xl border border-cream-200">
            <div className="font-bold text-sm text-ink mb-3">قسم الصالون 💇‍♀️</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[10px] text-ink-soft mb-1">يفتح</label>
                <input
                  type="time"
                  value={salon.open_time?.slice(0, 5)}
                  onChange={(e) => setSalon({ ...salon, open_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-cream-50 text-sm font-en-display"
                />
              </div>
              <div>
                <label className="block text-[10px] text-ink-soft mb-1">يغلق</label>
                <input
                  type="time"
                  value={salon.close_time?.slice(0, 5)}
                  onChange={(e) => setSalon({ ...salon, close_time: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-cream-50 text-sm font-en-display"
                />
              </div>
            </div>
            <input
              type="text"
              value={salon.note || ''}
              onChange={(e) => setSalon({ ...salon, note: e.target.value })}
              placeholder="ملاحظة"
              className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-cream-50 text-xs"
            />
          </div>

          <button
            onClick={saveHours}
            disabled={busy === 'hours'}
            className="btn-primary w-full !py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy === 'hours' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ ساعات العمل
          </button>
        </div>
      </div>

      {/* أيام العطل */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200">
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-5 h-5 text-gold-deep" />
          <h2 className="font-ar-display text-lg font-bold text-gold-deep">أيام العطل والإغلاق</h2>
        </div>

        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-4">
          <input
            type="date"
            value={newBlock.date}
            onChange={(e) => setNewBlock({ ...newBlock, date: e.target.value })}
            className="px-3 py-2 rounded-lg border border-cream-200 bg-cream-50 text-sm font-en-display"
          />
          <input
            type="text"
            value={newBlock.reason}
            onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })}
            placeholder="السبب (مثل: عيد الفطر)"
            className="px-3 py-2 rounded-lg border border-cream-200 bg-cream-50 text-sm"
          />
          <button
            onClick={addBlock}
            disabled={busy === 'add-block'}
            className="btn-primary !py-2 !px-4 text-sm"
          >
            {busy === 'add-block' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {blocked.length === 0 ? (
          <div className="text-center py-6 text-xs text-ink-soft">
            لا توجد أيام إغلاق مُسجَّلة
          </div>
        ) : (
          <ul className="space-y-2">
            {blocked.map((b) => (
              <li key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-cream-50">
                <div>
                  <div className="font-bold text-sm text-ink font-en-display">{b.date}</div>
                  {b.reason && <div className="text-xs text-ink-soft">{b.reason}</div>}
                </div>
                <button
                  onClick={() => removeBlock(b.id)}
                  disabled={busy === b.id}
                  className="p-1.5 hover:bg-danger/10 rounded text-danger"
                >
                  {busy === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
