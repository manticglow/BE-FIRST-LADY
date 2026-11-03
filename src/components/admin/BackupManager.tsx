/**
 * BackupManager — واجهة إدارة النسخ الاحتياطيّة
 */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Cloud, Download, Loader2, CheckCircle2, XCircle,
  Settings, Play, HardDrive, Calendar, Clock, AlertCircle,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface Config {
  id: string;
  provider: 'google_drive' | 'onedrive' | 'dropbox' | 's3' | 'manual';
  is_active: boolean;
  schedule: string;
  time_of_day: string;
  folder_path: string;
  include_db: boolean;
  include_uploads: boolean;
  retention_days: number;
  last_run_at: string | null;
  last_status: string | null;
  last_error: string | null;
}

interface Run {
  id: string;
  provider: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  size_bytes: number | null;
  file_url: string | null;
  error_message: string | null;
  trigger_type: string;
}

const PROVIDER_INFO: Record<string, { name: string; icon: string; color: string }> = {
  google_drive: { name: 'Google Drive',  icon: '📁', color: 'bg-blue-50 text-blue-700' },
  onedrive:     { name: 'OneDrive',      icon: '☁️', color: 'bg-sky-50 text-sky-700' },
  dropbox:      { name: 'Dropbox',       icon: '📦', color: 'bg-indigo-50 text-indigo-700' },
  s3:           { name: 'Amazon S3',     icon: '🪣', color: 'bg-amber-50 text-amber-700' },
  manual:       { name: 'تحميل يدوي',    icon: '💾', color: 'bg-stone-50 text-stone-700' },
};

export default function BackupManager() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Config> | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/backup');
    const data = await res.json();
    setConfigs(data.configs || []);
    setRuns(data.runs || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function runNow(configId: string) {
    setRunningId(configId);
    const res = await fetch('/api/admin/backup', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config_id: configId }),
    });
    setRunningId(null);
    const d = await res.json();
    if (!res.ok) {
      toast.error(d.error || 'فشلت النسخة');
      return;
    }
    toast.success(`✅ تمّت النسخة · ${formatBytes(d.size)}`);
    load();
  }

  if (loading) {
    return <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* الإعدادات الحاليّة */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-ar-display font-bold text-gold-deep flex items-center gap-2">
            <Settings className="w-4 h-4" />
            إعدادات النسخ
          </h2>
          <button
            onClick={() => setEditing({ provider: 'google_drive', schedule: 'daily', time_of_day: '03:00', is_active: false, include_db: true, include_uploads: true, retention_days: 30, folder_path: 'BeFirstLady/Backups' })}
            className="text-xs bg-gold-deep text-cream-50 px-3 py-1.5 rounded-lg font-bold hover:bg-ink"
          >
            + إضافة مزوّد
          </button>
        </div>

        {configs.length === 0 ? (
          <div className="bg-cream-50 border border-cream-200 rounded-2xl p-8 text-center">
            <Cloud className="w-10 h-10 text-cream-300 mx-auto mb-2" />
            <div className="text-sm text-ink-soft mb-3">ما فيه مزوّدات مُعدّة</div>
            <p className="text-[11px] text-ink-soft">
              أضيفي Google Drive أو OneDrive للحصول على نسخ احتياطيّة تلقائيّة
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {configs.map((c) => (
              <ConfigCard key={c.id} config={c} onEdit={setEditing} onRun={runNow} runningId={runningId} />
            ))}
          </div>
        )}
      </section>

      {/* سجلّ التشغيل */}
      <section>
        <h2 className="font-ar-display font-bold text-gold-deep mb-3 flex items-center gap-2">
          <HardDrive className="w-4 h-4" />
          سجلّ آخر 20 نسخة
        </h2>

        {runs.length === 0 ? (
          <div className="bg-cream-50 border border-cream-200 rounded-2xl p-6 text-center text-sm text-ink-soft">
            ما فيه نسخ سابقة
          </div>
        ) : (
          <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-cream-200">
                <tr>
                  <th className="text-right p-3 text-xs font-bold text-ink-soft">المزوّد</th>
                  <th className="text-right p-3 text-xs font-bold text-ink-soft">التاريخ</th>
                  <th className="text-right p-3 text-xs font-bold text-ink-soft">الحالة</th>
                  <th className="text-right p-3 text-xs font-bold text-ink-soft">الحجم</th>
                  <th className="text-right p-3 text-xs font-bold text-ink-soft"></th>
                </tr>
              </thead>
              <tbody>
                {runs.map((r) => <RunRow key={r.id} run={r} />)}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal التحرير */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        size="md"
        title="إعدادات النسخ الاحتياطيّة"
        padded={false}
      >
        {editing && <ConfigForm config={editing} onSave={async (cfg) => {
          const res = await fetch('/api/admin/backup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cfg),
          });
          if (!res.ok) {
            const d = await res.json();
            toast.error(d.error || 'فشل');
            return;
          }
          toast.success('تمّ الحفظ 🌸');
          setEditing(null);
          load();
        }} onCancel={() => setEditing(null)} />}
      </Modal>
    </div>
  );
}

function ConfigCard({
  config: c, onEdit, onRun, runningId,
}: {
  config: Config;
  onEdit: (c: Config) => void;
  onRun: (id: string) => void;
  runningId: string | null;
}) {
  const info = PROVIDER_INFO[c.provider];
  const isRunning = runningId === c.id;

  return (
    <div className={`bg-white border rounded-2xl p-4 ${c.is_active ? 'border-emerald-200' : 'border-cream-200'}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-xl ${info.color} flex items-center justify-center text-lg`}>
            {info.icon}
          </div>
          <div>
            <div className="font-bold text-sm text-ink">{info.name}</div>
            <div className="text-[10px] text-ink-soft">
              {c.schedule === 'daily' ? 'يوميّاً' : c.schedule === 'weekly' ? 'أسبوعياً' : c.schedule === 'monthly' ? 'شهريّاً' : 'يدوي'}
              {' · '}
              <span className="font-en-display">{c.time_of_day}</span>
            </div>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
          c.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'
        }`}>
          {c.is_active ? 'نشطة' : 'معطّلة'}
        </span>
      </div>

      {c.last_run_at && (
        <div className="text-[10px] text-ink-soft mb-3">
          آخر تشغيل: <span className="font-en-display">{new Date(c.last_run_at).toLocaleString('en-GB')}</span>
          {c.last_status === 'success' && <CheckCircle2 className="w-3 h-3 text-emerald-600 inline mr-1" />}
          {c.last_status === 'failed' && <XCircle className="w-3 h-3 text-rose-600 inline mr-1" />}
        </div>
      )}

      {c.last_error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-[10px] text-rose-700 mb-3">
          <strong>آخر خطأ:</strong> {c.last_error}
        </div>
      )}

      <div className="flex gap-2">
        <button onClick={() => onEdit(c)} className="flex-1 py-1.5 bg-cream-100 hover:bg-cream-200 text-ink rounded-lg text-xs font-bold flex items-center justify-center gap-1">
          <Settings className="w-3 h-3" />
          إعدادات
        </button>
        <button
          onClick={() => onRun(c.id)}
          disabled={isRunning}
          className="flex-1 py-1.5 bg-gold-deep text-cream-50 rounded-lg text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-50"
        >
          {isRunning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          {isRunning ? 'جارِ...' : 'شغّلي الآن'}
        </button>
      </div>
    </div>
  );
}

function RunRow({ run: r }: { run: Run }) {
  return (
    <tr className="border-b border-cream-100 last:border-b-0 hover:bg-cream-50">
      <td className="p-3 text-xs">{PROVIDER_INFO[r.provider]?.name || r.provider}</td>
      <td className="p-3 text-xs text-ink-soft font-en-display">
        {new Date(r.started_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </td>
      <td className="p-3">
        {r.status === 'success' && <span className="text-[10px] font-bold text-emerald-600 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />نجحت</span>}
        {r.status === 'failed' && <span className="text-[10px] font-bold text-rose-600 inline-flex items-center gap-1"><XCircle className="w-3 h-3" />فشلت</span>}
        {r.status === 'running' && <span className="text-[10px] font-bold text-amber-600 inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />جارِ...</span>}
      </td>
      <td className="p-3 text-xs text-ink-soft font-en-display">
        {r.size_bytes ? formatBytes(r.size_bytes) : '—'}
      </td>
      <td className="p-3 text-left">
        {r.file_url && (
          <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold-deep font-bold hover:underline inline-flex items-center gap-1">
            <Download className="w-3 h-3" />
            فتح
          </a>
        )}
      </td>
    </tr>
  );
}

function ConfigForm({
  config, onSave, onCancel,
}: {
  config: Partial<Config>;
  onSave: (c: Partial<Config> & { credentials?: Record<string, string> }) => Promise<void>;
  onCancel: () => void;
}) {
  const [c, setC] = useState<Partial<Config> & { credentials?: Record<string, string> }>(config);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await onSave(c);
    setBusy(false);
  }

  return (
    <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
      {/* المزوّد */}
      <div>
        <label className="block text-xs font-bold text-gold-deep mb-2">المزوّد</label>
        <div className="grid grid-cols-3 gap-2">
          {(['google_drive', 'onedrive', 'manual'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setC({ ...c, provider: p })}
              className={`py-3 rounded-xl border-2 text-xs font-bold flex flex-col items-center gap-1 ${
                c.provider === p ? 'bg-gold-deep text-cream-50 border-gold-deep' : 'bg-white border-cream-200 text-ink hover:border-gold-light'
              }`}
            >
              <span className="text-lg">{PROVIDER_INFO[p].icon}</span>
              <span>{PROVIDER_INFO[p].name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* الـcredentials حسب المزوّد */}
      {c.provider === 'google_drive' && (
        <div className="space-y-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[11px] text-blue-800 flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              تحتاجين OAuth من Google Cloud Console. <br />
              <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline font-bold">افتحي Cloud Console</a>
            </div>
          </div>
          <Field label="Client ID" value={c.credentials?.client_id || ''} onChange={(v) => setC({ ...c, credentials: { ...c.credentials, client_id: v } })} />
          <Field label="Client Secret" value={c.credentials?.client_secret || ''} onChange={(v) => setC({ ...c, credentials: { ...c.credentials, client_secret: v } })} secret />
          <Field label="Refresh Token" value={c.credentials?.refresh_token || ''} onChange={(v) => setC({ ...c, credentials: { ...c.credentials, refresh_token: v } })} secret />
          <Field label="Folder ID (اختياري)" value={c.credentials?.folder_id || ''} onChange={(v) => setC({ ...c, credentials: { ...c.credentials, folder_id: v } })} />
        </div>
      )}

      {c.provider === 'onedrive' && (
        <div className="space-y-2">
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-[11px] text-sky-800 flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              سجّلي تطبيقاً في <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className="underline font-bold">Azure Portal</a> واحصلي على Client ID + Refresh Token.
            </div>
          </div>
          <Field label="Client ID" value={c.credentials?.client_id || ''} onChange={(v) => setC({ ...c, credentials: { ...c.credentials, client_id: v } })} />
          <Field label="Refresh Token" value={c.credentials?.refresh_token || ''} onChange={(v) => setC({ ...c, credentials: { ...c.credentials, refresh_token: v } })} secret />
        </div>
      )}

      {/* الجدول الزمني */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            التكرار
          </label>
          <select
            value={c.schedule || 'daily'}
            onChange={(e) => setC({ ...c, schedule: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm"
          >
            <option value="daily">يوميّاً</option>
            <option value="weekly">أسبوعياً</option>
            <option value="monthly">شهريّاً</option>
            <option value="manual">يدوي فقط</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-ink mb-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            الوقت (UTC)
          </label>
          <input
            type="time"
            value={c.time_of_day || '03:00'}
            onChange={(e) => setC({ ...c, time_of_day: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm font-en-display"
          />
        </div>
      </div>

      <Field label="مسار المجلّد" value={c.folder_path || ''} onChange={(v) => setC({ ...c, folder_path: v })} />

      <div className="flex items-center gap-2 py-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={c.is_active ?? false}
            onChange={(e) => setC({ ...c, is_active: e.target.checked })}
            className="w-4 h-4 accent-gold-deep"
          />
          <span>مفعّلة (تشتغل تلقائياً)</span>
        </label>
      </div>

      {/* أزرار */}
      <div className="flex gap-2 pt-3 border-t border-cream-100">
        <button onClick={onCancel} className="btn-outline !py-2 flex-1 text-sm">إلغاء</button>
        <button onClick={save} disabled={busy} className="btn-primary !py-2 flex-1 text-sm disabled:opacity-50 flex items-center justify-center gap-1">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          حفظ
        </button>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, secret,
}: {
  label: string; value: string; onChange: (v: string) => void; secret?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-ink mb-1.5">{label}</label>
      <input
        type={secret ? 'password' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl border border-cream-200 bg-cream-50 outline-none text-sm font-en-display"
        dir="ltr"
      />
    </div>
  );
}

function formatBytes(b: number | null): string {
  if (!b) return '—';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}
