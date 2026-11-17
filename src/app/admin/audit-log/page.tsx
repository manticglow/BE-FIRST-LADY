/**
 * /admin/audit-log — سجلّ العمليّات الحسّاسة (owner فقط)
 */
'use client';

import { useState, useEffect } from 'react';
import { Shield, Loader2, Check, X, Filter } from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  useEffect(() => { load(); }, [filter]);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('success', filter === 'success' ? 'true' : 'false');
    const r = await fetch(`/api/admin/audit-log?${params}`);
    const d = await r.json();
    if (d.ok) setLogs(d.logs);
    setLoading(false);
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto pb-32">
      <div className="mb-6">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep flex items-center gap-2">
          <Shield className="w-7 h-7" />
          سجلّ الأمان
        </h1>
        <p className="text-ink-soft text-sm mt-1">كل عمليّة حسّاسة · مع التاريخ · الجهاز · والنتيجة</p>
      </div>

      <div className="inline-flex bg-white rounded-xl border border-cream-200 p-1 mb-4">
        {(['all', 'success', 'failed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${filter === f ? 'bg-gold-deep text-white' : 'text-ink-soft hover:bg-cream-50'}`}
          >
            {f === 'all' ? 'الكل' : f === 'success' ? '✓ نجاح' : '✗ فشل'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gold-deep mx-auto" /></div>
      ) : (
        <div className="bg-white rounded-3xl border border-cream-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-50 border-b border-cream-200">
                <tr>
                  <th className="text-right py-2.5 px-4 text-xs font-bold text-ink-soft">النتيجة</th>
                  <th className="text-right py-2.5 px-4 text-xs font-bold text-ink-soft">العمليّة</th>
                  <th className="text-right py-2.5 px-4 text-xs font-bold text-ink-soft">المستخدمة</th>
                  <th className="text-right py-2.5 px-4 text-xs font-bold text-ink-soft">IP</th>
                  <th className="text-right py-2.5 px-4 text-xs font-bold text-ink-soft">الوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {logs.length === 0 ? (
                  <tr><td colSpan={5} className="py-10 text-center text-ink-soft text-xs">لا توجد سجلّات</td></tr>
                ) : logs.map((l) => (
                  <tr key={l.id} className="hover:bg-cream-50/50">
                    <td className="py-2.5 px-4">
                      {l.success ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          <Check className="w-3 h-3" /> نجاح
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          <X className="w-3 h-3" /> فشل
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-en-display text-xs text-ink">{l.action}</td>
                    <td className="py-2.5 px-4 text-xs text-ink-soft">{l.user_email || '—'}</td>
                    <td className="py-2.5 px-4 font-en-display text-[10px] text-ink-soft">{l.ip_address || '—'}</td>
                    <td className="py-2.5 px-4 text-[10px] text-ink-soft">
                      {new Date(l.created_at).toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
