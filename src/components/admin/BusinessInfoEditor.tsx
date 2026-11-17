/**
 * BusinessInfoEditor — إدارة بيانات المنشأة الرسميّة
 * ═══════════════════════════════════════════════════════════
 * - الاسم والسجل التجاري
 * - العنوان الوطني
 * - بيانات التواصل
 * - حسابات السوشيال ميديا
 * - الرقم الضريبي وإعدادات VAT
 */
'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Building2, MapPin, Phone, Mail, Globe, Instagram,
  Save, Loader2, Hash, MessageCircle, Receipt, Youtube,
} from 'lucide-react';
import { isValidSaudiVATNumber } from '@/lib/zatca';

interface BusinessInfo {
  // الهويّة
  business_name_ar: string;
  business_name_en: string | null;
  commercial_reg: string | null;
  vat_number: string | null;
  // العنوان
  address: string | null;
  city: string | null;
  national_address_short: string | null;
  building_number: string | null;
  street_name: string | null;
  district: string | null;
  secondary_number: string | null;
  postal_code: string | null;
  // التواصل
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  // السوشيال
  instagram: string | null;
  snapchat: string | null;
  tiktok: string | null;
  twitter: string | null;
  facebook: string | null;
  youtube: string | null;
  google_maps: string | null;
  // الضريبة
  apply_vat: boolean;
  vat_rate: number;
  prices_include_vat: boolean;
  invoice_prefix: string;
}

type Tab = 'identity' | 'address' | 'contact' | 'social' | 'tax';

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'identity', label: 'الهويّة', icon: Building2 },
  { id: 'address', label: 'العنوان', icon: MapPin },
  { id: 'contact', label: 'التواصل', icon: Phone },
  { id: 'social', label: 'السوشيال ميديا', icon: Instagram },
  { id: 'tax', label: 'الضريبة والفواتير', icon: Receipt },
];

export default function BusinessInfoEditor() {
  const [form, setForm] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('identity');

  useEffect(() => {
    fetch('/api/admin/tax-settings')
      .then((r) => r.json())
      .then((data) => {
        setForm(data.settings || defaultForm());
      })
      .finally(() => setLoading(false));
  }, []);

  function defaultForm(): BusinessInfo {
    return {
      business_name_ar: 'مشغل السيدة الأولى',
      business_name_en: 'alSayyida alOula Salon',
      commercial_reg: '7013767020',
      vat_number: '',
      address: '',
      city: 'المدينة المنوّرة',
      national_address_short: '',
      building_number: '',
      street_name: '',
      district: '',
      secondary_number: '',
      postal_code: '',
      phone: '',
      whatsapp: '',
      email: '',
      website: '',
      instagram: '',
      snapchat: '',
      tiktok: '',
      twitter: '',
      facebook: '',
      youtube: '',
      google_maps: '',
      apply_vat: false,
      vat_rate: 15,
      prices_include_vat: true,
      invoice_prefix: 'TFL',
    };
  }

  async function save() {
    if (!form) return;

    // تحقّق من الرقم الضريبي
    if (form.apply_vat && form.vat_number && !isValidSaudiVATNumber(form.vat_number)) {
      toast.error('الرقم الضريبي غير صحيح · 15 رقم يبدأ وينتهي بـ 3');
      return;
    }

    setBusy(true);
    const res = await fetch('/api/admin/tax-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      toast.error(data.error || 'فشل الحفظ');
      return;
    }
    toast.success('تمّ حفظ بيانات المنشأة ✓');
  }

  if (loading || !form) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-cream-200">
        <Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" />
      </div>
    );
  }

  const update = <K extends keyof BusinessInfo>(key: K, value: BusinessInfo[K]) => {
    setForm({ ...form, [key]: value });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-cream-200 overflow-hidden">
      {/* الهيدر */}
      <div className="px-5 py-4 border-b border-cream-200 bg-cream-50/50">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gold-deep" />
            <h2 className="font-ar-display text-lg font-bold text-gold-deep">
              بيانات المنشأة
            </h2>
          </div>
          <button
            onClick={save}
            disabled={busy}
            className="bg-gold-deep text-cream-50 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gold-dark disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            حفظ
          </button>
        </div>
      </div>

      {/* التبويبات */}
      <div className="border-b border-cream-200 bg-white overflow-x-auto">
        <div className="flex min-w-max">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? 'border-gold-deep text-gold-deep bg-cream-50'
                    : 'border-transparent text-ink-soft hover:text-gold-deep'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* المحتوى */}
      <div className="p-5 md:p-6 space-y-4">
        {/* ═══ 1. الهويّة ═══ */}
        {tab === 'identity' && (
          <>
            <Field
              label="الاسم العربي الرسمي"
              value={form.business_name_ar}
              onChange={(v) => update('business_name_ar', v)}
              hint="من السجل التجاري"
            />
            <Field
              label="الاسم بالإنجليزيّة"
              value={form.business_name_en || ''}
              onChange={(v) => update('business_name_en', v)}
              dir="ltr"
            />
            <Grid>
              <Field
                label="الرقم الوطني الموحد (س.ت)"
                value={form.commercial_reg || ''}
                onChange={(v) => update('commercial_reg', v)}
                hint="10 أرقام"
                dir="ltr"
              />
              <Field
                label="الرقم الضريبي"
                value={form.vat_number || ''}
                onChange={(v) => update('vat_number', v)}
                hint="15 رقم · من ZATCA"
                dir="ltr"
                placeholder="ينتظر تسجيل VAT"
              />
            </Grid>
          </>
        )}

        {/* ═══ 2. العنوان ═══ */}
        {tab === 'address' && (
          <>
            <Field
              label="العنوان الوطني المختصر"
              value={form.national_address_short || ''}
              onChange={(v) => update('national_address_short', v)}
              hint="4 أحرف + 4 أرقام (مثال DMAC3146)"
              dir="ltr"
            />
            <Grid>
              <Field
                label="رقم المبنى"
                value={form.building_number || ''}
                onChange={(v) => update('building_number', v)}
                dir="ltr"
              />
              <Field
                label="الرقم الفرعي"
                value={form.secondary_number || ''}
                onChange={(v) => update('secondary_number', v)}
                dir="ltr"
              />
            </Grid>
            <Field
              label="اسم الشارع"
              value={form.street_name || ''}
              onChange={(v) => update('street_name', v)}
            />
            <Grid>
              <Field
                label="الحي"
                value={form.district || ''}
                onChange={(v) => update('district', v)}
              />
              <Field
                label="الرمز البريدي"
                value={form.postal_code || ''}
                onChange={(v) => update('postal_code', v)}
                dir="ltr"
              />
            </Grid>
            <Field
              label="المدينة"
              value={form.city || ''}
              onChange={(v) => update('city', v)}
            />
            <Field
              label="العنوان الكامل (يُطبع على الفاتورة)"
              value={form.address || ''}
              onChange={(v) => update('address', v)}
              textarea
            />
            <Field
              label="رابط Google Maps للصالون"
              value={form.google_maps || ''}
              onChange={(v) => update('google_maps', v)}
              dir="ltr"
              placeholder="https://maps.app.goo.gl/..."
              icon={MapPin}
            />
          </>
        )}

        {/* ═══ 3. التواصل ═══ */}
        {tab === 'contact' && (
          <>
            <Grid>
              <Field
                label="رقم الجوّال/الصالون"
                value={form.phone || ''}
                onChange={(v) => update('phone', v)}
                dir="ltr"
                icon={Phone}
                placeholder="05xxxxxxxx"
              />
              <Field
                label="رقم الواتساب"
                value={form.whatsapp || ''}
                onChange={(v) => update('whatsapp', v)}
                dir="ltr"
                icon={MessageCircle}
                hint="نفس الجوّال أو رقم مختلف"
                placeholder="05xxxxxxxx"
              />
            </Grid>
            <Field
              label="الإيميل الرسمي"
              value={form.email || ''}
              onChange={(v) => update('email', v)}
              dir="ltr"
              icon={Mail}
              placeholder="info@thefirstlady.sa"
            />
            <Field
              label="الموقع الإلكتروني"
              value={form.website || ''}
              onChange={(v) => update('website', v)}
              dir="ltr"
              icon={Globe}
              placeholder="https://thefirstlady.sa"
            />
          </>
        )}

        {/* ═══ 4. السوشيال ميديا ═══ */}
        {tab === 'social' && (
          <>
            <Field
              label="Instagram"
              value={form.instagram || ''}
              onChange={(v) => update('instagram', v)}
              dir="ltr"
              icon={Instagram}
              placeholder="@thefirstlady_sa أو رابط كامل"
            />
            <Field
              label="Snapchat"
              value={form.snapchat || ''}
              onChange={(v) => update('snapchat', v)}
              dir="ltr"
              placeholder="username"
            />
            <Field
              label="TikTok"
              value={form.tiktok || ''}
              onChange={(v) => update('tiktok', v)}
              dir="ltr"
              placeholder="@thefirstlady"
            />
            <Field
              label="X (Twitter)"
              value={form.twitter || ''}
              onChange={(v) => update('twitter', v)}
              dir="ltr"
              placeholder="@thefirstlady"
            />
            <Field
              label="Facebook"
              value={form.facebook || ''}
              onChange={(v) => update('facebook', v)}
              dir="ltr"
              placeholder="username أو رابط صفحة"
            />
            <Field
              label="YouTube"
              value={form.youtube || ''}
              onChange={(v) => update('youtube', v)}
              dir="ltr"
              icon={Youtube}
              placeholder="@thefirstlady أو رابط قناة"
            />
          </>
        )}

        {/* ═══ 5. الضريبة والفواتير ═══ */}
        {tab === 'tax' && (
          <>
            <div className={`rounded-xl p-4 flex items-center justify-between gap-3 ${
              form.apply_vat
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-amber-50 border border-amber-200'
            }`}>
              <div>
                <div className="font-bold text-sm text-ink">
                  {form.apply_vat ? '✓ ضريبة القيمة المضافة مُفعّلة' : '⚠ الضريبة غير مُفعّلة'}
                </div>
                <div className="text-xs text-ink-soft mt-0.5">
                  {form.apply_vat
                    ? 'الفواتير تُطبع كـ"فاتورة ضريبيّة" مع VAT'
                    : 'الفواتير تُطبع كـ"فاتورة" عاديّة بدون ضريبة'}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.apply_vat}
                  onChange={(e) => update('apply_vat', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-cream-200 peer-checked:bg-emerald-500 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
              </label>
            </div>

            <Grid>
              <Field
                label="نسبة الضريبة (%)"
                value={String(form.vat_rate)}
                onChange={(v) => update('vat_rate', Number(v) || 15)}
                dir="ltr"
                hint="15% في السعوديّة"
              />
              <Field
                label="بادئة رقم الفاتورة"
                value={form.invoice_prefix}
                onChange={(v) => update('invoice_prefix', v)}
                dir="ltr"
                placeholder="TFL"
              />
            </Grid>

            <label className="flex items-center gap-2 p-3 bg-cream-50 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={form.prices_include_vat}
                onChange={(e) => update('prices_include_vat', e.target.checked)}
                className="w-4 h-4 accent-gold-deep"
              />
              <span className="text-sm text-ink">الأسعار المعروضة شاملة الضريبة</span>
            </label>

            {form.vat_number && !isValidSaudiVATNumber(form.vat_number) && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800">
                ⚠ الرقم الضريبي غير صحيح · يجب أن يكون 15 رقم ويبدأ وينتهي بـ 3
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ═══ Helper Components ═══

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({
  label, value, onChange, hint, dir = 'rtl', placeholder, textarea, icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  dir?: 'rtl' | 'ltr';
  placeholder?: string;
  textarea?: boolean;
  icon?: any;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-ink-soft mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-gold-deep" />}
        {label}
      </label>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir={dir}
          placeholder={placeholder}
          rows={2}
          className="w-full px-3 py-2 rounded-xl border border-cream-200 bg-cream-50 text-sm resize-none focus:border-gold-deep focus:outline-none focus:ring-2 focus:ring-gold-light/30"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          dir={dir}
          placeholder={placeholder}
          className="w-full px-3 py-2 rounded-xl border border-cream-200 bg-cream-50 text-sm focus:border-gold-deep focus:outline-none focus:ring-2 focus:ring-gold-light/30"
        />
      )}
      {hint && <div className="text-[10px] text-ink-muted mt-1">{hint}</div>}
    </div>
  );
}
