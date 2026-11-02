'use client';

/**
 * BeautyProfileForm — نموذج ملف الجمال
 */
import { useState } from 'react';
import { toast } from 'sonner';
import {
  Save, Loader2, Droplets, Scissors, AlertTriangle, Heart,
  Sparkles, Baby, CheckCircle2, X,
} from 'lucide-react';

interface Profile {
  skin_type?: 'normal' | 'dry' | 'oily' | 'combo' | 'sensitive';
  hair_type?: 'straight' | 'wavy' | 'curly' | 'coily';
  hair_treated?: boolean;
  allergies?: string[];
  medical_notes?: string;
  pregnancy_status?: 'none' | 'pregnant' | 'nursing';
  favorite_fragrances?: string[];
  skin_concerns?: string[];
}

const SKIN_TYPES = [
  { value: 'normal', label: 'عاديّة', emoji: '✨' },
  { value: 'dry', label: 'جافّة', emoji: '🏜️' },
  { value: 'oily', label: 'دهنيّة', emoji: '💧' },
  { value: 'combo', label: 'مختلطة', emoji: '🌗' },
  { value: 'sensitive', label: 'حسّاسة', emoji: '🌸' },
];

const HAIR_TYPES = [
  { value: 'straight', label: 'مفرود' },
  { value: 'wavy', label: 'متموّج' },
  { value: 'curly', label: 'مجعّد' },
  { value: 'coily', label: 'مجعّد كثيف' },
];

const SKIN_CONCERNS = [
  'حبّ الشباب', 'تصبّغات', 'جفاف', 'التجاعيد',
  'الهالات السوداء', 'الاحمرار', 'المسام الواسعة', 'حسّاسيّة',
];

const COMMON_ALLERGIES = [
  'المكسّرات', 'الفول السوداني', 'الحنّاء', 'الصبغات',
  'العطور الكحوليّة', 'اللاتكس', 'بعض الزيوت',
];

export default function BeautyProfileForm({ initial }: { initial: Profile }) {
  const [data, setData] = useState<Profile>(initial);
  const [saving, setSaving] = useState(false);
  const [allergyInput, setAllergyInput] = useState('');
  const [fragranceInput, setFragranceInput] = useState('');

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/account/beauty-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const r = await res.json();
      if (!res.ok) {
        toast.error(r.error || 'فشل الحفظ');
      } else {
        toast.success('✅ تم الحفظ');
      }
    } finally { setSaving(false); }
  }

  function toggleConcern(c: string) {
    const current = data.skin_concerns || [];
    setData({
      ...data,
      skin_concerns: current.includes(c)
        ? current.filter((x) => x !== c)
        : [...current, c],
    });
  }

  function addAllergy(a: string) {
    const trimmed = a.trim();
    if (!trimmed) return;
    const current = data.allergies || [];
    if (current.includes(trimmed)) return;
    setData({ ...data, allergies: [...current, trimmed] });
    setAllergyInput('');
  }

  function removeAllergy(a: string) {
    setData({ ...data, allergies: (data.allergies || []).filter((x) => x !== a) });
  }

  function addFragrance(f: string) {
    const trimmed = f.trim();
    if (!trimmed) return;
    const current = data.favorite_fragrances || [];
    if (current.includes(trimmed)) return;
    setData({ ...data, favorite_fragrances: [...current, trimmed] });
    setFragranceInput('');
  }

  return (
    <div className="space-y-5">

      {/* نوع البشرة */}
      <Section icon={Droplets} title="نوع البشرة" color="blue">
        <div className="grid grid-cols-5 gap-2">
          {SKIN_TYPES.map((s) => (
            <button
              key={s.value}
              onClick={() => setData({ ...data, skin_type: s.value as any })}
              className={`py-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                data.skin_type === s.value
                  ? 'bg-blue-50 border-blue-500 text-blue-900'
                  : 'bg-white border-stone-200 text-stone-600 hover:border-blue-200'
              }`}
            >
              <span className="text-xl">{s.emoji}</span>
              <span className="text-[10px] font-bold">{s.label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* نوع الشعر */}
      <Section icon={Scissors} title="نوع الشعر" color="purple">
        <div className="grid grid-cols-4 gap-2 mb-3">
          {HAIR_TYPES.map((h) => (
            <button
              key={h.value}
              onClick={() => setData({ ...data, hair_type: h.value as any })}
              className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                data.hair_type === h.value
                  ? 'bg-purple-50 border-purple-500 text-purple-900'
                  : 'bg-white border-stone-200 text-stone-600 hover:border-purple-200'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-stone-700">
          <input
            type="checkbox"
            checked={!!data.hair_treated}
            onChange={(e) => setData({ ...data, hair_treated: e.target.checked })}
            className="w-4 h-4 accent-purple-600"
          />
          شعري معالَج (صبغة · كيراتين · برتين · إلخ)
        </label>
      </Section>

      {/* اهتمامات البشرة */}
      <Section icon={Sparkles} title="ما تودّين معالجته؟" color="rose">
        <div className="flex flex-wrap gap-2">
          {SKIN_CONCERNS.map((c) => (
            <button
              key={c}
              onClick={() => toggleConcern(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                (data.skin_concerns || []).includes(c)
                  ? 'bg-rose-50 border-rose-500 text-rose-800'
                  : 'bg-white border-stone-200 text-stone-600 hover:border-rose-200'
              }`}
            >
              {(data.skin_concerns || []).includes(c) && (
                <CheckCircle2 className="w-3 h-3 inline ml-1" />
              )}
              {c}
            </button>
          ))}
        </div>
      </Section>

      {/* الحساسيّات */}
      <Section icon={AlertTriangle} title="الحساسيّات" color="amber" important>
        <div className="flex flex-wrap gap-2 mb-3">
          {(data.allergies || []).map((a) => (
            <span key={a} className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 text-amber-900 rounded-full text-xs font-bold">
              {a}
              <button onClick={() => removeAllergy(a)} className="hover:text-rose-600">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={allergyInput}
            onChange={(e) => setAllergyInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(allergyInput); } }}
            placeholder="أضيفي حسّاسيّة..."
            className="flex-1 px-3 py-2 rounded-lg border border-amber-200 text-sm focus:border-amber-400 outline-none"
          />
          <button
            onClick={() => addAllergy(allergyInput)}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600"
          >
            أضيفي
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] text-stone-500 ml-2">شائعة:</span>
          {COMMON_ALLERGIES.filter((a) => !(data.allergies || []).includes(a)).map((a) => (
            <button
              key={a}
              onClick={() => addAllergy(a)}
              className="text-[10px] px-2 py-0.5 bg-stone-100 text-stone-600 rounded-full hover:bg-amber-100 hover:text-amber-900"
            >
              + {a}
            </button>
          ))}
        </div>
      </Section>

      {/* الحمل والرضاعة */}
      <Section icon={Baby} title="الحالة" color="pink">
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'none', label: 'لا شيء' },
            { value: 'pregnant', label: 'حامل' },
            { value: 'nursing', label: 'مُرضع' },
          ].map((p) => (
            <button
              key={p.value}
              onClick={() => setData({ ...data, pregnancy_status: p.value as any })}
              className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                data.pregnancy_status === p.value
                  ? 'bg-pink-50 border-pink-500 text-pink-900'
                  : 'bg-white border-stone-200 text-stone-600 hover:border-pink-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-stone-500 mt-2">
          مهم للحامل · بعض الخدمات تُجنّب أو تُعدّل خلال الحمل والرضاعة
        </p>
      </Section>

      {/* العطور المفضّلة */}
      <Section icon={Heart} title="العطور المفضّلة" color="rose">
        <div className="flex flex-wrap gap-2 mb-3">
          {(data.favorite_fragrances || []).map((f) => (
            <span key={f} className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-100 text-rose-900 rounded-full text-xs font-bold">
              {f}
              <button
                onClick={() => setData({
                  ...data,
                  favorite_fragrances: (data.favorite_fragrances || []).filter((x) => x !== f),
                })}
                className="hover:text-rose-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={fragranceInput}
            onChange={(e) => setFragranceInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFragrance(fragranceInput); } }}
            placeholder="عود · ورد · مسك..."
            className="flex-1 px-3 py-2 rounded-lg border border-rose-200 text-sm focus:border-rose-400 outline-none"
          />
          <button
            onClick={() => addFragrance(fragranceInput)}
            className="px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-bold hover:bg-rose-600"
          >
            أضيفي
          </button>
        </div>
      </Section>

      {/* ملاحظات طبيّة · خاصّة */}
      <Section icon={AlertTriangle} title="ملاحظات طبيّة (اختياري · خاصّة)" color="stone">
        <textarea
          rows={3}
          value={data.medical_notes || ''}
          onChange={(e) => setData({ ...data, medical_notes: e.target.value })}
          placeholder="أي حالة طبيّة أو دواء يحتاج يعرفه فريقنا..."
          className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:border-stone-400 outline-none resize-none"
        />
        <p className="text-[10px] text-stone-500 mt-1">
          🔒 تظهر فقط لفريق الصالون المسؤول عن جلستكِ
        </p>
      </Section>

      {/* زر الحفظ */}
      <button
        onClick={save}
        disabled={saving}
        className="w-full py-4 rounded-2xl bg-gradient-to-br from-gold-deep via-ink to-gold-deep text-cream-50 font-ar-display font-bold text-base flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-xl transition-all sticky bottom-4"
      >
        {saving
          ? <><Loader2 className="w-5 h-5 animate-spin" /> جارِ الحفظ...</>
          : <><Save className="w-5 h-5" /> حفظ ملف الجمال</>}
      </button>
    </div>
  );
}

function Section({
  icon: Icon, title, color, important, children,
}: {
  icon: any; title: string;
  color: 'blue' | 'purple' | 'rose' | 'amber' | 'pink' | 'stone';
  important?: boolean;
  children: React.ReactNode;
}) {
  const colors = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    rose: 'text-rose-600',
    amber: 'text-amber-600',
    pink: 'text-pink-600',
    stone: 'text-stone-600',
  };
  return (
    <div className={`bg-white rounded-2xl p-5 border ${important ? 'border-amber-200 bg-amber-50/30' : 'border-stone-100'}`}>
      <h3 className={`flex items-center gap-2 font-bold text-sm mb-3 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
        {title}
      </h3>
      {children}
    </div>
  );
}
