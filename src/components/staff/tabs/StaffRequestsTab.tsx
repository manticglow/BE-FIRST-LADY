/**
 * StaffRequestsTab — تبويب طلباتي
 * ═══════════════════════════════════════════════════════════
 * 3 أقسام:
 *   • إجازات (leave)
 *   • أذونات (permission)
 *   • تبديل دوام (swap)
 * + زرّ "طلب جديد" مع اختيار النوع
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Plus, Umbrella, Clock, Repeat, Loader2, Check, X, AlertCircle,
  Calendar, MessageSquare,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import NewLeaveForm from '../forms/NewLeaveForm';
import NewPermissionForm from '../forms/NewPermissionForm';
import NewSwapForm from '../forms/NewSwapForm';

type RequestKind = 'leave' | 'permission' | 'swap';

interface LeaveItem {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  review_note: string | null;
  created_at: string;
}
interface PermissionItem {
  id: string;
  request_type: 'early_leave' | 'late_arrival' | 'short_break';
  request_date: string;
  requested_time: string;
  duration_min: number | null;
  reason: string;
  status: string;
  review_note: string | null;
  created_at: string;
}
interface SwapItem {
  id: string;
  requester_id: string;
  recipient_id: string | null;
  requester_date: string;
  recipient_date: string | null;
  reason: string;
  status: string;
  colleague_note: string | null;
  review_note: string | null;
  created_at: string;
  requester?: { id: string; full_name: string; avatar_url: string | null };
  recipient?: { id: string; full_name: string; avatar_url: string | null };
}

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  pending:         { text: 'بانتظار',       cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  colleague_ok:    { text: 'وافقت الزميلة', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  colleague_no:    { text: 'رفضت الزميلة',  cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  approved:        { text: 'مقبول ✓',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected:        { text: 'مرفوض',         cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  cancelled:       { text: 'ملغي',           cls: 'bg-stone-50 text-stone-500 border-stone-200' },
};

const LEAVE_TYPE_AR: Record<string, string> = {
  annual: 'سنوية', sick: 'مرضية', emergency: 'طارئة', unpaid: 'بدون راتب', other: 'أخرى',
};
const PERMISSION_TYPE: Record<string, { text: string; icon: typeof Clock }> = {
  early_leave:  { text: 'انصراف مبكّر',  icon: Clock },
  late_arrival: { text: 'تأخّر الوصول',  icon: Clock },
  short_break:  { text: 'استراحة قصيرة', icon: Clock },
};

export default function StaffRequestsTab({ currentUserId }: { currentUserId: string }) {
  const [kind, setKind] = useState<RequestKind>('leave');
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [swaps, setSwaps] = useState<SwapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [l, p, s] = await Promise.all([
        fetch('/api/leaves').then((r) => r.json()),
        fetch('/api/account/permissions').then((r) => r.json()),
        fetch('/api/account/swaps').then((r) => r.json()),
      ]);
      setLeaves(l.items || []);
      setPermissions(p.items || []);
      setSwaps(s.items || []);
    } catch {
      toast.error('تعذّر تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const kindCount = { leave: leaves.length, permission: permissions.length, swap: swaps.length };

  return (
    <div className="px-4 pt-6 pb-24 space-y-4">
      {/* Header */}
      <div>
        <div className="font-en-label text-[10px] tracking-[0.3em] text-gold-light mb-1">
          MY REQUESTS
        </div>
        <h1 className="font-ar-display text-2xl font-bold text-gold-deep">
          طلباتي
        </h1>
      </div>

      {/* زرّ طلب جديد */}
      <button
        onClick={() => setFormOpen(true)}
        className="btn-shimmer w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-br from-gold-deep via-amber-700 to-ink text-cream-50 font-ar-display font-bold shadow-lg shadow-gold-deep/20"
      >
        <Plus className="w-4 h-4" />
        طلب جديد
      </button>

      {/* التبويبات */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
        <KindTab icon={Umbrella}  label="إجازات" count={kindCount.leave}      active={kind === 'leave'}      onClick={() => setKind('leave')} />
        <KindTab icon={Clock}     label="أذونات" count={kindCount.permission} active={kind === 'permission'} onClick={() => setKind('permission')} />
        <KindTab icon={Repeat}    label="تبديل"  count={kindCount.swap}       active={kind === 'swap'}       onClick={() => setKind('swap')} />
      </div>

      {/* المحتوى */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" />
        </div>
      ) : (
        <div className="space-y-2.5">
          {kind === 'leave' && (leaves.length === 0 ? (
            <EmptyState text="ما فيه طلبات إجازة" />
          ) : leaves.map((l) => <LeaveCard key={l.id} item={l} />))}

          {kind === 'permission' && (permissions.length === 0 ? (
            <EmptyState text="ما فيه طلبات إذن" />
          ) : permissions.map((p) => <PermissionCard key={p.id} item={p} />))}

          {kind === 'swap' && (swaps.length === 0 ? (
            <EmptyState text="ما فيه طلبات تبديل" />
          ) : swaps.map((s) => <SwapCard key={s.id} item={s} currentUserId={currentUserId} onRefresh={load} />))}
        </div>
      )}

      {/* Modal طلب جديد */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="md"
        title="طلب جديد"
        padded={false}
      >
        <div className="p-5">
          <NewRequestForm
            onDone={() => { setFormOpen(false); load(); }}
          />
        </div>
      </Modal>
    </div>
  );
}

function KindTab({
  icon: Icon, label, count, active, onClick,
}: {
  icon: typeof Clock; label: string; count: number; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all ${
        active
          ? 'bg-gold-deep text-cream-50 shadow-md'
          : 'bg-white border border-cream-200 text-ink hover:border-gold-light'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      <span className={`text-[10px] rounded-full px-1.5 py-0.5 ${active ? 'bg-white/20' : 'bg-cream-100 text-ink-soft'}`}>
        {count}
      </span>
    </button>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-cream-50 border border-cream-200 rounded-2xl p-8 text-center">
      <AlertCircle className="w-8 h-8 text-cream-300 mx-auto mb-2" />
      <div className="text-sm text-ink-soft">{text}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_LABEL[status] || STATUS_LABEL.pending;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.cls} shrink-0`}>
      {s.text}
    </span>
  );
}

function LeaveCard({ item: l }: { item: LeaveItem }) {
  const days = Math.round(
    (new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / 86400000,
  ) + 1;
  return (
    <div className="bg-white rounded-2xl border border-cream-200 p-3.5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Umbrella className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-ink">{LEAVE_TYPE_AR[l.leave_type] || l.leave_type}</div>
            <div className="text-[10px] text-ink-soft">{new Date(l.created_at).toLocaleDateString('en-GB')}</div>
          </div>
        </div>
        <StatusBadge status={l.status} />
      </div>
      <div className="flex items-center gap-2 text-xs text-ink mb-1">
        <Calendar className="w-3 h-3 text-gold-deep" />
        <span className="font-en-display">{l.start_date}</span>
        <span>←</span>
        <span className="font-en-display">{l.end_date}</span>
        <span className="text-ink-soft">({days} يوم)</span>
      </div>
      {l.reason && (
        <div className="text-xs text-ink-soft mt-2 bg-cream-50 rounded-lg p-2">
          <strong>السبب:</strong> {l.reason}
        </div>
      )}
      {l.review_note && (
        <div className="text-xs mt-2 bg-gold-light/10 rounded-lg p-2">
          <strong className="text-gold-deep">ملاحظة الإدارة:</strong> {l.review_note}
        </div>
      )}
    </div>
  );
}

function PermissionCard({ item: p }: { item: PermissionItem }) {
  const typeInfo = PERMISSION_TYPE[p.request_type];
  return (
    <div className="bg-white rounded-2xl border border-cream-200 p-3.5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <typeInfo.icon className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-ink">{typeInfo.text}</div>
            <div className="text-[10px] text-ink-soft">{new Date(p.created_at).toLocaleDateString('en-GB')}</div>
          </div>
        </div>
        <StatusBadge status={p.status} />
      </div>
      <div className="flex items-center gap-2 text-xs text-ink mb-1">
        <Calendar className="w-3 h-3 text-gold-deep" />
        <span className="font-en-display">{p.request_date}</span>
        <span className="opacity-30">·</span>
        <Clock className="w-3 h-3 text-gold-deep" />
        <span className="font-en-display">{p.requested_time.slice(0, 5)}</span>
        {p.duration_min && (
          <>
            <span className="opacity-30">·</span>
            <span className="text-ink-soft">{p.duration_min} دقيقة</span>
          </>
        )}
      </div>
      <div className="text-xs text-ink-soft mt-2 bg-cream-50 rounded-lg p-2">
        <strong>السبب:</strong> {p.reason}
      </div>
      {p.review_note && (
        <div className="text-xs mt-2 bg-gold-light/10 rounded-lg p-2">
          <strong className="text-gold-deep">ملاحظة الإدارة:</strong> {p.review_note}
        </div>
      )}
    </div>
  );
}

function SwapCard({
  item: s, currentUserId, onRefresh,
}: {
  item: SwapItem; currentUserId: string; onRefresh: () => void;
}) {
  const isRequester = s.requester_id === currentUserId;
  const isRecipient = s.recipient_id === currentUserId;
  const [busy, setBusy] = useState(false);

  async function respond(response: 'accept' | 'decline') {
    setBusy(true);
    const res = await fetch('/api/account/swaps', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, response }),
    });
    setBusy(false);
    if (!res.ok) {
      const d = await res.json();
      toast.error(d.error || 'فشل');
      return;
    }
    toast.success(response === 'accept' ? 'وافقتِ على التبديل' : 'رفضتِ التبديل');
    onRefresh();
  }

  const otherName = isRequester ? s.recipient?.full_name : s.requester?.full_name;

  return (
    <div className="bg-white rounded-2xl border border-cream-200 p-3.5">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
            <Repeat className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-ink">
              {isRequester ? `طلبتِ من ${otherName || 'زميلة'}` : `طلب من ${otherName || 'زميلة'}`}
            </div>
            <div className="text-[10px] text-ink-soft">{new Date(s.created_at).toLocaleDateString('en-GB')}</div>
          </div>
        </div>
        <StatusBadge status={s.status} />
      </div>
      <div className="flex items-center gap-2 text-xs text-ink mb-1">
        <Calendar className="w-3 h-3 text-gold-deep" />
        <span className="font-en-display">{s.requester_date}</span>
        {s.recipient_date && (
          <>
            <Repeat className="w-3 h-3 opacity-50" />
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
          <strong className="text-gold-deep">ملاحظة الإدارة:</strong> {s.review_note}
        </div>
      )}

      {/* أزرار الموافقة · فقط للمستقبِلة لو الطلب pending */}
      {isRecipient && s.status === 'pending' && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-cream-100">
          <button
            onClick={() => respond('accept')}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            وافقي
          </button>
          <button
            onClick={() => respond('decline')}
            disabled={busy}
            className="flex-1 flex items-center justify-center gap-1 py-2 bg-rose-50 text-rose-700 rounded-lg text-xs font-bold disabled:opacity-50"
          >
            <X className="w-3 h-3" />
            اعتذري
          </button>
        </div>
      )}
    </div>
  );
}

// ─── النموذج الموحّد لطلب جديد ───────────────────────────
function NewRequestForm({ onDone }: { onDone: () => void }) {
  const [kind, setKind] = useState<RequestKind | null>(null);

  if (!kind) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-ink-soft mb-3">اختاري نوع الطلب:</p>
        <OptionButton icon={Umbrella} title="طلب إجازة"       sub="سنوية · مرضية · طارئة · أخرى" onClick={() => setKind('leave')} />
        <OptionButton icon={Clock}    title="طلب إذن"         sub="انصراف مبكّر · تأخّر · استراحة" onClick={() => setKind('permission')} />
        <OptionButton icon={Repeat}   title="طلب تبديل دوام" sub="مع زميلة"                       onClick={() => setKind('swap')} />
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setKind(null)}
        className="text-xs text-ink-soft mb-3 flex items-center gap-1 hover:text-gold-deep"
      >
        ← رجوع
      </button>
      {kind === 'leave'      && <NewLeaveForm      onDone={onDone} />}
      {kind === 'permission' && <NewPermissionForm onDone={onDone} />}
      {kind === 'swap'       && <NewSwapForm       onDone={onDone} />}
    </div>
  );
}

function OptionButton({
  icon: Icon, title, sub, onClick,
}: { icon: typeof Clock; title: string; sub: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3.5 rounded-2xl border border-cream-200 bg-white hover:border-gold-light hover:bg-gold-light/5 transition-all text-right"
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-light/15 to-gold-light/5 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-gold-deep" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-bold text-sm text-ink">{title}</div>
        <div className="text-[11px] text-ink-soft truncate">{sub}</div>
      </div>
      <MessageSquare className="w-3 h-3 opacity-30 rotate-180" />
    </button>
  );
}
