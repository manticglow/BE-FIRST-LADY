/**
 * Session Idle Timeout — تسجيل خروج تلقائي للادارة بعد خمول
 * ═══════════════════════════════════════════════════════════
 * - 30 دقيقة خمول = logout تلقائي للـowner/manager/staff
 * - يستخدم جدول session_activity لتتبع آخر نشاط
 * - الـclient يرسل heartbeat كل 2 دقيقة
 */
import { createAdminClient } from '@/lib/supabase/server';

export const IDLE_TIMEOUT_MINUTES = 30;
export const HEARTBEAT_INTERVAL_MS = 2 * 60 * 1000; // 2 دقيقة

export interface SessionCheckResult {
  valid: boolean;
  reason?: 'idle_timeout' | 'no_session';
  minutesIdle?: number;
}

/**
 * فحص هل الجلسة نشطة (ما تجاوزت IDLE_TIMEOUT_MINUTES)
 */
export async function checkSessionActivity(userId: string): Promise<SessionCheckResult> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('session_activity')
    .select('last_activity_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) {
    return { valid: false, reason: 'no_session' };
  }

  const lastActivity = new Date((data as any).last_activity_at);
  const now = new Date();
  const minutesIdle = Math.floor((now.getTime() - lastActivity.getTime()) / 60000);

  if (minutesIdle >= IDLE_TIMEOUT_MINUTES) {
    return { valid: false, reason: 'idle_timeout', minutesIdle };
  }

  return { valid: true, minutesIdle };
}

/**
 * تحديث آخر نشاط · heartbeat
 */
export async function updateSessionActivity(
  userId: string,
  ipAddress?: string | null,
  userAgent?: string | null,
) {
  const admin = createAdminClient();
  await admin.from('session_activity').upsert({
    user_id: userId,
    last_activity_at: new Date().toISOString(),
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
    updated_at: new Date().toISOString(),
  });
}

/**
 * حذف session activity عند logout
 */
export async function clearSessionActivity(userId: string) {
  const admin = createAdminClient();
  await admin.from('session_activity').delete().eq('user_id', userId);
}
