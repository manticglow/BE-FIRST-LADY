'use client';

import { useState } from 'react';
import { Send, Users, User as UserIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const TEMPLATES = [
  { label: '🎁 عرض جديد',    title: '🎁 عرض خاص',        body: 'خصم 20% على جميع خدمات الحمّام المغربي — لمدّة 48 ساعة!' },
  { label: '✨ خدمة جديدة',  title: '✨ خدمة جديدة',     body: 'جرّبي خدمتنا الجديدة — مكياج عرائس بأحدث التقنيات' },
  { label: '💛 تذكير',       title: '💛 اشتقنا لكِ',      body: 'ما شفناكِ من فترة — نقدّم لكِ خصم 25% على جلستكِ القادمة' },
  { label: '🌸 إفتتاح',      title: '🌸 الجمعة المميّزة', body: 'الجمعة القادمة · خصم خاص على البكجات المختارة' },
];

export default function PushSender() {
  const [target, setTarget] = useState<'all' | 'user'>('all');
  const [role, setRole] = useState<'' | 'customer' | 'staff' | 'manager' | 'owner'>('');
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!title.trim() || !body.trim()) {
      toast.error('العنوان والنص مطلوبان');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target,
          user_id: target === 'user' ? userId : undefined,
          role: target === 'all' && role ? role : undefined,
          title,
          body,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`✅ أُرسل لـ ${data.sent} جهاز (${data.failed} فشل)`);
      setTitle(''); setBody('');
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-cream-200 shadow-sm">
      {/* الهدف */}
      <div className="mb-4">
        <label className="text-sm font-bold text-ink mb-2 block">إلى:</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setTarget('all')}
            className={`p-3 rounded-xl border-2 transition-all text-sm font-bold ${
              target === 'all'
                ? 'border-gold-deep bg-gold-light/15 text-gold-deep'
                : 'border-cream-200 text-ink-soft'
            }`}
          >
            <Users className="w-4 h-4 inline ms-1" />
            الكل / مجموعة
          </button>
          <button
            onClick={() => setTarget('user')}
            className={`p-3 rounded-xl border-2 transition-all text-sm font-bold ${
              target === 'user'
                ? 'border-gold-deep bg-gold-light/15 text-gold-deep'
                : 'border-cream-200 text-ink-soft'
            }`}
          >
            <UserIcon className="w-4 h-4 inline ms-1" />
            عميلة واحدة
          </button>
        </div>
      </div>

      {/* فلاتر */}
      {target === 'all' ? (
        <div className="mb-4">
          <label className="text-sm text-ink-soft mb-1 block">الدور (اختياري):</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full p-2.5 rounded-xl border border-cream-200 bg-cream-50 text-sm"
          >
            <option value="">كل المستخدمين</option>
            <option value="customer">العميلات فقط</option>
            <option value="staff">الموظفات فقط</option>
            <option value="manager">المديرات فقط</option>
          </select>
        </div>
      ) : (
        <div className="mb-4">
          <label className="text-sm text-ink-soft mb-1 block">UUID العميلة:</label>
          <input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="w-full p-2.5 rounded-xl border border-cream-200 bg-cream-50 text-sm font-mono"
          />
        </div>
      )}

      {/* قوالب جاهزة */}
      <div className="mb-4">
        <label className="text-sm text-ink-soft mb-2 block">قوالب جاهزة:</label>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              onClick={() => { setTitle(t.title); setBody(t.body); }}
              className="p-2 rounded-xl border border-cream-200 text-xs text-right hover:border-gold hover:bg-gold-light/10"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* العنوان */}
      <div className="mb-3">
        <label className="text-sm text-ink-soft mb-1 block">العنوان:</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          placeholder="✨ عرض خاص"
          className="w-full p-2.5 rounded-xl border border-cream-200 bg-cream-50"
        />
        <div className="text-[10px] text-ink-soft mt-1">{title.length}/100</div>
      </div>

      {/* النص */}
      <div className="mb-4">
        <label className="text-sm text-ink-soft mb-1 block">النص:</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="تفاصيل الإشعار..."
          className="w-full p-2.5 rounded-xl border border-cream-200 bg-cream-50"
        />
        <div className="text-[10px] text-ink-soft mt-1">{body.length}/500</div>
      </div>

      {/* معاينة */}
      {title && body && (
        <div className="mb-4 p-4 bg-cream-100 rounded-2xl border border-cream-200">
          <div className="text-xs text-ink-soft mb-2">معاينة:</div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <div className="font-bold text-sm">{title}</div>
            <div className="text-xs text-ink-soft mt-1">{body}</div>
          </div>
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={sending || !title.trim() || !body.trim()}
        className="w-full bg-gradient-to-l from-gold-deep to-ink text-cream-50 py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        {sending ? 'يُرسل...' : 'أرسلي الإشعار'}
      </button>
    </div>
  );
}
