/**
 * Web Push helpers
 * ═══════════════════════════════════════════════════════════
 * - Uses VAPID keys from env
 * - Falls back gracefully when not configured
 */
import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/server';

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:info@befirstlady.com';

export function isWebPushConfigured(): boolean {
  return VAPID_PUBLIC.length > 0 && VAPID_PRIVATE.length > 0;
}

if (isWebPushConfigured()) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
}

export interface WebPushResult {
  ok: boolean;
  sent: number;
  failed: number;
  removedExpired: number;
  error?: string;
}

/**
 * إرسال إشعار لعميلة واحدة (كل أجهزتها)
 */
export async function sendWebPushToUser(
  userId: string, payload: PushPayload
): Promise<WebPushResult> {
  if (!isWebPushConfigured()) {
    return { ok: false, sent: 0, failed: 0, removedExpired: 0, error: 'web_push_not_configured' };
  }

  const admin = createAdminClient();
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId);

  if (!subs || subs.length === 0) {
    return { ok: false, sent: 0, failed: 0, removedExpired: 0, error: 'no_subscriptions' };
  }

  return await sendToSubs(subs as SubRow[], payload);
}

type SubRow = { id: string; endpoint: string; p256dh: string; auth: string };

/**
 * إرسال إشعار جماعي (كل المسجّلات أو حسب role)
 */
export async function sendWebPushToAll(
  payload: PushPayload, role?: string
): Promise<WebPushResult> {
  if (!isWebPushConfigured()) {
    return { ok: false, sent: 0, failed: 0, removedExpired: 0, error: 'web_push_not_configured' };
  }

  const admin = createAdminClient();
  let query = admin.from('push_subscriptions').select('id, endpoint, p256dh, auth, user_id');

  if (role) {
    const { data: profiles } = await admin.from('profiles').select('id').eq('role', role);
    const ids = ((profiles as { id: string }[] | null) || []).map((p) => p.id);
    if (ids.length === 0) {
      return { ok: false, sent: 0, failed: 0, removedExpired: 0, error: 'no_users_for_role' };
    }
    query = query.in('user_id', ids);
  }

  const { data: subs } = await query;
  if (!subs || subs.length === 0) {
    return { ok: false, sent: 0, failed: 0, removedExpired: 0, error: 'no_subscriptions' };
  }

  return await sendToSubs(subs as SubRow[], payload);
}

/**
 * داخلي · إرسال لمجموعة subs وتنظيف المنتهية
 */
async function sendToSubs(
  subs: Array<{ id: string; endpoint: string; p256dh: string; auth: string }>,
  payload: PushPayload,
): Promise<WebPushResult> {
  const admin = createAdminClient();
  let sent = 0, failed = 0, removedExpired = 0;

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    data: {
      url: payload.url || '/',
      ...payload.data,
    },
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/icon-96.png',
    tag: payload.tag,
  });

  const expiredIds: string[] = [];

  await Promise.all(subs.map(async (sub) => {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        notificationPayload,
      );
      sent++;
      // update last_used_at
      await admin
        .from('push_subscriptions')
        .update({ last_used_at: new Date().toISOString() })
        .eq('id', sub.id);
    } catch (err: any) {
      failed++;
      // 404 or 410 = expired · remove it
      if (err?.statusCode === 404 || err?.statusCode === 410) {
        expiredIds.push(sub.id);
      }
    }
  }));

  // تنظيف المنتهية
  if (expiredIds.length > 0) {
    await admin.from('push_subscriptions').delete().in('id', expiredIds);
    removedExpired = expiredIds.length;
  }

  return {
    ok: sent > 0,
    sent, failed, removedExpired,
  };
}
