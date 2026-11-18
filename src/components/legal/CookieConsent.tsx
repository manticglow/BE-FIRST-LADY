/**
 * CookieConsent · شريط موافقة الكوكيز (PDPL + GDPR)
 * ═══════════════════════════════════════════════════════════
 * - يظهر لأوّل زيارة · يُحفظ الاختيار في localStorage
 * - 3 خيارات: الكل · الضروريّة فقط · تخصيص
 * - التصنيف: أساسيّة (دائماً مفعّلة) · تحليل · تسويق
 */
'use client';

import { useEffect, useState } from 'react';
import { Cookie, X, Settings } from 'lucide-react';
import Link from 'next/link';

type Consent = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

const STORAGE_KEY = 'tfl-cookie-consent-v1';

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [expand, setExpand] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) setShow(true);
    } catch {
      // private mode: show banner
      setShow(true);
    }
  }, []);

  function save(choice: Omit<Consent, 'timestamp' | 'essential'>) {
    const consent: Consent = {
      essential: true,
      analytics: choice.analytics,
      marketing: choice.marketing,
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    } catch {}
    setShow(false);

    // Inform analytics/marketing scripts (they should listen for this event)
    window.dispatchEvent(new CustomEvent('tfl-consent-update', { detail: consent }));
  }

  if (!show) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[150] p-4 animate-in slide-in-from-bottom-4"
      role="dialog"
      aria-label="موافقة الكوكيز"
      aria-live="polite"
    >
      <div className="max-w-4xl mx-auto bg-white border border-gold-light/40 shadow-[0_20px_60px_-15px_rgba(201,169,110,0.4)]" style={{ borderRadius: '2px' }}>
        {/* Main banner */}
        <div className="p-5 md:p-6">
          <div className="flex items-start gap-3 mb-3">
            <Cookie className="w-5 h-5 text-gold-deep shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex-1">
              <h2 className="font-ar-display text-lg font-bold text-gold-deep mb-1">
                خصوصيّتكِ · أولويّتنا
              </h2>
              <p className="text-sm text-ink-soft leading-relaxed">
                نستخدم ملفات تعريف الارتباط (Cookies) لتحسين تجربتكِ · فقط الضروريّة تُفعّل تلقائياً ·
                البقيّة باختياركِ · يمكنكِ المراجعة في{' '}
                <Link href="/legal/privacy" className="text-gold-deep underline">سياسة الخصوصيّة</Link>.
              </p>
            </div>
          </div>

          {expand && (
            <div className="my-4 space-y-2 border-t border-cream-200 pt-4">
              <Row
                title="ضروريّة"
                desc="لازمة لعمل الموقع (تسجيل الدخول · السلّة · الأمان) · لا يمكن إيقافها."
                checked={true}
                disabled={true}
                onChange={() => {}}
              />
              <Row
                title="تحليل الأداء"
                desc="إحصاءات مجهّلة لتحسين الموقع (لا بيانات شخصيّة)."
                checked={analytics}
                onChange={setAnalytics}
              />
              <Row
                title="التسويق"
                desc="تتبّع لعرض محتوى مناسب لكِ · يُستخدم مع Facebook/Google Ads."
                checked={marketing}
                onChange={setMarketing}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-end">
            <button
              onClick={() => save({ analytics: false, marketing: false })}
              className="px-5 py-2.5 border border-ink text-ink font-bold text-[12px] uppercase hover:bg-ink hover:text-cream-50 transition-colors"
              style={{ borderRadius: '2px', letterSpacing: '0.1em' }}
            >
              الضروريّة فقط
            </button>
            <button
              onClick={() => setExpand(!expand)}
              className="px-5 py-2.5 border border-cream-300 text-ink-soft font-bold text-[12px] uppercase hover:bg-cream-50 transition-colors inline-flex items-center gap-1.5"
              style={{ borderRadius: '2px', letterSpacing: '0.1em' }}
              aria-expanded={expand}
            >
              <Settings className="w-3.5 h-3.5" />
              تخصيص
            </button>
            <button
              onClick={() => expand
                ? save({ analytics, marketing })
                : save({ analytics: true, marketing: true })}
              className="px-5 py-2.5 bg-ink text-cream-50 font-bold text-[12px] uppercase hover:bg-gold-deep transition-colors"
              style={{ borderRadius: '2px', letterSpacing: '0.1em' }}
            >
              {expand ? 'حفظ الاختيار' : 'قبول الكل'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  title, desc, checked, disabled, onChange,
}: {
  title: string; desc: string; checked: boolean; disabled?: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className={`flex items-start gap-3 p-3 ${disabled ? 'opacity-70' : 'hover:bg-cream-50 cursor-pointer'}`} style={{ borderRadius: '2px' }}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 accent-gold-deep"
        aria-label={title}
      />
      <div className="flex-1">
        <div className="font-bold text-sm text-ink">{title}</div>
        <div className="text-xs text-ink-soft mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </label>
  );
}

/** Helper: read the current consent (for other code) */
export function getCookieConsent(): { analytics: boolean; marketing: boolean } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw);
    return { analytics: !!c.analytics, marketing: !!c.marketing };
  } catch {
    return null;
  }
}
