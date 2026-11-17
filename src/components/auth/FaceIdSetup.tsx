/**
 * FaceIdSetup — تفعيل Face ID / بصمة الجوال
 */
'use client';

import { useState, useEffect } from 'react';
import { Fingerprint, Loader2, Check, X, Shield, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface Credential {
  id: string;
  device_name: string;
  created_at: string;
  last_used_at: string | null;
}

export default function FaceIdSetup() {
  const [supported, setSupported] = useState(false);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // التحقّق من دعم المتصفّح
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
        .then((avail) => setSupported(avail))
        .catch(() => setSupported(false));
    }
    loadCredentials();
  }, []);

  async function loadCredentials() {
    try {
      const res = await fetch('/api/auth/webauthn/credentials');
      const data = await res.json();
      if (data.ok) setCredentials(data.credentials || []);
    } finally {
      setLoading(false);
    }
  }

  async function registerDevice() {
    setBusy(true);
    try {
      const { startRegistration } = await import('@simplewebauthn/browser');

      const optRes = await fetch('/api/auth/webauthn/register-options', { method: 'POST' });
      const { options } = await optRes.json();

      const attResp = await startRegistration({ optionsJSON: options });

      const deviceName = /iPhone/.test(navigator.userAgent)
        ? 'iPhone'
        : /iPad/.test(navigator.userAgent)
        ? 'iPad'
        : /Mac/.test(navigator.userAgent)
        ? 'Mac'
        : /Android/.test(navigator.userAgent)
        ? 'Android'
        : 'جهاز';

      const verRes = await fetch('/api/auth/webauthn/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: attResp, deviceName }),
      });

      const verData = await verRes.json();
      if (verData.ok) {
        toast.success(verData.message);
        loadCredentials();
      } else {
        toast.error(verData.error || 'فشل التفعيل');
      }
    } catch (e: any) {
      if (e.name === 'InvalidStateError') {
        toast.error('هذا الجهاز مُسجّل مسبقاً');
      } else if (e.name !== 'NotAllowedError') {
        toast.error(e.message || 'لم يُستكمل التفعيل');
      }
    } finally {
      setBusy(false);
    }
  }

  async function removeDevice(id: string) {
    if (!confirm('حذف هذا الجهاز من قائمة الدخول السريع؟')) return;
    const res = await fetch(`/api/auth/webauthn/credentials?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('تمّ الحذف');
      loadCredentials();
    }
  }

  if (loading) return <div className="bg-white rounded-2xl p-6 text-center"><Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" /></div>;

  if (!supported) {
    return (
      <div className="bg-white rounded-2xl p-5 border border-cream-200">
        <div className="flex items-center gap-3 text-ink-soft text-sm">
          <X className="w-5 h-5" />
          متصفّحكِ لا يدعم Face ID / بصمة الجوال
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-cream-200 shadow-sm">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold-light/20 to-cream-100 flex items-center justify-center shrink-0">
          <Fingerprint className="w-6 h-6 text-gold-deep" />
        </div>
        <div className="flex-1">
          <h3 className="font-ar-display text-lg font-bold text-gold-deep">
            الدخول السريع · Face ID / بصمة
          </h3>
          <p className="text-xs text-ink-soft mt-1 leading-relaxed">
            فعّلي الدخول ببصمة الجوال أو بالوجه · أسرع وأأمن من كلمة المرور
          </p>
        </div>
      </div>

      {credentials.length > 0 && (
        <div className="mb-4 space-y-2">
          {credentials.map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 bg-cream-50 rounded-xl">
              <Smartphone className="w-4 h-4 text-gold-deep shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-ink truncate">{c.device_name}</div>
                <div className="text-[10px] text-ink-soft">
                  {c.last_used_at ? `آخر استخدام: ${new Date(c.last_used_at).toLocaleDateString('ar-SA')}` : 'لم يُستخدم بعد'}
                </div>
              </div>
              <button
                onClick={() => removeDevice(c.id)}
                className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={registerDevice}
        disabled={busy}
        className="btn-primary w-full !py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
        {credentials.length === 0 ? 'فعّلي Face ID على هذا الجهاز' : 'إضافة جهاز آخر'}
      </button>

      <div className="text-[10px] text-ink-soft mt-3 flex items-start gap-1.5">
        <Check className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
        <span>بياناتكِ محفوظة في الجهاز فقط · لا تُرسل أبداً لأي خادم</span>
      </div>
    </div>
  );
}
