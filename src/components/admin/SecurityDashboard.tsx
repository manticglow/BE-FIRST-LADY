'use client';

/**
 * SecurityDashboard — لوحة الأمن للمالكة
 * ═══════════════════════════════════════════════════════════
 */
import { useState } from 'react';
import {
  Shield, AlertTriangle, CheckCircle2, XCircle, Clock,
  Activity, UserCheck, Lock, Globe,
} from 'lucide-react';

export type AuditLog = {
  id: number;
  user_email: string | null;
  user_role: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: unknown;
  ip_address: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
};

export type LoginAttempt = {
  id: number;
  identifier: string;
  ip_address: string | null;
  success: boolean;
  error_type: string | null;
  user_agent: string | null;
  created_at: string;
};

const ACTION_LABELS: Record<string, string> = {
  'auth.login': 'تسجيل دخول',
  'auth.logout': 'تسجيل خروج',
  'auth.otp.send': 'إرسال رمز OTP',
  'auth.otp.verify': 'تحقّق OTP',
  'booking.create': 'إنشاء حجز',
  'booking.update': 'تعديل حجز',
  'booking.cancel': 'إلغاء حجز',
  'booking.delete': 'حذف حجز',
  'booking.manual_create': 'حجز يدوي',
  'gift_card.issue': 'إصدار بطاقة',
  'gift_card.redeem': 'استخدام بطاقة',
  'gift_card.deactivate': 'تعطيل بطاقة',
  'customer.notes_update': 'تعديل ملاحظات عميلة',
  'customer.delete': 'حذف عميلة',
  'expense.create': 'إضافة مصروف',
  'expense.delete': 'حذف مصروف',
  'admin.staff.create': 'إضافة موظفة',
  'admin.staff.update': 'تعديل موظفة',
  'admin.staff.delete': 'حذف موظفة',
  'admin.settings.update': 'تعديل إعدادات',
  'admin.data.export': 'تصدير بيانات',
};

export default function SecurityDashboard({
  audits, logins,
}: {
  audits: AuditLog[];
  logins: LoginAttempt[];
}) {
  const [tab, setTab] = useState<'overview' | 'audit' | 'logins'>('overview');

  // ─── إحصائيّات ───
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayAudits = audits.filter((a) => new Date(a.created_at) >= todayStart);
  const todayLogins = logins.filter((l) => new Date(l.created_at) >= todayStart);
  const failedToday = todayLogins.filter((l) => !l.success).length;
  const successToday = todayLogins.filter((l) => l.success).length;

  // IPs مشبوهة (أكثر من 5 محاولات فاشلة)
  const ipAttempts = logins.reduce<Record<string, number>>((acc, l) => {
    if (!l.success && l.ip_address) {
      acc[l.ip_address] = (acc[l.ip_address] || 0) + 1;
    }
    return acc;
  }, {});
  const suspiciousIps = Object.entries(ipAttempts).filter(([, c]) => c >= 5);

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900 rounded-3xl p-6 md:p-8 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="relative">
          <div className="editorial-eyebrow text-white/60 mb-2">SECURITY CENTER</div>
          <h1 className="font-ar-display text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8" />
            مركز الأمن والمراقبة
          </h1>
          <p className="text-white/70 text-sm">
            سجل كامل للعمليّات الحسّاسة · محاولات الدخول · التنبيهات
          </p>
        </div>
      </div>

      {/* Alerts */}
      {suspiciousIps.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold text-red-900 mb-1">
                🚨 تنبيه · {suspiciousIps.length} عنوان IP مشبوه
              </div>
              <div className="text-sm text-red-700">
                {suspiciousIps.map(([ip, count]) => (
                  <div key={ip} className="font-mono">
                    {ip} — {count} محاولة فاشلة
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Activity}
          label="عمليّات اليوم"
          value={todayAudits.length}
          color="indigo"
        />
        <StatCard
          icon={UserCheck}
          label="دخول ناجح"
          value={successToday}
          color="emerald"
        />
        <StatCard
          icon={XCircle}
          label="دخول فاشل"
          value={failedToday}
          color="red"
        />
        <StatCard
          icon={Globe}
          label="IPs مشبوهة"
          value={suspiciousIps.length}
          color="amber"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-stone-200">
        <TabBtn active={tab === 'overview'} onClick={() => setTab('overview')}>
          نظرة عامّة
        </TabBtn>
        <TabBtn active={tab === 'audit'} onClick={() => setTab('audit')}>
          سجل العمليّات ({audits.length})
        </TabBtn>
        <TabBtn active={tab === 'logins'} onClick={() => setTab('logins')}>
          محاولات الدخول ({logins.length})
        </TabBtn>
      </div>

      {/* Content */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <SecurityChecklist />
        </div>
      )}

      {tab === 'audit' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="divide-y divide-stone-100">
            {audits.length === 0 ? (
              <div className="p-8 text-center text-stone-500">لا يوجد عمليّات بعد</div>
            ) : audits.slice(0, 50).map((a) => (
              <AuditRow key={a.id} audit={a} />
            ))}
          </div>
        </div>
      )}

      {tab === 'logins' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="divide-y divide-stone-100">
            {logins.length === 0 ? (
              <div className="p-8 text-center text-stone-500">لا يوجد محاولات بعد</div>
            ) : logins.map((l) => (
              <LoginRow key={l.id} login={l} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: any) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  return (
    <div className={`rounded-2xl p-4 border-2 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-5 h-5 opacity-70" />
        <div className="text-2xl font-bold">{value}</div>
      </div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: any) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-bold transition-colors border-b-2 ${
        active
          ? 'text-indigo-700 border-indigo-600'
          : 'text-stone-500 border-transparent hover:text-stone-700'
      }`}
    >
      {children}
    </button>
  );
}

function AuditRow({ audit }: { audit: AuditLog }) {
  const label = ACTION_LABELS[audit.action] || audit.action;
  return (
    <div className="p-3 flex items-start gap-3 hover:bg-stone-50">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        audit.success ? 'bg-emerald-100' : 'bg-red-100'
      }`}>
        {audit.success
          ? <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          : <XCircle className="w-4 h-4 text-red-700" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm text-stone-900">{label}</span>
          {audit.user_role && (
            <span className="px-2 py-0.5 text-[10px] bg-indigo-50 text-indigo-700 rounded-full">
              {audit.user_role}
            </span>
          )}
          {audit.resource_type && (
            <span className="text-[11px] text-stone-500">
              · {audit.resource_type}{audit.resource_id ? ` #${audit.resource_id.slice(0, 8)}` : ''}
            </span>
          )}
        </div>
        <div className="text-xs text-stone-600 mt-0.5 flex items-center gap-2 flex-wrap">
          {audit.user_email && (
            <span className="truncate max-w-[200px]">{audit.user_email}</span>
          )}
          {audit.ip_address && (
            <span className="font-mono text-[10px] text-stone-400">{audit.ip_address}</span>
          )}
        </div>
        {audit.error_message && (
          <div className="text-xs text-red-600 mt-1">⚠️ {audit.error_message}</div>
        )}
      </div>
      <div className="text-[11px] text-stone-400 shrink-0 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {new Date(audit.created_at).toLocaleString('ar-SA')}
      </div>
    </div>
  );
}

function LoginRow({ login }: { login: LoginAttempt }) {
  return (
    <div className="p-3 flex items-start gap-3 hover:bg-stone-50">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        login.success ? 'bg-emerald-100' : 'bg-red-100'
      }`}>
        {login.success
          ? <Lock className="w-4 h-4 text-emerald-700" />
          : <AlertTriangle className="w-4 h-4 text-red-700" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm text-stone-900 truncate">{login.identifier}</span>
          <span className={`px-2 py-0.5 text-[10px] rounded-full ${
            login.success
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-700'
          }`}>
            {login.success ? 'نجح' : login.error_type || 'فشل'}
          </span>
        </div>
        {login.ip_address && (
          <div className="text-[11px] text-stone-500 font-mono mt-0.5">
            IP: {login.ip_address}
          </div>
        )}
      </div>
      <div className="text-[11px] text-stone-400 shrink-0 flex items-center gap-1">
        <Clock className="w-3 h-3" />
        {new Date(login.created_at).toLocaleString('ar-SA')}
      </div>
    </div>
  );
}

function SecurityChecklist() {
  const items = [
    { label: 'HTTPS مُفعّل (HSTS)', status: 'ok' },
    { label: 'منع clickjacking (X-Frame-Options)', status: 'ok' },
    { label: 'Content Security Policy', status: 'ok' },
    { label: 'Rate Limiting على OTP', status: 'ok' },
    { label: 'Audit Log', status: 'ok' },
    { label: 'تسجيل خروج تلقائي (30 دقيقة خمول)', status: 'ok' },
    { label: 'RLS على كل الجداول الحسّاسة', status: 'ok' },
    { label: 'Middleware يحمي /api/admin/*', status: 'ok' },
    { label: 'Service Role مفصول عن Anon Key', status: 'ok' },
    { label: 'Zod validation على كل الـinputs', status: 'ok' },
  ];
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <h3 className="font-ar-display font-bold text-lg mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-emerald-600" />
        قائمة فحص الأمن
      </h3>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 border-b border-stone-50 last:border-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-sm text-stone-700 flex-1">{it.label}</span>
            <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold">
              مُفعّل
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
