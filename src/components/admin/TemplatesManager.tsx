/**
 * TemplatesManager — إدارة قوالب الرسائل
 * ═══════════════════════════════════════════════════════════
 * - عرض كل القوالب
 * - تحرير النصّ · معاينة · متغيّرات واضحة
 * - تفعيل/تعطيل
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  MessageCircle, Mail, Edit2, Eye, Save, Loader2,
  X, Zap, AlertCircle,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface Template {
  id: string;
  code: string;
  name_ar: string;
  description: string | null;
  channel: 'whatsapp' | 'email' | 'sms';
  body_ar: string;
  body_en: string | null;
  variables: string[] | null;
  is_active: boolean;
  category: string | null;
  updated_at: string;
}

const CATEGORY_LABEL: Record<string, { text: string; color: string }> = {
  booking:   { text: 'الحجوزات',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  reminder:  { text: 'التذكيرات', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  gift:      { text: 'الهدايا',   color: 'bg-rose-50 text-rose-700 border-rose-200' },
  marketing: { text: 'تسويق',     color: 'bg-violet-50 text-violet-700 border-violet-200' },
};

const CHANNEL_ICON: Record<string, typeof MessageCircle> = {
  whatsapp: MessageCircle,
  email: Mail,
  sms: MessageCircle,
};

export default function TemplatesManager() {
  const [items, setItems] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Template | null>(null);
  const [previewing, setPreviewing] = useState<Template | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/templates');
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      toast.error('تعذّر تحميل القوالب');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveTemplate(updates: Partial<Template>) {
    if (!editing) return;
    const res = await fetch('/api/admin/templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editing.id, ...updates }),
    });
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || 'فشل الحفظ');
      return;
    }
    toast.success('تم الحفظ 🌸');
    setEditing(null);
    load();
  }

  async function toggleActive(t: Template) {
    const res = await fetch('/api/admin/templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, is_active: !t.is_active }),
    });
    if (res.ok) {
      toast.success(t.is_active ? 'تم التعطيل' : 'تم التفعيل');
      load();
    }
  }

  // تجميع حسب الفئة
  const groups = items.reduce((acc, t) => {
    const cat = t.category || 'other';
    (acc[cat] ||= []).push(t);
    return acc;
  }, {} as Record<string, Template[]>);

  if (loading) {
    return <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" /></div>;
  }

  return (
    <>
      {/* شرح المتغيّرات */}
      <div className="bg-gradient-to-br from-gold-light/10 to-cream-50 border border-gold-light/30 rounded-2xl p-4 mb-6">
        <div className="flex items-start gap-2 mb-2">
          <Zap className="w-4 h-4 text-gold-deep shrink-0 mt-0.5" />
          <h3 className="font-ar-display font-bold text-gold-deep text-sm">كيف تعدّلين الرسالة؟</h3>
        </div>
        <ul className="text-[11px] text-ink-soft space-y-1 leading-relaxed pr-6">
          <li>• النصّ العربي هو الأساسي · عدّليه كيف ما تحبّين</li>
          <li>• <code className="bg-cream-200 px-1.5 rounded font-en-display text-ink">{'{{customer_name}}'}</code> · يُستبدَل تلقائياً باسم العميلة</li>
          <li>• كل قالب يوضّح لكِ المتغيّرات المتوفّرة له</li>
          <li>• بتلاحظين التغيير فوراً لأوّل رسالة بعد الحفظ</li>
        </ul>
      </div>

      {/* الفئات */}
      <div className="space-y-6">
        {Object.entries(groups).map(([cat, tpls]) => (
          <div key={cat}>
            <h2 className="font-ar-display font-bold text-gold-deep mb-3 flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                CATEGORY_LABEL[cat]?.color || 'bg-cream-100 text-ink border-cream-200'
              }`}>
                {CATEGORY_LABEL[cat]?.text || cat}
              </span>
              <span className="text-xs text-ink-soft font-normal">({tpls.length})</span>
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {tpls.map((t) => <TemplateCard key={t.id} template={t} onEdit={setEditing} onPreview={setPreviewing} onToggle={toggleActive} />)}
            </div>
          </div>
        ))}
      </div>

      {/* Modal التحرير */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        size="lg"
        title={editing?.name_ar}
        subtitle={editing?.description || undefined}
        padded={false}
      >
        {editing && <EditForm template={editing} onSave={saveTemplate} onCancel={() => setEditing(null)} />}
      </Modal>

      {/* Modal المعاينة */}
      <Modal
        open={!!previewing}
        onClose={() => setPreviewing(null)}
        size="md"
        title="معاينة الرسالة"
        subtitle={previewing?.name_ar}
      >
        {previewing && <Preview template={previewing} />}
      </Modal>
    </>
  );
}

function TemplateCard({
  template, onEdit, onPreview, onToggle,
}: {
  template: Template;
  onEdit: (t: Template) => void;
  onPreview: (t: Template) => void;
  onToggle: (t: Template) => void;
}) {
  const Icon = CHANNEL_ICON[template.channel];
  return (
    <div className={`bg-white border rounded-2xl p-4 ${
      template.is_active ? 'border-cream-200' : 'border-rose-200 opacity-70'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-ink truncate">{template.name_ar}</h3>
            <code className="text-[10px] text-ink-soft font-en-display">{template.code}</code>
          </div>
        </div>

        <label className="flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={template.is_active}
            onChange={() => onToggle(template)}
            className="sr-only"
          />
          <div className={`w-9 h-5 rounded-full relative transition-colors ${
            template.is_active ? 'bg-emerald-500' : 'bg-cream-300'
          }`}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all ${
              template.is_active ? 'right-0.5' : 'right-4'
            }`} />
          </div>
        </label>
      </div>

      {template.description && (
        <p className="text-[11px] text-ink-soft mb-3 line-clamp-2">{template.description}</p>
      )}

      <div className="bg-cream-50 rounded-lg p-2.5 text-[11px] text-ink-soft line-clamp-3 mb-3 whitespace-pre-line font-mono">
        {template.body_ar}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPreview(template)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-cream-50 text-ink hover:bg-cream-100 rounded-lg text-xs font-bold"
        >
          <Eye className="w-3 h-3" />
          معاينة
        </button>
        <button
          onClick={() => onEdit(template)}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gold-deep text-cream-50 rounded-lg text-xs font-bold hover:bg-ink"
        >
          <Edit2 className="w-3 h-3" />
          تحرير
        </button>
      </div>
    </div>
  );
}

function EditForm({
  template, onSave, onCancel,
}: {
  template: Template;
  onSave: (updates: Partial<Template>) => Promise<void>;
  onCancel: () => void;
}) {
  const [bodyAr, setBodyAr] = useState(template.body_ar);
  const [busy, setBusy] = useState(false);

  const vars = template.variables || [];

  async function save() {
    if (bodyAr.trim().length < 10) return toast.error('النصّ قصير جداً');
    setBusy(true);
    await onSave({ body_ar: bodyAr });
    setBusy(false);
  }

  function insertVar(name: string) {
    const token = `{{${name}}}`;
    setBodyAr((b) => b + token);
  }

  return (
    <div className="p-5 space-y-4">
      {/* المتغيّرات المتوفّرة */}
      {vars.length > 0 && (
        <div>
          <label className="block text-xs font-bold text-gold-deep mb-1.5">
            المتغيّرات المتاحة · اضغطي لإضافتها
          </label>
          <div className="flex flex-wrap gap-1.5">
            {vars.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insertVar(v)}
                className="text-[11px] px-2 py-1 bg-gold-light/15 text-gold-deep hover:bg-gold-light/30 rounded-md font-en-display"
              >
                {`{{${v}}}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* النصّ */}
      <div>
        <label className="block text-xs font-bold text-ink mb-1.5">
          نصّ الرسالة (العربي)
        </label>
        <textarea
          rows={10}
          value={bodyAr}
          onChange={(e) => setBodyAr(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm font-mono resize-none focus:bg-white focus:border-gold"
        />
        <div className="text-[10px] text-ink-soft mt-1 font-en-display text-left">
          {bodyAr.length} حرف
        </div>
      </div>

      {/* ملاحظة */}
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-[11px] text-amber-800 leading-relaxed">
          الواتساب يحتاج قوالب موافق عليها من Meta للرسائل المبدوءة من الصالون.
          هذا القالب المحرّر يُستخدَم عندما تكون العميلة ضمن نافذة الـ24 ساعة من المحادثة.
          لتعديل قوالب Meta الرسميّة · افتحي Meta Business Suite.
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-cream-100">
        <button onClick={onCancel} className="btn-outline !py-2 flex-1 text-sm">إلغاء</button>
        <button onClick={save} disabled={busy} className="btn-primary !py-2 flex-1 text-sm disabled:opacity-50 flex items-center justify-center gap-1">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ
        </button>
      </div>
    </div>
  );
}

function Preview({ template }: { template: Template }) {
  // قيم تجريبيّة
  const sampleVars: Record<string, string> = {
    customer_name: 'سارة',
    booking_date: 'الاثنين 5 نوفمبر 2026',
    booking_time: '15:00',
    services: 'مساج استرخاء · فيشل بريميوم',
    total: '450.00',
    booking_number: 'BK-123456',
    address: 'المدينة المنوّرة · شارع الملك فهد',
    recipient_name: 'نورة',
    sender_name: 'أختكِ منى',
    gift_code: 'GC-ABC123',
    amount: '300',
    expires_at: '31/12/2026',
    message: 'هديّة من قلبي · أحبّكِ',
    coupon_code: 'BDAY20',
    discount: '20',
    valid_days: '7',
  };

  const preview = template.body_ar.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_m, key) => sampleVars[key] || `{{${key}}}`);

  return (
    <div className="space-y-3">
      <div className="text-[10px] text-ink-soft">
        بالقيم التجريبيّة التالية:
      </div>
      <div className="bg-[#DCF8C6] rounded-2xl p-4 relative shadow-sm max-w-md mx-auto">
        {/* الذيل */}
        <div className="absolute -right-2 top-3 w-3 h-3 bg-[#DCF8C6] transform rotate-45" />
        <pre className="text-sm text-ink whitespace-pre-wrap font-sans leading-relaxed" dir="rtl">
          {preview}
        </pre>
        <div className="text-[9px] text-right text-ink-soft mt-2 font-en-display">
          00:00 ✓✓
        </div>
      </div>
      <div className="text-[10px] text-ink-soft text-center">
        هذي معاينة تقريبيّة لشكل الرسالة في واتساب
      </div>
    </div>
  );
}
