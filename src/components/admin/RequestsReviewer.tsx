/**
 * RequestsReviewer — مراجعة كل طلبات الموظّفات في مكان واحد
 * ═══════════════════════════════════════════════════════════
 * 3 تبويبات: إجازات · أذونات · تبديل دوام
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Umbrella, Clock, Repeat, Loader2, Check, X, Calendar,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';

type Kind = 'leaves' | 'permissions' | 'swaps';

interface UserInfo { id: string; full_name: string; avatar_url: string | null; role?: string }
interface LeaveItem {
  id: string; user_id: string; leave_type: string;
  start_date: string; end_date: string; reason: string | null;
  status: string; review_note: string | null; created_at: string;
  user?: UserInfo;
}
interface PermissionItem {
  id: string; user_id: string; request_type: 'early_leave' | 'late_arrival' | 'short_break';
  request_date: string; requested_time: string; duration_min: number | null;
  reason: string; status: string; review_note: string | null; created_at: string;
  user?: UserInfo;
}
interface SwapItem {
  id: string; requester_id: string; recipient_id: string | null;
  requester_date: string; recipient_date: string | null; reason: string;
  status: string; colleague_note: string | null; review_note: string | null; created_at: string;
  requester?: UserInfo; recipient?: UserInfo;
}

const LEAVE_TYPE_AR: Record<string, string> = {
  annual: 'سنوية', sick: 'مرضية', emergency: 'طارئة', unpaid: 'بدون راتب', other: 'أخرى',
};
const PERMISSION_TYPE: Record<string, string> = {
  early_leave: 'انصراف مبكّر', late_arrival: 'تأخّر الوصول', short_break: 'استراحة قصيرة',
};
const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  pending:      { text: 'بانتظار',       cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  colleague_ok: { text: 'وافقت الزميلة', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  colleague_no: { text: 'رفضت الزميلة',  cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  approved:     { text: 'مقبول ✓',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected:     { text: 'مرفوض',          cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  cancelled:    { text: 'ملغي',            cls: 'bg-stone-50 text-stone-500 border-stone-200' },
};

type ReviewTarget =
  | { endpoint: string; id: string; name: string; summary: string }
  | null;

export default function RequestsReviewer() {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>('leaves');
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [swaps, setSwaps] = useState<SwapItem[]>([]);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<ReviewTarget>(null);
  const [action, setAction] = useState<'approve' | 'reject'>('approve');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, p, s] = await Promise.all([
        fetch('/api/admin/leaves').then((r) => r.json()),
        fetch('/api/admin/permissions').then((r) => r.json()),
        fetch('/api/admin/swaps').then((r) => r.json()),
      ]);
      setLeaves(l.leaves || l.items || []);
      setPermissions(p.items || []);
      setSwaps(s.items || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function review() {
    if (!reviewing) return;
    setBusy(true);
    const res = await fetch(reviewing.endpoint, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: reviewing.id,
        status: action === 'approve' ? 'approved' : 'rejected',
        review_note: note.trim() || null,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || 'فشل');
      return;
    }
    toast.success(action === 'approve' ? 'تم الاعتماد ✓' : 'تم الرفض');
    setReviewing(null);
    setNote('');
    load();
    router.refresh();
  }

  const pendingLeaves      = leaves.filter((l) => l.status === 'pending').length;
  const pendingPermissions = permissions.filter((p) => p.status === 'pending').length;
  const pendingSwaps       = swaps.filter((s) => ['pending', 'colleague_ok'].includes(s.status)).length;

  function filtered<T extends { status: string }>(items: T[]): T[] {
    return tab === 'pending'
      ? items.filter((i) => i.status === 'pending' || i.status === 'colleague_ok')
      : items;
  }

  return (
    <>
      {/* تبويبات نوع الطلبات */}
      <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide">
        <KindBtn icon={Umbrella} label="إجازات" count={pendingLeaves}       active={kind === 'leaves'}      onClick={() => setKind('leaves')} />
        <KindBtn icon={Clock}    label="أذونات" count={pendingPermissions}  active={kind === 'permissions'} onClick={() => setKind('permissions')} />
        <KindBtn icon={Repeat}   label="تبديل"  count={pendingSwaps}        active={kind === 'swaps'}       onClick={() => setKind('swaps')} />
      </div>

      {/* فلتر: pending/all */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-2 rounded-full text-xs font-bold ${
            tab === 'pending' ? 'bg-gold-deep text-cream-50' : 'bg-white border border-cream-200 text-ink'
          }`}
        >
          بانتظار
        </button>
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 rounded-full text-xs font-bold ${
            tab === 'all' ? 'bg-gold-deep text-cream-50' : 'bg-white border border-cream-200 text-ink'
          }`}
        >
          الكل
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" /></div>
      ) : (
        <>
          {kind === 'leaves' && (
            <List
              items={filtered(leaves)}
              empty="ما فيه طلبات إجازة"
              renderItem={(l: LeaveItem) => (
                <LeaveRow
                  key={l.id}
                  item={l}
                  onReview={(a) => {
                    setAction(a);
                    setReviewing({
                      endpoint: '/api/admin/leaves',
                      id: l.id,
                      name: l.user?.full_name || 'موظّفة',
                      summary: `إجازة ${LEAVE_TYPE_AR[l.leave_type]} · ${l.start_date} → ${l.end_date}`,
                    });
                  }}
                />
              )}
            />
          )}
          {kind === 'permissions' && (
            <List
              items={filtered(permissions)}
              empty="ما فيه طلبات إذن"
              renderItem={(p: PermissionItem) => (
                <PermissionRow
                  key={p.id}
                  item={p}
                  onReview={(a) => {
                    setAction(a);
                    setReviewing({
                      endpoint: '/api/admin/permissions',
                      id: p.id,
                      name: p.user?.full_name || 'موظّفة',
                      summary: `${PERMISSION_TYPE[p.request_type]} · ${p.request_date} ${p.requested_time.slice(0, 5)}`,
                    });
                  }}
                />
              )}
            />
          )}
          {kind === 'swaps' && (
            <List
              items={filtered(swaps)}
              empty="ما فيه طلبات تبديل"
              renderItem={(s: SwapItem) => (
                <SwapRow
                  key={s.id}
                  item={s}
                  onReview={(a) => {
                    setAction(a);
                    setReviewing({
                      endpoint: '/api/admin/swaps',
                      id: s.id,
                      name: s.requester?.full_name || 'موظّفة',
                      summary: `تبديل مع ${s.recipient?.full_name || '؟'} · ${s.requester_date}${s.recipient_date ? ` → ${s.recipient_date}` : ''}`,
                    });
                  }}
                />
              )}
            />
          )}
        </>
      )}

      {/* Modal المراجعة */}
      <Modal
        open={!!reviewing}
        onClose={() => setReviewing(null)}
        size="sm"
        title={reviewing ? `${action === 'approve' ? '✓ اعتماد' : 'رفض'} · ${reviewing.name}` : ''}
        subtitle={reviewing?.summary}
        padded={false}
      >
        {reviewing && (
          <div className="p-5">
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
                disabled={busy}
                className={`!py-2 flex-1 text-sm font-bold text-white rounded-xl disabled:opacity-50 ${
                  action === 'approve' ? 'bg-success hover:bg-success/90' : 'bg-danger hover:bg-danger/90'
                }`}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (action === 'approve' ? 'اعتماد' : 'رفض')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function KindBtn({
  icon: Icon, label, count, active, onClick,
}: {
  icon: typeof Clock; label: string; count: number; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
        active ? 'bg-gold-deep text-cream-50 shadow-md' : 'bg-white border border-cream-200 text-ink'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {count > 0 && (
        <span className={`text-[10px] rounded-full px-2 py-0.5 ${
          active ? 'bg-white/25' : 'bg-rose-500 text-white'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

function List<T>({
  items, empty, renderItem,
}: {
  items: T[]; empty: string; renderItem: (item: T) => React.ReactNode;
}) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 text-center border border-cream-200 text-sm text-ink-soft">
        {empty}
      </div>
    );
  }
  return <ul className="space-y-3">{items.map(renderItem)}</ul>;
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABEL[status] || STATUS_LABEL.pending;
  return (
    <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${s.cls}`}>
      {s.text}
    </span>
  );
}

function Avatar({ user }: { user?: UserInfo }) {
  return user?.avatar_url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={user.avatar_url} alt={user.full_name} className="w-10 h-10 rounded-full object-cover" />
  ) : (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-light to-gold-deep text-cream-50 flex items-center justify-center font-bold">
      {user?.full_name?.charAt(0) || '؟'}
    </div>
  );
}

function ActionButtons({ onReview }: { onReview: (a: 'approve' | 'reject') => void }) {
  return (
    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-cream-100">
      <button
        onClick={() => onReview('approve')}
        className="flex items-center gap-1 px-3 py-1.5 bg-success/10 text-success rounded-lg text-xs font-bold hover:bg-success/20"
      >
        <Check className="w-3 h-3" />
        اعتماد
      </button>
      <button
        onClick={() => onReview('reject')}
        className="flex items-center gap-1 px-3 py-1.5 bg-danger/10 text-danger rounded-lg text-xs font-bold hover:bg-danger/20"
      >
        <X className="w-3 h-3" />
        رفض
      </button>
    </div>
  );
}

function LeaveRow({ item: l, onReview }: { item: LeaveItem; onReview: (a: 'approve' | 'reject') => void }) {
  const days = Math.round((new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / 86400000) + 1;
  return (
    <li className="bg-white rounded-2xl p-4 border border-cream-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Avatar user={l.user} />
          <div>
            <div className="font-bold text-sm text-ink">{l.user?.full_name}</div>
            <div className="text-[10px] text-ink-soft">
              قدّمتها {new Date(l.created_at).toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-cream-100 text-ink px-2 py-1 rounded-full font-bold text-xs">
            {LEAVE_TYPE_AR[l.leave_type]}
          </span>
          <StatusBadge status={l.status} />
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
      {l.status === 'pending' && <ActionButtons onReview={onReview} />}
    </li>
  );
}

function PermissionRow({ item: p, onReview }: { item: PermissionItem; onReview: (a: 'approve' | 'reject') => void }) {
  return (
    <li className="bg-white rounded-2xl p-4 border border-cream-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Avatar user={p.user} />
          <div>
            <div className="font-bold text-sm text-ink">{p.user?.full_name}</div>
            <div className="text-[10px] text-ink-soft">
              قدّمتها {new Date(p.created_at).toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold text-xs">
            {PERMISSION_TYPE[p.request_type]}
          </span>
          <StatusBadge status={p.status} />
        </div>
      </div>
      <div className="flex items-center gap-2 text-sm text-ink mb-2">
        <Calendar className="w-3.5 h-3.5 text-gold-deep" />
        <span className="font-en-display">{p.request_date}</span>
        <Clock className="w-3.5 h-3.5 text-gold-deep" />
        <span className="font-en-display">{p.requested_time.slice(0, 5)}</span>
        {p.duration_min && (
          <span className="text-xs text-ink-soft">({p.duration_min} دقيقة)</span>
        )}
      </div>
      <div className="text-xs text-ink-soft mt-2 bg-cream-50 rounded-lg p-2">
        <strong>السبب:</strong> {p.reason}
      </div>
      {p.review_note && (
        <div className="text-xs mt-2 bg-gold-light/10 rounded-lg p-2">
          <strong className="text-gold-deep">ردكِ:</strong> {p.review_note}
        </div>
      )}
      {p.status === 'pending' && <ActionButtons onReview={onReview} />}
    </li>
  );
}

function SwapRow({ item: s, onReview }: { item: SwapItem; onReview: (a: 'approve' | 'reject') => void }) {
  return (
    <li className="bg-white rounded-2xl p-4 border border-cream-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Avatar user={s.requester} />
          <Repeat className="w-3 h-3 text-ink-soft" />
          <Avatar user={s.recipient || undefined} />
          <div>
            <div className="font-bold text-sm text-ink">
              {s.requester?.full_name} ↔ {s.recipient?.full_name || '؟'}
            </div>
            <div className="text-[10px] text-ink-soft">
              قدّمته {new Date(s.created_at).toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>
        <StatusBadge status={s.status} />
      </div>
      <div className="flex items-center gap-2 text-sm text-ink mb-2">
        <Calendar className="w-3.5 h-3.5 text-gold-deep" />
        <span className="font-en-display">{s.requester_date}</span>
        {s.recipient_date && (
          <>
            <Repeat className="w-3.5 h-3.5 opacity-50" />
            <span className="font-en-display">{s.recipient_date}</span>
          </>
        )}
      </div>
      <div className="text-xs text-ink-soft mt-2 bg-cream-50 rounded-lg p-2">
        <strong>السبب:</strong> {s.reason}
      </div>
      {s.colleague_note && (
        <div className="text-xs mt-2 bg-blue-50 rounded-lg p-2">
          <strong className="text-blue-700">ردّ الزميلة:</strong> {s.colleague_note}
        </div>
      )}
      {s.review_note && (
        <div className="text-xs mt-2 bg-gold-light/10 rounded-lg p-2">
          <strong className="text-gold-deep">ردكِ:</strong> {s.review_note}
        </div>
      )}
      {['pending', 'colleague_ok'].includes(s.status) && <ActionButtons onReview={onReview} />}
    </li>
  );
}
