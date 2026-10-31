/**
 * POST /api/session/heartbeat
 * تحديث آخر نشاط للمستخدم · يُستدعى من client كل دقيقتين
 *
 * GET /api/session/heartbeat
 * فحص هل الجلسة لازالت نشطة
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import {
  checkSessionActivity,
  updateSessionActivity,
  IDLE_TIMEOUT_MINUTES,
} from '@/lib/session-timeout';
import { extractRequestInfo } from '@/lib/audit-log';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { ip, ua } = extractRequestInfo(req);
  await updateSessionActivity(user.id, ip, ua);
  return NextResponse.json({ ok: true, timeout_minutes: IDLE_TIMEOUT_MINUTES });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { valid: false, reason: 'no_user' },
      { status: 401 },
    );
  }

  const result = await checkSessionActivity(user.id);

  if (!result.valid && result.reason === 'idle_timeout') {
    // الجلسة انتهت بالخمول · logout
    await supabase.auth.signOut();
    return NextResponse.json(
      {
        valid: false,
        reason: 'idle_timeout',
        minutes_idle: result.minutesIdle,
        message: `تم تسجيل خروجكِ تلقائياً بعد ${result.minutesIdle} دقيقة خمول`,
      },
      { status: 401 },
    );
  }

  return NextResponse.json({
    valid: true,
    minutes_idle: result.minutesIdle || 0,
    timeout_minutes: IDLE_TIMEOUT_MINUTES,
  });
}
