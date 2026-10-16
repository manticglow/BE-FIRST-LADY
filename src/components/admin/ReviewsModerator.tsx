/**
 * ReviewsModerator — موافقة ورد على التقييمات
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Star, Check, X, Reply, Trash2, Star as StarIcon } from 'lucide-react';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  source: string;
  is_approved: boolean;
  is_featured: boolean;
  admin_reply: string | null;
  admin_reply_at: string | null;
  service_names: string[] | null;
  created_at: string;
}

export default function ReviewsModerator({ reviews }: { reviews: Review[] }) {
  const router = useRouter();
  const [replying, setReplying] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [tab, setTab] = useState<'all' | 'pending' | 'approved'>('pending');

  const filtered = tab === 'all' ? reviews
    : tab === 'pending' ? reviews.filter((r) => !r.is_approved)
    : reviews.filter((r) => r.is_approved);

  async function update(id: string, updates: Partial<Review>) {
    setBusy(id);
    await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    setBusy(null);
    toast.success('تم');
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm('متأكدة من حذف التقييم؟')) return;
    setBusy(id);
    await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' });
    setBusy(null);
    toast.success('تم الحذف');
    router.refresh();
  }

  async function sendReply() {
    if (!replying || !replyText.trim()) return;
    setBusy('reply');
    await update(replying.id, { admin_reply: replyText.trim() });
    setBusy(null);
    setReplying(null);
    setReplyText('');
  }

  return (
    <>
      {/* تبويبات */}
      <div className="flex gap-2 mb-6">
        {[
          { k: 'pending', label: `بانتظار (${reviews.filter(r => !r.is_approved).length})` },
          { k: 'approved', label: `منشورة (${reviews.filter(r => r.is_approved).length})` },
          { k: 'all', label: `الكل (${reviews.length})` },
        ].map((t) => (
          <button
            key={t.k}
            onClick={() => setTab(t.k as any)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors ${
              tab === t.k ? 'bg-gold-deep text-cream-50' : 'bg-white border border-cream-200 text-ink hover:border-gold-light'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-cream-200 text-sm text-ink-soft">
          ما فيه تقييمات في هذا القسم
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white rounded-2xl border border-cream-200 p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="font-bold text-ink">{r.customer_name}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`w-4 h-4 ${r.rating >= n ? 'fill-gold-deep text-gold-deep' : 'text-cream-300'}`} />
                    ))}
                  </div>
                  <div className="text-[10px] text-ink-soft mt-1 font-en-display">
                    {new Date(r.created_at).toLocaleString('en-GB')}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {r.is_featured && (
                    <span className="text-[10px] bg-gold-deep text-cream-50 font-bold px-2 py-0.5 rounded-full">
                      ⭐ مميّز
                    </span>
                  )}
                  {!r.is_approved && (
                    <span className="text-[10px] bg-warning/20 text-warning font-bold px-2 py-0.5 rounded-full">
                      بانتظار
                    </span>
                  )}
                </div>
              </div>

              {r.comment && (
                <p className="text-sm text-ink leading-relaxed bg-cream-50 p-3 rounded-xl mb-3">
                  "{r.comment}"
                </p>
              )}

              {r.service_names && r.service_names.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {r.service_names.map((s, i) => (
                    <span key={i} className="text-[10px] bg-gold-light/15 text-gold-deep px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {r.admin_reply && (
                <div className="bg-gold-light/10 border-r-2 border-gold-deep p-3 rounded-xl mb-3">
                  <div className="text-[10px] font-bold text-gold-deep uppercase mb-1">ردّكِ:</div>
                  <p className="text-sm text-ink">{r.admin_reply}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t border-cream-200">
                {!r.is_approved && (
                  <button
                    onClick={() => update(r.id, { is_approved: true })}
                    disabled={busy === r.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-success/10 text-success rounded-lg text-xs font-bold hover:bg-success/20"
                  >
                    <Check className="w-3 h-3" />
                    اعتماد
                  </button>
                )}
                {r.is_approved && (
                  <button
                    onClick={() => update(r.id, { is_approved: false })}
                    disabled={busy === r.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-cream-100 text-ink-soft rounded-lg text-xs font-bold hover:bg-cream-200"
                  >
                    <X className="w-3 h-3" />
                    إلغاء النشر
                  </button>
                )}
                <button
                  onClick={() => update(r.id, { is_featured: !r.is_featured })}
                  disabled={busy === r.id}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold ${
                    r.is_featured ? 'bg-gold-deep text-cream-50' : 'bg-cream-100 text-ink-soft hover:bg-gold-light/20'
                  }`}
                >
                  <StarIcon className={`w-3 h-3 ${r.is_featured ? 'fill-current' : ''}`} />
                  {r.is_featured ? 'إلغاء التمييز' : 'تمييز'}
                </button>
                <button
                  onClick={() => { setReplying(r); setReplyText(r.admin_reply || ''); }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gold-light/15 text-gold-deep rounded-lg text-xs font-bold hover:bg-gold-light/30"
                >
                  <Reply className="w-3 h-3" />
                  {r.admin_reply ? 'تعديل الرد' : 'رد'}
                </button>
                <div className="flex-1"></div>
                <button
                  onClick={() => remove(r.id)}
                  disabled={busy === r.id}
                  className="p-1.5 hover:bg-danger/10 rounded text-danger"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal الرد */}
      {replying && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReplying(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <h3 className="font-ar-display text-lg font-bold text-gold-deep mb-1">الرد على {replying.customer_name}</h3>
            <p className="text-xs text-ink-soft mb-4">يُنشر مع التقييم للعميلات</p>
            <textarea
              rows={4}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              maxLength={500}
              placeholder="شكراً لكِ على كلماتكِ الجميلة 💛..."
              className="w-full px-3 py-3 rounded-xl border border-cream-200 bg-cream-50 focus:bg-white focus:border-gold outline-none text-sm resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setReplying(null)} className="btn-outline !py-2 flex-1 text-sm">إلغاء</button>
              <button onClick={sendReply} disabled={!replyText.trim() || busy === 'reply'} className="btn-primary !py-2 flex-1 text-sm disabled:opacity-50">
                إرسال
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
