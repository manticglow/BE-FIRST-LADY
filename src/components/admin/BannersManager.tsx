/**
 * BannersManager — إدارة بنرات الصفحة الرئيسيّة
 * ═══════════════════════════════════════════════════════════
 * - عرض كل البنرات بـthumbnails
 * - إنشاء/تعديل/حذف
 * - 3 أنواع: theme (قوالب جاهزة) · image (صورة) · html (كود)
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Plus, Edit2, Trash2, Loader2, Image as ImageIcon, Code, Palette,
  Eye, EyeOff, Calendar, ArrowUp, ArrowDown,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { BANNER_THEMES, BANNER_SIZES, getThemeById } from '@/lib/banner-themes';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  cta_text: string;
  cta_href: string;
  banner_type: 'theme' | 'image' | 'html';
  theme_id: number | null;
  image_url: string | null;
  image_alt: string | null;
  html_content: string | null;
  display_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

const EMPTY_BANNER: Partial<Banner> = {
  title: '',
  subtitle: '',
  cta_text: 'احجزي الآن',
  cta_href: '/booking',
  banner_type: 'theme',
  theme_id: 1,
  is_active: true,
  display_order: 0,
};

export default function BannersManager() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Banner> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/banners');
      const data = await res.json();
      setItems(data.items || []);
    } catch { toast.error('تعذّر تحميل البنرات'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function save(banner: Partial<Banner>) {
    const isNew = !banner.id;
    const url = '/api/admin/banners';
    const method = isNew ? 'POST' : 'PATCH';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(banner),
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || 'فشل الحفظ');
      return;
    }
    toast.success(isNew ? 'تمّت الإضافة 🌸' : 'تمّ التحديث');
    setEditing(null);
    load();
  }

  async function remove(id: string) {
    if (!confirm('متأكّدة من الحذف؟')) return;
    const res = await fetch(`/api/admin/banners?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('تمّ الحذف');
      load();
    }
  }

  async function toggleActive(b: Banner) {
    await fetch('/api/admin/banners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: b.id, is_active: !b.is_active }),
    });
    load();
  }

  async function reorder(b: Banner, direction: 'up' | 'down') {
    await fetch('/api/admin/banners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: b.id, display_order: b.display_order + (direction === 'up' ? -1 : 1) }),
    });
    load();
  }

  if (loading) {
    return <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" /></div>;
  }

  return (
    <>
      {/* شريط الأدوات */}
      <div className="flex items-center justify-between mb-5">
        <div className="text-sm text-ink-soft">
          <strong className="text-ink">{items.filter((b) => b.is_active).length}</strong> نشطة من أصل <strong className="text-ink">{items.length}</strong>
        </div>
        <button
          onClick={() => setEditing(EMPTY_BANNER)}
          className="flex items-center gap-2 px-4 py-2 bg-gold-deep text-cream-50 rounded-xl text-sm font-bold hover:bg-ink"
        >
          <Plus className="w-4 h-4" />
          بنر جديد
        </button>
      </div>

      {/* شبكة البنرات */}
      {items.length === 0 ? (
        <div className="bg-cream-50 border border-cream-200 rounded-2xl p-12 text-center">
          <ImageIcon className="w-10 h-10 text-cream-300 mx-auto mb-2" />
          <div className="text-sm text-ink-soft">ما فيه بنرات بعد · أضيفي أوّل واحد</div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((b) => <BannerCard key={b.id} banner={b} onEdit={setEditing} onDelete={remove} onToggle={toggleActive} onReorder={reorder} />)}
        </div>
      )}

      {/* Modal التحرير/الإضافة */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        size="lg"
        title={editing?.id ? 'تعديل بنر' : 'بنر جديد'}
        padded={false}
      >
        {editing && <BannerForm banner={editing} onSave={save} onCancel={() => setEditing(null)} />}
      </Modal>
    </>
  );
}

function BannerCard({
  banner: b, onEdit, onDelete, onToggle, onReorder,
}: {
  banner: Banner;
  onEdit: (b: Banner) => void;
  onDelete: (id: string) => void;
  onToggle: (b: Banner) => void;
  onReorder: (b: Banner, dir: 'up' | 'down') => void;
}) {
  const typeInfo = {
    theme: { icon: Palette, label: 'ثيم' },
    image: { icon: ImageIcon, label: 'صورة' },
    html:  { icon: Code, label: 'HTML' },
  }[b.banner_type];
  const Icon = typeInfo.icon;

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden ${b.is_active ? 'border-cream-200' : 'border-rose-200 opacity-70'}`}>
      {/* المعاينة */}
      <div className="relative aspect-[16/9] bg-gradient-to-br from-cream-100 to-amber-50 overflow-hidden">
        <BannerPreview banner={b} />
        <div className="absolute top-2 right-2 flex gap-1">
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm flex items-center gap-1">
            <Icon className="w-3 h-3" />
            {typeInfo.label}
          </span>
        </div>
        <div className="absolute bottom-2 right-2">
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm font-en-display">
            #{b.display_order}
          </span>
        </div>
      </div>

      {/* التفاصيل */}
      <div className="p-3">
        <div className="font-bold text-sm text-ink truncate mb-0.5">{b.title}</div>
        {b.subtitle && <div className="text-[11px] text-ink-soft truncate">{b.subtitle}</div>}

        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-cream-100">
          <button onClick={() => onToggle(b)} className="p-1.5 hover:bg-cream-100 rounded-lg" title={b.is_active ? 'تعطيل' : 'تفعيل'}>
            {b.is_active ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-rose-600" />}
          </button>
          <button onClick={() => onReorder(b, 'up')} className="p-1.5 hover:bg-cream-100 rounded-lg">
            <ArrowUp className="w-3.5 h-3.5 text-ink-soft" />
          </button>
          <button onClick={() => onReorder(b, 'down')} className="p-1.5 hover:bg-cream-100 rounded-lg">
            <ArrowDown className="w-3.5 h-3.5 text-ink-soft" />
          </button>
          <div className="flex-1" />
          <button onClick={() => onEdit(b)} className="px-2 py-1 bg-cream-100 hover:bg-cream-200 text-ink rounded-lg text-xs font-bold flex items-center gap-1">
            <Edit2 className="w-3 h-3" />
            تحرير
          </button>
          <button onClick={() => onDelete(b.id)} className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg" title="حذف">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function BannerPreview({ banner: b }: { banner: Partial<Banner> }) {
  if (b.banner_type === 'image' && b.image_url) {
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={b.image_url} alt={b.image_alt || ''} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-tl from-ink/60 via-ink/20 to-transparent" />
        <PreviewText b={b} />
      </>
    );
  }
  if (b.banner_type === 'html' && b.html_content) {
    return (
      <div className="absolute inset-0 overflow-hidden" dangerouslySetInnerHTML={{ __html: b.html_content }} />
    );
  }
  // theme
  const theme = getThemeById(b.theme_id);
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={theme.bgImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className={`absolute inset-0 bg-gradient-to-tl ${theme.gradient}`} />
      <PreviewText b={b} />
    </>
  );
}

function PreviewText({ b }: { b: Partial<Banner> }) {
  return (
    <div className="absolute inset-0 p-3 flex flex-col justify-between">
      <div className="text-right">
        <div className="font-ar-display text-sm font-bold text-cream-50 drop-shadow-md line-clamp-2">
          {b.title || 'عنوان البنر'}
        </div>
        {b.subtitle && (
          <div className="text-[10px] text-cream-50/90 drop-shadow mt-0.5 line-clamp-1">{b.subtitle}</div>
        )}
      </div>
      {b.cta_text && (
        <div className="self-start bg-gold-light/90 text-ink text-[10px] font-bold px-2 py-1 rounded-full">
          {b.cta_text}
        </div>
      )}
    </div>
  );
}

function BannerForm({
  banner, onSave, onCancel,
}: {
  banner: Partial<Banner>;
  onSave: (b: Partial<Banner>) => Promise<void>;
  onCancel: () => void;
}) {
  const [b, setB] = useState<Partial<Banner>>(banner);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!b.title || b.title.length < 2) return toast.error('العنوان مطلوب');
    if (b.banner_type === 'image' && !b.image_url) return toast.error('أضيفي رابط صورة');
    if (b.banner_type === 'html' && !b.html_content) return toast.error('أضيفي كود HTML');
    setBusy(true);
    await onSave(b);
    setBusy(false);
  }

  return (
    <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
      {/* المعاينة */}
      <div>
        <label className="block text-xs font-bold text-gold-deep mb-2">معاينة مباشرة</label>
        <div className="relative aspect-[16/9] bg-cream-100 rounded-xl overflow-hidden border border-cream-200">
          <BannerPreview banner={b} />
        </div>
      </div>

      {/* نوع البنر */}
      <div>
        <label className="block text-xs font-bold text-gold-deep mb-2">نوع البنر</label>
        <div className="grid grid-cols-3 gap-2">
          <TypeBtn active={b.banner_type === 'theme'} onClick={() => setB({ ...b, banner_type: 'theme' })} icon={Palette} label="ثيم جاهز" />
          <TypeBtn active={b.banner_type === 'image'} onClick={() => setB({ ...b, banner_type: 'image' })} icon={ImageIcon} label="صورة" />
          <TypeBtn active={b.banner_type === 'html'} onClick={() => setB({ ...b, banner_type: 'html' })} icon={Code} label="HTML" />
        </div>
      </div>

      {/* الثيم */}
      {b.banner_type === 'theme' && (
        <div>
          <label className="block text-xs font-bold text-gold-deep mb-2">اختاري الثيم</label>
          <div className="grid grid-cols-5 gap-2">
            {BANNER_THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setB({ ...b, theme_id: t.id })}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  b.theme_id === t.id ? 'border-gold-deep scale-105' : 'border-cream-200 hover:border-gold-light'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.bgImage} alt={t.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className={`absolute inset-0 bg-gradient-to-tl ${t.gradient}`} />
                <div className="absolute bottom-1 inset-x-1 text-center">
                  <span className="text-[8px] font-bold text-white drop-shadow">{t.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* الصورة */}
      {b.banner_type === 'image' && (
        <>
          <div>
            <label className="block text-xs font-bold text-gold-deep mb-1.5">رابط الصورة</label>
            <input
              type="url"
              value={b.image_url || ''}
              onChange={(e) => setB({ ...b, image_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm font-en-display"
              dir="ltr"
            />
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cream-50 border border-blue-200 rounded-lg p-3 text-[11px]">
            <strong className="text-blue-700">المقاس المُوصى به:</strong>
            <ul className="mt-1 space-y-0.5 text-ink-soft">
              {Object.values(BANNER_SIZES).map((s) => (
                <li key={s.label}>• {s.label}: <strong className="font-en-display text-ink">{s.width} × {s.height}</strong> ({s.ratio})</li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* HTML */}
      {b.banner_type === 'html' && (
        <>
          <div>
            <label className="block text-xs font-bold text-gold-deep mb-1.5">كود HTML</label>
            <textarea
              rows={6}
              value={b.html_content || ''}
              onChange={(e) => setB({ ...b, html_content: e.target.value })}
              placeholder='<div style="background: linear-gradient(...); ...">...</div>'
              className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-xs font-mono resize-none"
              dir="ltr"
            />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800">
            ⚠️ يُعرض داخل container بنسبة <strong className="font-en-display">16:9</strong>. تجنّبي الـscripts الخارجيّة.
          </div>
        </>
      )}

      {/* العناوين */}
      <div className="grid grid-cols-1 gap-3 pt-3 border-t border-cream-100">
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5">العنوان</label>
          <input
            type="text"
            value={b.title || ''}
            onChange={(e) => setB({ ...b, title: e.target.value })}
            placeholder="مثل: خلّي التوتر يذوب"
            className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5">العنوان الفرعي</label>
          <input
            type="text"
            value={b.subtitle || ''}
            onChange={(e) => setB({ ...b, subtitle: e.target.value })}
            placeholder="وصف قصير..."
            className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">نصّ الزرّ</label>
            <input
              type="text"
              value={b.cta_text || ''}
              onChange={(e) => setB({ ...b, cta_text: e.target.value })}
              placeholder="احجزي الآن"
              className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">رابط الزرّ</label>
            <input
              type="text"
              value={b.cta_href || ''}
              onChange={(e) => setB({ ...b, cta_href: e.target.value })}
              placeholder="/booking"
              className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm font-en-display"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* الجدول الزمني */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-cream-100">
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            يبدأ (اختياري)
          </label>
          <input
            type="datetime-local"
            value={b.starts_at ? b.starts_at.slice(0, 16) : ''}
            onChange={(e) => setB({ ...b, starts_at: e.target.value || null })}
            className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm font-en-display"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            ينتهي (اختياري)
          </label>
          <input
            type="datetime-local"
            value={b.ends_at ? b.ends_at.slice(0, 16) : ''}
            onChange={(e) => setB({ ...b, ends_at: e.target.value || null })}
            className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm font-en-display"
          />
        </div>
      </div>

      {/* أزرار */}
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

function TypeBtn({
  active, onClick, icon: Icon, label,
}: {
  active: boolean; onClick: () => void; icon: typeof Palette; label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${
        active ? 'bg-gold-deep text-cream-50 border-gold-deep' : 'bg-white border-cream-200 text-ink hover:border-gold-light'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-xs font-bold">{label}</span>
    </button>
  );
}
