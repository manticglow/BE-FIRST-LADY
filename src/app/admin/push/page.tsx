/**
 * /admin/push — إرسال إشعارات ناتيف
 */
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import PushSender from '@/components/admin/PushSender';

export const dynamic = 'force-dynamic';

export default async function PushAdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    redirect('/admin');
  }

  // إحصائيّات
  const { count: totalDevices } = await supabase
    .from('device_tokens')
    .select('*', { count: 'exact', head: true });

  const { count: iosDevices } = await supabase
    .from('device_tokens')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'ios');

  const { count: androidDevices } = await supabase
    .from('device_tokens')
    .select('*', { count: 'exact', head: true })
    .eq('platform', 'android');

  const { data: lastLogs } = await supabase
    .from('push_notifications_log')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(20);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-ar-display text-3xl font-bold text-gold-deep">
          🔔 الإشعارات الناتيف
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          أرسلي إشعاراً لعميلة، أو لجميع المستخدمين
        </p>
      </div>

      {/* إحصائيّات */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-cream-200">
          <div className="text-xs text-ink-soft">أجهزة مسجّلة</div>
          <div className="font-en-display text-3xl font-bold text-gold-deep">
            {totalDevices || 0}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-cream-200">
          <div className="text-xs text-ink-soft">🍎 iOS</div>
          <div className="font-en-display text-3xl font-bold text-ink">
            {iosDevices || 0}
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-cream-200">
          <div className="text-xs text-ink-soft">🤖 Android</div>
          <div className="font-en-display text-3xl font-bold text-ink">
            {androidDevices || 0}
          </div>
        </div>
      </div>

      <PushSender />

      {/* سجل الإرسال */}
      <div className="mt-8">
        <h2 className="font-ar-display text-xl font-bold text-ink mb-3">
          آخر 20 إشعار
        </h2>
        <div className="bg-white rounded-2xl border border-cream-200 overflow-hidden">
          {(lastLogs || []).length === 0 ? (
            <div className="p-8 text-center text-ink-soft text-sm">
              لم تُرسلي أي إشعار بعد
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-cream-100 text-xs text-ink-soft">
                <tr>
                  <th className="p-3 text-right">العنوان</th>
                  <th className="p-3 text-right">الحالة</th>
                  <th className="p-3 text-right">الوقت</th>
                </tr>
              </thead>
              <tbody>
                {lastLogs!.map((log: any) => (
                  <tr key={log.id} className="border-t border-cream-100">
                    <td className="p-3">
                      <div className="font-bold">{log.title}</div>
                      <div className="text-xs text-ink-soft truncate max-w-md">
                        {log.body}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-md text-xs ${
                        log.status === 'sent' ? 'bg-success/10 text-success'
                        : log.status === 'failed' ? 'bg-danger/10 text-danger'
                        : 'bg-cream-100 text-ink-soft'
                      }`}>
                        {log.status === 'sent' ? 'أُرسل' : log.status === 'failed' ? 'فشل' : log.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-ink-soft">
                      {new Date(log.sent_at).toLocaleString('ar-SA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
