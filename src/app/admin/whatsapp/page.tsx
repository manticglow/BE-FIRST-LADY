/**
 * /admin/whatsapp — سجلّ رسائل الواتساب
 * ═══════════════════════════════════════════════════════════
 * • يعرض كل الرسائل المُرسلة (أو المحفوظة في Test Mode)
 * • يفرز حسب: live/test · sent/failed/test
 * • مفيد لمتابعة إرسال التأكيدات والـOTP
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MessageCircle, CheckCircle2, XCircle, TestTube, Clock } from 'lucide-react';

export const dynamic = 'force-dynamic';

type LogRow = {
  id: string;
  phone: string;
  message: string;
  template_code: string | null;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'test';
  mode: 'live' | 'test';
  gateway_message_id: string | null;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
};

const STATUS_META: Record<LogRow['status'], { label: string; cls: string; icon: any }> = {
  pending:   { label: '⏳ معلّقة',  cls: 'bg-amber-100  text-amber-700',   icon: Clock },
  sent:      { label: '✓ أُرسلت',   cls: 'bg-sky-100    text-sky-700',     icon: CheckCircle2 },
  delivered: { label: '✓✓ وصلت',   cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  failed:    { label: '✗ فشلت',    cls: 'bg-rose-100   text-rose-700',    icon: XCircle },
  test:      { label: '🧪 تجربة',   cls: 'bg-purple-100 text-purple-700',  icon: TestTube },
};

export default async function WhatsAppLogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/whatsapp');

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as { role?: string } | null)?.role;
  if (role !== 'owner' && role !== 'manager') redirect('/admin');

  const { data: logsRaw } = await admin
    .from('whatsapp_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  const logs = (logsRaw as LogRow[] | null) || [];

  // إحصائيات
  const stats = {
    total: logs.length,
    test: logs.filter(l => l.mode === 'test').length,
    sent: logs.filter(l => l.status === 'sent').length,
    failed: logs.filter(l => l.status === 'failed').length,
  };

  const testMode = process.env.WHATSAPP_TEST_MODE === 'true' || process.env.WHATSAPP_TEST_MODE === '1';

  return (
    <div className="min-h-screen bg-cream-50 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-6 h-6 text-gold-deep" />
            <h1 className="font-ar-display text-2xl font-bold text-gold-deep">سجلّ الواتساب</h1>
          </div>
          <p className="text-sm text-ink-soft">
            آخر 100 رسالة · مرتّبة من الأحدث للأقدم
          </p>
        </div>

        {/* Test Mode Banner */}
        {testMode && (
          <div className="mb-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <TestTube className="w-6 h-6 text-purple-600 shrink-0 mt-1" />
              <div className="flex-1">
                <div className="font-bold text-purple-900 mb-1">⚠️ Test Mode مُفعّل</div>
                <div className="text-sm text-purple-800">
                  الرسائل تُحفظ هنا بدل الإرسال الفعلي · ممتاز للاختبار بدون Meta.
                </div>
                <div className="text-xs text-purple-700 mt-2">
                  للتعطيل · امسحي <code className="bg-white/60 px-1 rounded">WHATSAPP_TEST_MODE</code> من Vercel Environment Variables.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label="الإجمالي" value={stats.total} color="gold" />
          <StatCard label="أُرسلت" value={stats.sent} color="emerald" />
          <StatCard label="تجربة" value={stats.test} color="purple" />
          <StatCard label="فشلت" value={stats.failed} color="rose" />
        </div>

        {/* Logs */}
        {logs.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <MessageCircle className="w-12 h-12 text-cream-300 mx-auto mb-3" />
            <h3 className="font-ar-display text-lg text-ink-soft mb-1">لا توجد رسائل بعد</h3>
            <p className="text-sm text-ink-soft/70">
              أول رسالة واتساب (حجز · OTP · تذكير) راح تظهر هنا
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const meta = STATUS_META[log.status];
              const StatusIcon = meta.icon;
              return (
                <div key={log.id} className="bg-white rounded-2xl p-4 shadow-card">
                  {/* Header row */}
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${meta.cls}`}>
                        <StatusIcon className="w-3 h-3" />
                        {meta.label}
                      </span>
                      {log.mode === 'test' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                          Test Mode
                        </span>
                      )}
                      {log.template_code && (
                        <span className="text-[10px] font-mono text-ink-soft bg-cream-100 px-2 py-0.5 rounded">
                          {log.template_code}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-ink-soft">
                      {new Date(log.created_at).toLocaleString('ar-SA', {
                        hour: '2-digit', minute: '2-digit',
                        day: 'numeric', month: 'short',
                      })}
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="text-xs text-ink-soft mb-2" dir="ltr">
                    → {log.phone}
                  </div>

                  {/* Message body */}
                  <div className="bg-cream-50 rounded-xl p-3 text-sm text-ink whitespace-pre-wrap font-mono leading-relaxed">
                    {log.message}
                  </div>

                  {/* Error */}
                  {log.error_message && (
                    <div className="mt-2 text-xs text-rose-600 bg-rose-50 rounded-lg p-2">
                      ⚠️ {log.error_message}
                    </div>
                  )}

                  {/* Message ID */}
                  {log.gateway_message_id && !log.gateway_message_id.startsWith('test-') && (
                    <div className="mt-2 text-[9px] font-mono text-ink-soft/70" dir="ltr">
                      id: {log.gateway_message_id.slice(0, 40)}...
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    gold: 'from-gold-light/20 to-gold/10 text-gold-deep',
    emerald: 'from-emerald-100 to-emerald-50 text-emerald-700',
    purple: 'from-purple-100 to-purple-50 text-purple-700',
    rose: 'from-rose-100 to-rose-50 text-rose-700',
  };
  return (
    <div className={`bg-gradient-to-br ${colorMap[color]} rounded-xl p-3 text-center`}>
      <div className="font-en-display font-bold text-2xl">{value}</div>
      <div className="text-[10px] font-medium mt-0.5 opacity-80">{label}</div>
    </div>
  );
}
