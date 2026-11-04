/**
 * ThemesManager — إدارة الثيمات الموسميّة
 * - عرض كل الثيمات كبطاقات
 * - تفعيل بنقرة واحدة · يلغي النشط الحالي تلقائياً
 * - معاينة الألوان والزخارف
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Palette, Check, Calendar, Sparkles, Loader2, Edit2,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface Theme {
  id: string;
  code: string;
  name_ar: string;
  name_en: string | null;
  description: string | null;
  primary_color: string;
  accent_color: string;
  badge_text: string | null;
  badge_emoji: string | null;
  decoration: string | null;
  is_active: boolean;
  auto_start_date: string | null;
  auto_end_date: string | null;
}

const DECORATION_LABEL: Record<string, string> = {
  'palms-swords':   '🇸🇦 نخيل وسيوف',
  'lanterns':       '🏮 فوانيس',
  'hearts':         '💕 قلوب',
  'stars-crescent': '⭐ نجوم وهلال',
  'palms-stars':    '🌴 نخيل ونجوم',
  'confetti':       '🎉 قصاصات',
  'snowflakes':     '❄️ ثلج',
  'lotus':          '🌸 لوتس',
};

export default function ThemesManager() {
  const [items, setItems] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Theme | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/themes');
      const data = await res.json();
      setItems(data.items || []);
    } catch { toast.error('تعذّر تحميل الثيمات'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(theme: Theme) {
    setBusyId(theme.id);
    const res = await fetch('/api/admin/themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: theme.id, is_active: !theme.is_active }),
    });
    setBusyId(null);
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || 'فشل');
      return;
    }
    toast.success(theme.is_active ? 'تمّ إلغاء التفعيل' : `🎨 الثيم "${theme.name_ar}" مُفعّل الآن`);
    load();
  }

  if (loading) {
    return <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" /></div>;
  }

  const activeTheme = items.find((t) => t.is_active);

  return (
    <>
      {/* ملخّص الحالة */}
      <div className={`mb-5 p-4 rounded-2xl border ${
        activeTheme ? 'bg-gradient-to-br from-gold-light/10 to-cream-50 border-gold-light/40' : 'bg-cream-50 border-cream-200'
      }`}>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
            style={{ background: `linear-gradient(135deg, ${activeTheme?.primary_color || '#7d613b'}, ${activeTheme?.accent_color || '#d4b062'})` }}
          >
            {activeTheme?.badge_emoji || '🎨'}
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-en-label tracking-wider text-gold-light">ACTIVE THEME</div>
            <div className="font-ar-display font-bold text-lg text-gold-deep">
              {activeTheme ? activeTheme.name_ar : 'الذهبي الفاخر (افتراضي)'}
            </div>
            {activeTheme?.description && (
              <div className="text-xs text-ink-soft mt-0.5">{activeTheme.description}</div>
            )}
          </div>
        </div>
      </div>

      {/* شبكة الثيمات */}
      <div className="grid md:grid-cols-2 gap-4">
        {items.map((t) => (
          <ThemeCard
            key={t.id}
            theme={t}
            busy={busyId === t.id}
            onToggle={() => toggleActive(t)}
            onEdit={() => setEditing(t)}
          />
        ))}
      </div>

      {/* شرح */}
      <div className="mt-6 bg-gradient-to-br from-blue-50 to-cream-50 border border-blue-200 rounded-2xl p-4">
        <div className="flex items-start gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <h3 className="font-ar-display font-bold text-blue-900 text-sm">كيف تشتغل الثيمات؟</h3>
        </div>
        <ul className="text-[11px] text-ink-soft space-y-1 leading-relaxed pr-6">
          <li>• <strong>ثيم واحد فقط نشط</strong> في كل مرّة · لمّا تفعّلي ثيم جديد · القديم يتعطّل تلقائياً</li>
          <li>• الثيم يظهر لكل الزوّار خلال 5 دقائق (cache)</li>
          <li>• الثيم يضيف: <strong>شارة علويّة</strong> (badge) + <strong>زخارف متحرّكة</strong> + <strong>ألوان خاصّة</strong></li>
          <li>• <strong>الجدولة التلقائيّة:</strong> لو عبّيتي تواريخ auto_start/end · الثيم يتفعّل تلقائياً في نفس الأيّام كل سنة</li>
          <li>• ثيم "الذهبي الفاخر" = الوضع العادي (ما يعرض badge ولا زخارف)</li>
        </ul>
      </div>

      {/* Modal التحرير */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        size="md"
        title={editing ? `تعديل: ${editing.name_ar}` : ''}
        padded={false}
      >
        {editing && <ThemeEditForm theme={editing} onSave={async (updates) => {
          const res = await fetch('/api/admin/themes', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editing.id, ...updates }),
          });
          if (!res.ok) {
            const d = await res.json();
            toast.error(d.error || 'فشل');
            return;
          }
          toast.success('تمّ الحفظ 🌸');
          setEditing(null);
          load();
        }} onCancel={() => setEditing(null)} />}
      </Modal>
    </>
  );
}

function ThemeCard({
  theme, busy, onToggle, onEdit,
}: {
  theme: Theme;
  busy: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  return (
    <div className={`bg-white border-2 rounded-2xl overflow-hidden transition-all ${
      theme.is_active ? 'border-gold-deep shadow-lg shadow-gold-deep/10' : 'border-cream-200'
    }`}>
      {/* المعاينة البصريّة */}
      <div
        className="relative aspect-[16/9] overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${theme.primary_color}, ${theme.accent_color})` }}
      >
        {/* badge */}
        {theme.badge_text && (
          <div className="absolute top-0 inset-x-0 py-1.5 px-2 text-center bg-black/30 backdrop-blur-sm text-white text-xs font-bold flex items-center justify-center gap-1">
            {theme.badge_emoji && <span>{theme.badge_emoji}</span>}
            <span className="font-ar-display">{theme.badge_text}</span>
          </div>
        )}

        {/* اسم الثيم كبير */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <div className="text-4xl mb-1">{theme.badge_emoji || '🎨'}</div>
          <div className="font-ar-display font-bold text-xl drop-shadow-lg">{theme.name_ar}</div>
          {theme.name_en && (
            <div className="font-en-label text-[9px] tracking-widest opacity-90 mt-1">{theme.name_en}</div>
          )}
        </div>

        {/* active indicator */}
        {theme.is_active && (
          <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
            <Check className="w-3 h-3" />
            نشط
          </div>
        )}
      </div>

      {/* التفاصيل */}
      <div className="p-3.5">
        {theme.description && (
          <p className="text-[11px] text-ink-soft mb-3 line-clamp-2">{theme.description}</p>
        )}

        {/* الألوان */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1 text-[10px] text-ink-soft">
            <div className="w-5 h-5 rounded-full border border-cream-200" style={{ background: theme.primary_color }} />
            <code className="font-en-display">{theme.primary_color}</code>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-ink-soft">
            <div className="w-5 h-5 rounded-full border border-cream-200" style={{ background: theme.accent_color }} />
            <code className="font-en-display">{theme.accent_color}</code>
          </div>
        </div>

        {/* الزخرفة */}
        {theme.decoration && (
          <div className="text-[11px] text-ink-soft mb-3 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-gold-light" />
            <span>زخرفة: <strong>{DECORATION_LABEL[theme.decoration] || theme.decoration}</strong></span>
          </div>
        )}

        {/* الجدولة */}
        {(theme.auto_start_date || theme.auto_end_date) && (
          <div className="text-[11px] text-ink-soft mb-3 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-gold-light" />
            <span>
              يتفعّل تلقائياً: <strong className="font-en-display">{theme.auto_start_date}</strong>
              {' ← '}
              <strong className="font-en-display">{theme.auto_end_date}</strong>
            </span>
          </div>
        )}

        {/* أزرار */}
        <div className="flex items-center gap-2 pt-3 border-t border-cream-100">
          <button
            onClick={onToggle}
            disabled={busy}
            className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50 ${
              theme.is_active
                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                : 'bg-gold-deep text-cream-50 hover:bg-ink'
            }`}
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : (
              theme.is_active ? <>إلغاء التفعيل</> : <><Palette className="w-3 h-3" />فعّلي الآن</>
            )}
          </button>
          <button
            onClick={onEdit}
            className="px-3 py-2 bg-cream-100 hover:bg-cream-200 text-ink rounded-lg text-xs font-bold"
            title="تعديل"
          >
            <Edit2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ThemeEditForm({
  theme, onSave, onCancel,
}: {
  theme: Theme;
  onSave: (updates: Partial<Theme>) => Promise<void>;
  onCancel: () => void;
}) {
  const [data, setData] = useState({
    name_ar: theme.name_ar,
    badge_text: theme.badge_text || '',
    badge_emoji: theme.badge_emoji || '',
    primary_color: theme.primary_color,
    accent_color: theme.accent_color,
    auto_start_date: theme.auto_start_date || '',
    auto_end_date: theme.auto_end_date || '',
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await onSave({
      ...data,
      badge_text: data.badge_text || null,
      badge_emoji: data.badge_emoji || null,
      auto_start_date: data.auto_start_date || null,
      auto_end_date: data.auto_end_date || null,
    });
    setBusy(false);
  }

  return (
    <div className="p-5 space-y-3 max-h-[75vh] overflow-y-auto">
      {/* معاينة */}
      <div
        className="aspect-[16/9] rounded-xl overflow-hidden flex flex-col items-center justify-center text-white"
        style={{ background: `linear-gradient(135deg, ${data.primary_color}, ${data.accent_color})` }}
      >
        <div className="text-4xl mb-1">{data.badge_emoji}</div>
        <div className="font-ar-display font-bold text-xl drop-shadow">{data.name_ar}</div>
        {data.badge_text && (
          <div className="mt-2 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full text-xs">
            {data.badge_text}
          </div>
        )}
      </div>

      <Field label="الاسم بالعربي" value={data.name_ar} onChange={(v) => setData({ ...data, name_ar: v })} />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5">نصّ الشارة</label>
          <input
            type="text"
            value={data.badge_text}
            onChange={(e) => setData({ ...data, badge_text: e.target.value })}
            placeholder="مثل: اليوم الوطني"
            className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5">الـemoji</label>
          <input
            type="text"
            value={data.badge_emoji}
            onChange={(e) => setData({ ...data, badge_emoji: e.target.value })}
            placeholder="🇸🇦"
            maxLength={5}
            className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-lg text-center"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5">اللون الأساسي</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={data.primary_color}
              onChange={(e) => setData({ ...data, primary_color: e.target.value })}
              className="w-12 h-10 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={data.primary_color}
              onChange={(e) => setData({ ...data, primary_color: e.target.value })}
              className="flex-1 px-2 py-2 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm font-en-display uppercase"
              dir="ltr"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5">اللون الثانوي</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={data.accent_color}
              onChange={(e) => setData({ ...data, accent_color: e.target.value })}
              className="w-12 h-10 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={data.accent_color}
              onChange={(e) => setData({ ...data, accent_color: e.target.value })}
              className="flex-1 px-2 py-2 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm font-en-display uppercase"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* الجدولة */}
      <div className="border-t border-cream-100 pt-3">
        <label className="block text-xs font-bold text-gold-deep mb-2 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          الجدولة التلقائيّة (اختياري)
        </label>
        <p className="text-[10px] text-ink-soft mb-2">
          بصيغة MM-DD (شهر-يوم) · يتفعّل في نفس الأيّام كل سنة
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] text-ink-soft mb-1">يبدأ</label>
            <input
              type="text"
              value={data.auto_start_date}
              onChange={(e) => setData({ ...data, auto_start_date: e.target.value })}
              placeholder="09-20"
              className="w-full px-3 py-2 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm font-en-display"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-[10px] text-ink-soft mb-1">ينتهي</label>
            <input
              type="text"
              value={data.auto_end_date}
              onChange={(e) => setData({ ...data, auto_end_date: e.target.value })}
              placeholder="09-25"
              className="w-full px-3 py-2 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm font-en-display"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-cream-100">
        <button onClick={onCancel} className="btn-outline !py-2 flex-1 text-sm">إلغاء</button>
        <button onClick={save} disabled={busy} className="btn-primary !py-2 flex-1 text-sm disabled:opacity-50 flex items-center justify-center gap-1">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          حفظ
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-bold text-ink mb-1.5">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm"
      />
    </div>
  );
}
