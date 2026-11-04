/**
 * HealthDashboard — عرض حالة النظام + سجلّ الأخطاء
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Activity, AlertTriangle, CheckCircle2, XCircle, Loader2,
  Clock, Database, TrendingUp, Zap, RefreshCw,
} from 'lucide-react';

interface HealthCheck {
  name: string;
  ok: boolean;
  latency_ms?: number;
  message?: string;
}

interface HealthStatus {
  status: 'healthy' | 'degraded';
  timestamp: string;
  checks: HealthCheck[];
  uptime_s: number;
}

interface ApiError {
  id: string;
  path: string;
  method: string;
  message: string;
  duration_ms: number | null;
  resolved: boolean;
  created_at: string;
}

interface ErrorsData {
  errors: ApiError[];
  stats: {
    unresolved: number;
    last_24h: number;
    top_paths: { path: string; count: number }[];
  };
}

export default function HealthDashboard() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [errors, setErrors] = useState<ErrorsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [h, e] = await Promise.all([
        fetch('/api/health').then((r) => r.json()),
        fetch('/api/admin/errors').then((r) => r.json()),
      ]);
      setHealth(h);
      setErrors(e);
    } catch {
      toast.error('تعذّر التحميل');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000); // refresh كل 30 ثانية
    return () => clearInterval(id);
  }, [load]);

  async function resolveError(id: string) {
    await fetch('/api/admin/errors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, resolved: true }),
    });
    load();
  }

  if (loading && !health) {
    return <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" /></div>;
  }

  const allOk = health?.status === 'healthy';

  return (
    <div className="space-y-6">
      {/* بطاقة الحالة العامّة */}
      <div className={`rounded-3xl p-5 border-2 ${
        allOk
          ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
          : 'bg-gradient-to-br from-rose-50 to-amber-50 border-rose-200'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
              allOk ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}>
              {allOk ? <CheckCircle2 className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
            </div>
            <div>
              <div className="font-en-label text-[10px] tracking-wider text-ink-soft">SYSTEM STATUS</div>
              <div className="font-ar-display font-bold text-xl">
                {allOk ? '✅ كل شي يشتغل تمام' : '⚠️ فيه مشاكل'}
              </div>
              {health && (
                <div className="text-xs text-ink-soft mt-0.5 font-en-display">
                  uptime: {Math.floor((health.uptime_s || 0) / 60)}m · last check: {new Date(health.timestamp).toLocaleTimeString('en-GB')}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={load}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            title="تحديث"
          >
            <RefreshCw className={`w-5 h-5 text-ink-soft ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* فحوصات تفصيليّة */}
        {health && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
            {health.checks.map((c) => <CheckBadge key={c.name} check={c} />)}
          </div>
        )}
      </div>

      {/* إحصائيّات الأخطاء */}
      {errors && (
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={AlertTriangle}
            label="غير محلولة"
            value={errors.stats.unresolved}
            color="from-rose-50 to-amber-50 text-rose-700 border-rose-200"
          />
          <StatCard
            icon={Clock}
            label="آخر 24 ساعة"
            value={errors.stats.last_24h}
            color="from-amber-50 to-rose-50 text-amber-700 border-amber-200"
          />
          <StatCard
            icon={TrendingUp}
            label="الأعلى"
            value={errors.stats.top_paths[0]?.count || 0}
            sub={errors.stats.top_paths[0]?.path || '—'}
            color="from-blue-50 to-violet-50 text-blue-700 border-blue-200"
          />
        </div>
      )}

      {/* قائمة الأخطاء */}
      <div>
        <h2 className="font-ar-display font-bold text-gold-deep mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          آخر الأخطاء
        </h2>

        {errors?.errors && errors.errors.length > 0 ? (
          <div className="space-y-2">
            {errors.errors.map((e) => <ErrorRow key={e.id} error={e} onResolve={resolveError} />)}
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <div className="font-ar-display font-bold text-emerald-700">ما فيه أخطاء 🎉</div>
          </div>
        )}
      </div>

      {/* ملاحظة */}
      <div className="bg-gradient-to-br from-gold-light/10 to-cream-50 border border-gold-light/30 rounded-2xl p-4 text-xs text-ink-soft">
        <div className="flex items-start gap-2">
          <Zap className="w-4 h-4 text-gold-deep shrink-0 mt-0.5" />
          <div>
            <strong className="text-gold-deep">نصائح:</strong>
            <ul className="mt-1 space-y-0.5 pr-4">
              <li>• الصفحة تُحدَّث تلقائياً كل 30 ثانية</li>
              <li>• الأخطاء تُحفظ لـ30 يوم ثم تُحذف</li>
              <li>• <strong>UptimeRobot:</strong> أضيفي monitor على <code className="bg-cream-200 px-1.5 rounded font-en-display">/api/health</code> للتنبيه الفوري</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckBadge({ check }: { check: HealthCheck }) {
  return (
    <div className={`rounded-xl p-3 border ${check.ok ? 'bg-white border-emerald-200' : 'bg-rose-50 border-rose-300'}`}>
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-ink flex items-center gap-1.5">
          {check.ok ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
          )}
          {check.name}
        </div>
        {check.latency_ms !== undefined && (
          <span className="text-[10px] text-ink-soft font-en-display">{check.latency_ms}ms</span>
        )}
      </div>
      {check.message && (
        <div className="text-[10px] text-ink-soft mt-1 truncate">{check.message}</div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, sub, color,
}: {
  icon: typeof Activity; label: string; value: number; sub?: string; color: string;
}) {
  return (
    <div className={`rounded-2xl p-3 bg-gradient-to-br border ${color}`}>
      <div className="flex items-center gap-1 text-[10px] opacity-80 mb-1">
        <Icon className="w-3 h-3" />
        <span>{label}</span>
      </div>
      <div className="font-en-display font-bold text-2xl leading-none">{value}</div>
      {sub && <div className="text-[9px] opacity-70 mt-1 truncate">{sub}</div>}
    </div>
  );
}

function ErrorRow({ error, onResolve }: { error: ApiError; onResolve: (id: string) => void }) {
  return (
    <div className={`bg-white border rounded-xl p-3 ${error.resolved ? 'opacity-50 border-cream-200' : 'border-rose-200'}`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-en-display ${
            error.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'
          }`}>
            {error.method}
          </span>
          <code className="text-xs text-ink truncate font-en-display">{error.path}</code>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {error.duration_ms && (
            <span className="text-[10px] text-ink-soft font-en-display">{error.duration_ms}ms</span>
          )}
          {!error.resolved && (
            <button
              onClick={() => onResolve(error.id)}
              className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 font-bold"
            >
              حلّ ✓
            </button>
          )}
        </div>
      </div>
      <div className="text-xs text-rose-700 bg-rose-50 rounded p-1.5 line-clamp-2">
        {error.message}
      </div>
      <div className="text-[10px] text-ink-soft mt-1.5 font-en-display">
        {new Date(error.created_at).toLocaleString('en-GB')}
      </div>
    </div>
  );
}
