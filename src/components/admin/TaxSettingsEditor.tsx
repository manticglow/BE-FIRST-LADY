/**
 * TaxSettingsEditor — إعدادات الضريبة والفوترة (ZATCA)
 */
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Receipt, Save, Loader2, Info, Check, X } from 'lucide-react';
import { isValidSaudiVATNumber } from '@/lib/zatca';

interface TaxSettings {
  business_name_ar: string;
  business_name_en: string | null;
  commercial_reg: string | null;
  vat_number: string | null;
  address: string | null;
  city: string | null;
  apply_vat: boolean;
  vat_rate: number;
  prices_include_vat: boolean;
  invoice_prefix: string;
}

export default function TaxSettingsEditor() {
  const [form, setForm] = useState<TaxSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/admin/tax-settings')
      .then((r) => r.json())
      .then((data) => {
        setForm(data.settings || {
          business_name_ar: 'Be First Lady',
          business_name_en: '',
          commercial_reg: '',
          vat_number: '',
          address: '',
          city: 'المدينة المنوّرة',
          apply_vat: false,
          vat_rate: 15,
          prices_include_vat: true,
          invoice_prefix: 'INV',
        });
      })
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    if (!form) return;
    setBusy(true);
    const res = await fetch('/api/admin/tax-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(data.error || 'فشل');
      return;
    }
    toast.success('تم حفظ الإعدادات الضريبية 🧾');
  }

  if (loading || !form) {
    return <div className="bg-white rounded-2xl p-8 text-center border border-cream-200"><Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" /></div>;
  }

  const vatValid = !form.vat_number || isValidSaudiVATNumber(form.vat_number);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-cream-200">
      <div className="flex items-center gap-2 mb-5">
        <Receipt className="w-5 h-5 text-gold-deep" />
        <h2 className="font-ar-display text-lg font-bold text-gold-deep">إعدادات الفاتورة الضريبية</h2>
      </div>

      {/* شريط التفعيل */}
      <div className={`rounded-xl p-4 mb-5 flex items-center justify-between gap-3 ${
        form.apply_vat ? 'bg-success/10 border border-success/30' : 'bg-cream-50 border border-cream-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            form.apply_vat ? 'bg-success text-white' : 'bg-cream-200 text-ink-soft'
          }`}>
            {form.apply_vat ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-bold text-sm text-ink">
              {form.apply_vat ? '✓ الضريبة مُفعّلة' : 'الضريبة غير مُفعّلة'}
            </div>
            <div className="text-xs text-ink-soft mt-0.5">
              {form.apply_vat
                ? `VAT ${form.vat_rate}% + QR متوافق مع ZATCA`
                : 'الفواتير بدون ضريبة أو QR رسمي'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setForm({ ...form, apply_vat: !form.apply_vat })}
          className={`w-14 h-7 rounded-full relative transition-colors ${
            form.apply_vat ? 'bg-success' : 'bg-cream-300'
          }`}
        >
          <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all ${
            form.apply_vat ? 'right-0.5' : 'right-7'
          }`} />
        </button>
      </div>

      {/* بيانات المنشأة */}
      <div className="space-y-4">
        <div className="font-bold text-xs text-gold-deep uppercase tracking-wider">بيانات المنشأة</div>

        <F label="اسم المنشأة (عربي) *">
          <input type="text" value={form.business_name_ar} onChange={(e) => setForm({ ...form, business_name_ar: e.target.value })} className="inp" />
        </F>

        <F label="اسم المنشأة (English)">
          <input type="text" value={form.business_name_en || ''} onChange={(e) => setForm({ ...form, business_name_en: e.target.value })} className="inp font-en-display" />
        </F>

        <div className="grid grid-cols-2 gap-3">
          <F label="السجل التجاري">
            <input type="text" value={form.commercial_reg || ''} onChange={(e) => setForm({ ...form, commercial_reg: e.target.value })} className="inp font-en-display" placeholder="4030xxxxxxx" />
          </F>
          <F label={`الرقم الضريبي ${form.apply_vat ? '*' : ''}`}>
            <input
              type="text"
              value={form.vat_number || ''}
              onChange={(e) => setForm({ ...form, vat_number: e.target.value.replace(/\s/g, '') })}
              className={`inp font-en-display ${form.vat_number && !vatValid ? 'border-danger' : ''}`}
              placeholder="300000000000003"
              maxLength={15}
            />
            {form.vat_number && !vatValid && (
              <p className="text-[10px] text-danger mt-1">15 رقم يبدأ وينتهي بـ 3</p>
            )}
          </F>
        </div>

        <F label="العنوان">
          <input type="text" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} className="inp" placeholder="حي الزهراء، شارع ..." />
        </F>

        <F label="المدينة">
          <input type="text" value={form.city || ''} onChange={(e) => setForm({ ...form, city: e.target.value })} className="inp" />
        </F>

        {/* إعدادات الضريبة */}
        {form.apply_vat && (
          <>
            <div className="font-bold text-xs text-gold-deep uppercase tracking-wider pt-4 border-t border-cream-200">إعدادات الضريبة</div>

            <div className="grid grid-cols-2 gap-3">
              <F label="نسبة الضريبة %">
                <input
                  type="number"
                  step="0.01"
                  value={form.vat_rate}
                  onChange={(e) => setForm({ ...form, vat_rate: Number(e.target.value) })}
                  className="inp font-en-display"
                />
              </F>
              <F label="بادئة رقم الفاتورة">
                <input type="text" value={form.invoice_prefix} onChange={(e) => setForm({ ...form, invoice_prefix: e.target.value.toUpperCase() })} className="inp font-en-display" placeholder="INV" />
              </F>
            </div>

            <label className="flex items-start gap-2 text-sm bg-cream-50 p-3 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={form.prices_include_vat}
                onChange={(e) => setForm({ ...form, prices_include_vat: e.target.checked })}
                className="w-4 h-4 accent-gold-deep mt-0.5"
              />
              <div>
                <div className="text-ink">الأسعار المعروضة شاملة الضريبة</div>
                <div className="text-[10px] text-ink-soft mt-0.5">
                  (المعتاد في السعودية — السعر النهائي يُعرض شاملاً VAT)
                </div>
              </div>
            </label>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2 text-xs text-blue-900">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                بعد التفعيل، كل الفواتير الجديدة ستظهر VAT بصيغة ZATCA Phase 1 مع QR رسمي.
                تأكّدي من تسجيل منشأتكِ في <a href="https://zatca.gov.sa" target="_blank" className="font-bold underline">هيئة الزكاة</a> أولاً.
              </div>
            </div>
          </>
        )}

        <button
          onClick={save}
          disabled={busy || (form.apply_vat && !!form.vat_number && !vatValid)}
          className="btn-primary w-full !py-2.5 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ الإعدادات
        </button>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-soft mb-1.5">{label}</label>
      {children}
    </div>
  );
}

if (typeof document !== 'undefined' && !document.getElementById('tax-css')) {
  const el = document.createElement('style');
  el.id = 'tax-css';
  el.textContent = `.inp{width:100%;padding:.625rem .75rem;border-radius:.75rem;border:1px solid #ece1cc;background:#fbf7ef;outline:none;font-size:.875rem;transition:all .15s}.inp:focus{background:#fff;border-color:#c9a96e}.inp.border-danger{border-color:#e05858}`;
  document.head.appendChild(el);
}
