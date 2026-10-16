/**
 * LeavesReviewer — مراجعة طلبات الإجازات (للمالكة/المديرة)
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, X, Clock, Loader2, Calendar, MessageSquare } from 'lucide-react';

interface Leave {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  review_note: string | null;
  created_at: string;
  user: { id: string; full_name: string; role: string };
}

const TYPE_LABEL: Record<string, string> = {
  annual: 'سنوية', sick: 'مرضية', emergency: 'طارئة', unpaid: 'بدون راتب', other: 'أخرى',
};

export default function LeavesReviewer() {
  const router = useRouter();
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [busy, setBusy] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<Leave | null>(null);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [note, setNote] = useState('');

  async function load() {
    const res = await fetch('/api/admin/leaves');
    const data = await res.json();
    setLeaves(data.leaves || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = tab === 'pending' ? leaves.filter((l) => l.status === 'pending') : leaves;

  async function review() {
    if (!reviewing) return;
    setBusy('review');
    const res = await fetch('/api/admin/leaves', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: reviewing.id,
        status: action === 'approve' ? 'approved' : 'rejected',
        review_note: note.trim() || null,
      }),
    });
    setBusy(null);
    if (!res.ok) {
      toast.error('فشل التحديث');
      return;
    }
    toast.success(action === 'approve' ? 'تم الاعتماد ✓' : 'تم الرفض');
    setReviewing(null);
    setNote('');
    load();
    router.refresh();
  }

  if (loading) return <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" /></div>;

  return (
    <>
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-2 rounded-full text-xs font-bold ${tab === 'pending' ? 'bg-gold-deep text-cream-50' : 'bg-white border border-cream-200 text-ink'}`}
        >
          بانتظار ({leaves.filter((l) => l.status === 'pending').length})
        </button>
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 rounded-full text-xs font-bold ${tab === 'all' ? 'bg-gold-deep text-cream-50' : 'bg-white border border-cream-200 text-ink'}`}
        >
          الكل ({leaves.length})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-cream-200 text-sm text-ink-soft">
          لا توجد طلبات في هذا القسم
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((l) => {
            const days = Math.round((new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / 86400000) + 1;
            return (
              <li key={l.id} className="bg-white rounded-2xl p-4 border border-cream-200">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-light to-gold-deep text-cream-50 flex items-center justify-center font-bold">
                      {l.user.full_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-ink">{l.user.full_name}</div>
                      <div className="text-[10px] text-ink-soft">
                        قدّمتها {new Date(l.created_at).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs">
                    <span className="bg-cream-100 text-ink px-2 py-1 rounded-full font-bold">
                      {TYPE_LABEL[l.leave_type]}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-ink mb-2">
                  <Calendar className="w-3.5 h-3.5 text-gold-deep" />
                  <span className="font-en-display">{l.start_date}</span>
                  <span>←</span>
                  <span className="font-en-display">{l.end_date}</span>
                  <span className="text-xs text-ink-soft">({days} يوم)</span>
                </div>

                {l.reason && (
                  <div className="text-xs text-ink-soft mt-2 bg-cream-50 rounded-lg p-2">
                    <strong>السبب:</strong> {l.reason}
                  </div>
                )}

                {l.review_note && (
                  <div className="text-xs mt-2 bg-gold-light/10 rounded-lg p-2">
                    <strong className="text-gold-deep">ردكِ:</strong> {l.review_note}
                  </div>
                )}

                {l.status === 'pending' ? (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-cream-100">
                    <button
                      onClick={() => { setReviewing(l); setAction('approve'); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-success/10 text-success rounded-lg text-xs font-bold hover:bg-success/20"
                    >
                      <Check className="w-3 h-3" />
                      اعتماد
                    </button>
                    <button
                      onClick={() => { setReviewing(l); setAction('reject'); }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-danger/10 text-danger rounded-lg text-xs font-bold hover:bg-danger/20"
                    >
                      <X className="w-3 h-3" />
                      رفض
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 pt-3 border-t border-cream-100">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                      l.status === 'approved' ? 'bg-success/15 text-success'
                        : l.status === 'rejected' ? 'bg-danger/15 text-danger'
                        : 'bg-cream-200 text-ink'
                    }`}>
                      {l.status === 'approved' && <Check className="w-3 h-3" />}
                      {l.status === 'rejected' && <X className="w-3 h-3" />}
                      {l.status === 'approved' ? 'مُوافق عليها' : l.status === 'rejected' ? 'مرفوضة' : 'ملغاة'}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal المراجعة */}
      {reviewing && (
        <div className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setReviewing(null)}>
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6">
            <h3 className="font-ar-display text-lg font-bold text-gold-deep mb-4">
              {action === 'approve' ? '✓ اعتماد طلب' : 'رفض طلب'} {reviewing.user.full_name}
            </h3>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder={action === 'approve' ? 'ملاحظة (اختياري)' : 'سبب الرفض (مُفضَّل)'}
              className="w-full px-3 py-2 rounded-xl border border-cream-200 bg-cream-50 text-sm resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setReviewing(null)} className="btn-outline !py-2 flex-1 text-sm">إلغاء</button>
              <button
                onClick={review}
                disabled={busy === 'review'}
                className={`!py-2 flex-1 text-sm font-bold text-white rounded-xl disabled:opacity-50 ${
                  action === 'approve' ? 'bg-success hover:bg-success/90' : 'bg-danger hover:bg-danger/90'
                }`}
              >
                {busy === 'review' ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (action === 'approve' ? 'اعتماد' : 'رفض')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
