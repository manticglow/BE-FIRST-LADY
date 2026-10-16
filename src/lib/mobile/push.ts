/**
 * Push Notifications — إشعارات ناتيف
 * ═══════════════════════════════════════════════════════════
 * - تسجيل الجهاز لاستلام الإشعارات
 * - حفظ الـ FCM/APNs token في Supabase (جدول device_tokens)
 * - استقبال الإشعارات في الـ foreground + background
 *
 * الاستخدام (في layout العميلة):
 *   useEffect(() => { initPush(userId) }, [userId]);
 */

'use client';

import { isNative, isIOS } from './platform';
import { createClient } from '@/lib/supabase/client';

interface PushPermission { granted: boolean; }

export async function initPush(userId: string | null): Promise<PushPermission> {
  if (!isNative() || !userId) return { granted: false };

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // 1. اطلبي الإذن
    const perm = await PushNotifications.requestPermissions();
    if (perm.receive !== 'granted') return { granted: false };

    // 2. سجّلي الجهاز
    await PushNotifications.register();

    // 3. استمعي لتسجيل التوكن
    PushNotifications.addListener('registration', async (token) => {
      await saveDeviceToken(userId, token.value);
    });

    // 4. استمعي للإشعارات القادمة (التطبيق مفتوح)
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      // ممكن تظهري Toast هنا
      console.log('[Push]', notification.title, notification.body);
    });

    // 5. استمعي لنقر الإشعار (التطبيق خلفي أو مغلق)
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const data = action.notification.data;
      if (data?.booking_id) {
        window.location.href = `/account/bookings/${data.booking_id}`;
      } else if (data?.url) {
        window.location.href = data.url;
      }
    });

    return { granted: true };
  } catch (e) {
    console.error('[Push] init failed:', e);
    return { granted: false };
  }
}

async function saveDeviceToken(userId: string, token: string) {
  const supabase = createClient();
  await supabase.from('device_tokens').upsert({
    user_id: userId,
    token,
    platform: isIOS() ? 'ios' : 'android',
    last_seen: new Date().toISOString(),
  }, { onConflict: 'token' });
}

export async function removePushListeners() {
  if (!isNative()) return;
  const { PushNotifications } = await import('@capacitor/push-notifications');
  await PushNotifications.removeAllListeners();
}
