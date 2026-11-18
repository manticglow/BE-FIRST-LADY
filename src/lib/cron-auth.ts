/**
 * Cron Authentication Helper
 * ═══════════════════════════════════════════════════════════
 * - fail-closed · لو CRON_SECRET غير معيّن · يرفض كل الطلبات
 * - timing-safe comparison
 * - يرجع NextResponse للرفض أو null للسماح
 */
import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqualString } from './webhook-security';

export function assertCronAuthorized(req: NextRequest): NextResponse | null {
  const expected = process.env.CRON_SECRET;

  // 🛑 fail-closed: بدون سرّ معيّن · كل الطلبات ترفض
  if (!expected) {
    return NextResponse.json(
      { error: 'cron not configured' },
      { status: 500 },
    );
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token || !timingSafeEqualString(token, expected)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  return null;  // ✅ مصرّح
}
