/**
 * Push Sender — إرسال الإشعارات من السيرفر
 * ═══════════════════════════════════════════════════════════
 * ⚙️ SETUP (مرة واحدة):
 *   1. اذهبي إلى Firebase Console → مشروعك → Project Settings → Service Accounts
 *   2. "Generate new private key" → حمّلي JSON
 *   3. أضيفي في .env.local:
 *      FCM_SERVICE_ACCOUNT_JSON={"type":"service_account",...}  (كله في سطر واحد)
 *      FCM_PROJECT_ID=befirstlady-xxxxx
 *
 * iOS: يحتاج APNs certificate مرفوع في Firebase (مرّة واحدة)
 */

import { createAdminClient } from '@/lib/supabase/server';

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

interface SendResult {
  ok: boolean;
  sent: number;
  failed: number;
  error?: string;
}

/**
 * أرسلي إشعاراً لعميلة واحدة (كل أجهزتها)
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<SendResult> {
  const admin = createAdminClient();
  const { data: tokens } = await admin
    .from('device_tokens')
    .select('token, platform')
    .eq('user_id', userId);

  if (!tokens || tokens.length === 0) {
    return { ok: false, sent: 0, failed: 0, error: 'لا توجد أجهزة مسجّلة' };
  }

  return await sendFCM(tokens.map((t) => t.token), payload, userId);
}

/**
 * أرسلي إشعاراً جماعياً (مثلاً: عرض جديد)
 */
export async function sendPushToAll(payload: PushPayload, role?: string): Promise<SendResult> {
  const admin = createAdminClient();
  let query = admin.from('device_tokens').select('token, user_id, profiles!inner(role)');
  if (role) {
    query = query.eq('profiles.role', role);
  }
  const { data: tokens } = await query;
  if (!tokens || tokens.length === 0) {
    return { ok: false, sent: 0, failed: 0, error: 'لا توجد أجهزة' };
  }

  return await sendFCM(tokens.map((t: any) => t.token), payload);
}

async function sendFCM(tokens: string[], payload: PushPayload, userId?: string): Promise<SendResult> {
  const serviceAccount = process.env.FCM_SERVICE_ACCOUNT_JSON;
  const projectId = process.env.FCM_PROJECT_ID;

  if (!serviceAccount || !projectId) {
    return { ok: false, sent: 0, failed: 0, error: 'FCM غير مُفعّلة' };
  }

  try {
    const credentials = JSON.parse(serviceAccount);
    const accessToken = await getFCMAccessToken(credentials);
    if (!accessToken) {
      return { ok: false, sent: 0, failed: 0, error: 'فشل الحصول على access token' };
    }

    let sent = 0, failed = 0;
    const admin = createAdminClient();

    // FCM v1 يرسل لكل جهاز على حدة
    for (const token of tokens) {
      try {
        const res = await fetch(
          `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              message: {
                token,
                notification: {
                  title: payload.title,
                  body: payload.body,
                  ...(payload.imageUrl && { image: payload.imageUrl }),
                },
                data: payload.data || {},
                android: {
                  priority: 'high',
                  notification: {
                    channel_id: 'default',
                    sound: 'default',
                  },
                },
                apns: {
                  payload: {
                    aps: {
                      sound: 'default',
                      badge: 1,
                    },
                  },
                },
              },
            }),
          }
        );

        if (res.ok) sent++;
        else {
          failed++;
          // لو التوكن ما عاد صالح، احذفيه
          const err = await res.json();
          if (err.error?.status === 'NOT_FOUND' || err.error?.status === 'UNREGISTERED') {
            await admin.from('device_tokens').delete().eq('token', token);
          }
        }
      } catch {
        failed++;
      }
    }

    // سجّلي في اللوق
    if (userId) {
      await admin.from('push_notifications_log').insert({
        user_id: userId,
        title: payload.title,
        body: payload.body,
        data: payload.data || {},
        status: sent > 0 ? 'sent' : 'failed',
      });
    }

    return { ok: sent > 0, sent, failed };
  } catch (e: any) {
    return { ok: false, sent: 0, failed: tokens.length, error: e.message };
  }
}

/**
 * توليد OAuth2 access token لـ FCM من Service Account
 */
async function getFCMAccessToken(credentials: any): Promise<string | null> {
  try {
    const header = { alg: 'RS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    const base64 = (obj: any) =>
      Buffer.from(JSON.stringify(obj)).toString('base64url');

    const toSign = `${base64(header)}.${base64(payload)}`;

    const { createSign } = await import('crypto');
    const signer = createSign('RSA-SHA256');
    signer.update(toSign);
    const signature = signer.sign(credentials.private_key, 'base64url');

    const jwt = `${toSign}.${signature}`;

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    const data = await res.json();
    return data.access_token || null;
  } catch (e) {
    console.error('[FCM] token error:', e);
    return null;
  }
}

// قوالب جاهزة ───────────────────────────────────────
export const PushTemplates = {
  bookingConfirmed: (bookingNumber: string, date: string, time: string) => ({
    title: '✨ تأكيد حجزكِ',
    body: `حجزكِ #${bookingNumber} يوم ${date} الساعة ${time}`,
    data: { type: 'booking_confirmed', booking_number: bookingNumber },
  }),

  reminder24h: (time: string) => ({
    title: '💛 تذكير',
    body: `عندكِ موعد بكرة الساعة ${time} في Be First Lady`,
    data: { type: 'reminder_24h' },
  }),

  bookingCancelled: (bookingNumber: string) => ({
    title: 'إلغاء حجز',
    body: `تم إلغاء حجزكِ #${bookingNumber}`,
    data: { type: 'cancelled' },
  }),

  specialOffer: (title: string, body: string) => ({
    title: `🎁 ${title}`,
    body,
    data: { type: 'offer' },
  }),

  birthday: (name: string, code: string) => ({
    title: `🎂 كل عام وأنتِ بألف خير يا ${name}`,
    body: `هديتنا: خصم 20% — كود: ${code}`,
    data: { type: 'birthday', code },
  }),
};
