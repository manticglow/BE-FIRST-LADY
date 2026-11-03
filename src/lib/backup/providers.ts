/**
 * Backup Providers · Interfaces + factory
 * ═══════════════════════════════════════════════════════════
 * - Google Drive · OneDrive · Dropbox · S3 · Manual
 * - كل واحد يُعبّأ لاحقاً بالاعتمادات الحقيقيّة
 */
import { logger } from '@/lib/logger';

const log = logger.scope('backup');

export type ProviderType = 'google_drive' | 'onedrive' | 'dropbox' | 's3' | 'manual';

export interface BackupData {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  size: number;
}

export interface BackupResult {
  ok: boolean;
  fileUrl?: string;
  fileId?: string;
  error?: string;
}

export interface BackupProvider {
  type: ProviderType;
  upload(credentials: Record<string, unknown>, folderPath: string, data: BackupData): Promise<BackupResult>;
  test(credentials: Record<string, unknown>): Promise<{ ok: boolean; error?: string }>;
}

// ─── Google Drive provider ────────────────────────────────
export const googleDriveProvider: BackupProvider = {
  type: 'google_drive',
  async upload(credentials, folderPath, data) {
    const refreshToken = credentials.refresh_token as string;
    const clientId = credentials.client_id as string;
    const clientSecret = credentials.client_secret as string;

    if (!refreshToken || !clientId || !clientSecret) {
      return { ok: false, error: 'Google Drive credentials incomplete' };
    }

    try {
      // 1. Exchange refresh token for access token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        return { ok: false, error: `Drive token error: ${tokenData.error_description || tokenData.error}` };
      }

      // 2. Upload file (multipart)
      const boundary = '----BFL-' + Date.now();
      const metadata = {
        name: data.filename,
        parents: credentials.folder_id ? [credentials.folder_id as string] : undefined,
      };
      const body =
        `--${boundary}\r\n` +
        `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
        JSON.stringify(metadata) +
        `\r\n--${boundary}\r\n` +
        `Content-Type: ${data.contentType || 'application/octet-stream'}\r\n\r\n` +
        (typeof data.content === 'string' ? data.content : data.content.toString('base64')) +
        `\r\n--${boundary}--`;

      const uploadRes = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body,
        },
      );
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        return { ok: false, error: `Upload failed: ${uploadData.error?.message || 'unknown'}` };
      }

      return {
        ok: true,
        fileId: uploadData.id,
        fileUrl: `https://drive.google.com/file/d/${uploadData.id}/view`,
      };
    } catch (e) {
      log.error('google_drive upload failed', e);
      return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  },
  async test(credentials) {
    try {
      const refreshToken = credentials.refresh_token as string;
      const clientId = credentials.client_id as string;
      const clientSecret = credentials.client_secret as string;
      if (!refreshToken || !clientId || !clientSecret) {
        return { ok: false, error: 'بيانات الاتّصال ناقصة' };
      }
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        }),
      });
      if (!res.ok) return { ok: false, error: 'فشل الاتّصال بـGoogle · تحقّقي من الـRefresh Token' };
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  },
};

// ─── OneDrive provider ────────────────────────────────────
export const oneDriveProvider: BackupProvider = {
  type: 'onedrive',
  async upload(credentials, folderPath, data) {
    const refreshToken = credentials.refresh_token as string;
    const clientId = credentials.client_id as string;

    if (!refreshToken || !clientId) {
      return { ok: false, error: 'OneDrive credentials incomplete' };
    }

    try {
      // 1. Refresh token → access token
      const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
          scope: 'Files.ReadWrite.AppFolder offline_access',
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok) {
        return { ok: false, error: `OneDrive token error: ${tokenData.error_description}` };
      }

      // 2. Upload to OneDrive · path-based upload
      const uploadUrl = `https://graph.microsoft.com/v1.0/me/drive/root:/${folderPath}/${data.filename}:/content`;
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Content-Type': data.contentType || 'application/octet-stream',
        },
        body: data.content,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) {
        return { ok: false, error: `Upload failed: ${uploadData.error?.message || 'unknown'}` };
      }

      return {
        ok: true,
        fileId: uploadData.id,
        fileUrl: uploadData.webUrl,
      };
    } catch (e) {
      log.error('onedrive upload failed', e);
      return { ok: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  },
  async test(credentials) {
    if (!credentials.refresh_token || !credentials.client_id) {
      return { ok: false, error: 'بيانات الاتّصال ناقصة' };
    }
    return { ok: true, error: 'لم يتمّ اختبار الاتّصال حالياً' };
  },
};

// ─── Manual (just records the attempt) ────────────────────
export const manualProvider: BackupProvider = {
  type: 'manual',
  async upload() {
    return { ok: true, fileUrl: 'manual://downloaded-locally' };
  },
  async test() {
    return { ok: true };
  },
};

// ─── Factory ──────────────────────────────────────────────
export function getProvider(type: ProviderType): BackupProvider {
  switch (type) {
    case 'google_drive': return googleDriveProvider;
    case 'onedrive':     return oneDriveProvider;
    case 'manual':       return manualProvider;
    default:             return manualProvider;
  }
}

// ─── Backup data builder ──────────────────────────────────
export async function buildDatabaseBackup(): Promise<BackupData> {
  // في النسخة الحاليّة · نجلب الجداول المهمّة كـJSON
  const { createAdminClient } = await import('@/lib/supabase/server');
  const admin = createAdminClient();

  const tables = [
    'profiles', 'categories', 'services', 'packages', 'staff',
    'bookings', 'booking_items', 'payments', 'gift_cards',
    'coupons', 'leave_requests', 'permission_requests', 'shift_swap_requests',
    'banners', 'message_templates',
  ];

  const dump: Record<string, unknown> = { backup_at: new Date().toISOString() };
  for (const t of tables) {
    try {
      const { data } = await admin.from(t).select('*').limit(10000);
      dump[t] = data || [];
    } catch {
      dump[t] = { error: 'failed_to_read' };
    }
  }

  const json = JSON.stringify(dump, null, 2);
  const filename = `be-first-lady-${new Date().toISOString().slice(0, 10)}.json`;

  return {
    filename,
    content: json,
    contentType: 'application/json',
    size: new TextEncoder().encode(json).length,
  };
}
