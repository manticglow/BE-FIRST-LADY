/**
 * ComplaintForm · نموذج تقديم شكوى
 */
'use client';

import { useState } from 'react';
import { Send, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

const TYPES = [
  { v: 'service', l: 'شكوى على خدمة' },
  { v: 'staff', l: 'شكوى على موظّفة' },
  { v: 'payment', l: 'مشكلة في الدفع' },
  { v: 'booking', l: 'مشكلة في الحجز' },
  { v: 'privacy', l: 'شكوى خصوصيّة (PDPL)' },
  { v: 'suggestion', l: 'اقتراح أو ملاحظة' },
  { v: 'other', l: 'أخرى' },
];

export default function ComplaintForm() {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', type: 'service', subject: '', message: '',
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      toast.error('الاسم · الجوّال · والشكوى مطلوبون');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/legal/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (d.ok) {
        setDone(d.reference || 'CMP-' + Date.now());
        toast.success('استلمنا شكوتكِ · نرد خلال 24 ساعة');
      } else {
        toast.error(d.error || 'تعثّر الإرسال · حاولي مرّة ثانية');
      }
    } catch {
      toast.error('تعثّر الاتّصال · حاولي مرّة ثانية');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
          <Check className="w-7 h-7 text-emerald-600" />
        </div>
        <h3 className="font-ar-display text-xl font-bold text-ink mb-2">شكراً لثقتكِ 🤍</h3>
        <p className="text-sm text-ink-soft mb-4">
          استلمنا شكوتكِ · فريقنا سيتواصل معكِ خلال 24 ساعة
        </p>
        <div className="inline-block bg-cream-50 px-4 py-2 border border-cream-200" style={{ borderRadius: '2px' }}>
          <div className="text-[10px] font-bold text-ink-soft uppercase tracking-wider">رقم المرجع</div>
          <div className="font-en-display font-bold text-ink tabular-nums mt-0.5">{done}</div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="الاسم *">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="inp"
            autoComplete="name"
          />
        </Field>
        <Field label="رقم الجوّال *">
          <input
            required
            type="tel"
            inputMode="numeric"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="inp"
            autoComplete="tel"
            pattern="05[0-9]{8}"
            dir="ltr"
          />
        </Field>
      </div>

      <Field label="البريد الإلكتروني (اختياري)">
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="inp"
          autoComplete="email"
        />
      </Field>

      <Field label="نوع الشكوى *">
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="inp"
        >
          {TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
        </select>
      </Field>

      <Field label="الموضوع (ملخّص)">
        <input
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          className="inp"
          placeholder="مثال: تأخّر الموعد يوم الأحد"
        />
      </Field>

      <Field label="تفاصيل الشكوى *">
        <textarea
          required
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className="inp"
          rows={5}
          maxLength={2000}
          placeholder="اكتبي التفاصيل · تاريخ الحادث · ما حصل..."
        />
        <p className="text-[10px] text-ink-soft mt-1">{form.message.length} / 2000</p>
      </Field>

      <button
        type="submit"
        disabled={busy}
        className="btn-primary w-full !py-3 disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        إرسال الشكوى
      </button>

      <p className="text-[10px] text-ink-soft text-center leading-relaxed">
        🔒 بإرسالكِ الشكوى · توافقين على معالجة بياناتكِ لمعالجة الشكوى فقط ·
        وفق <a href="/legal/privacy" className="text-gold-deep underline">سياسة الخصوصيّة</a>
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-ink-soft mb-1.5">{label}</label>
      {children}
    </div>
  );
}
