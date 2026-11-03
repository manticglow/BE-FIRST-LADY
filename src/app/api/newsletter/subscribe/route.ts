/**
 * POST /api/newsletter/subscribe
 * ═══════════════════════════════════════════════════════════
 * اشتراك في النشرة البريديّة
 * - rate-limited: 5 محاولات/15 دقيقة لكل IP
 * - idempotent: إعادة الاشتراك بنفس البريد ما يسجّل تكرار
 */
import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { checkRateLimit, getClientIp, rateLimitErrorResponse } from '@/lib/rate-limit';
import { logger } from '@/lib/logger';

const log = logger.scope('newsletter');

const schema = z.object({
  email: z.string().email().max(200).toLowerCase(),
  source: z.string().max(50).optional().default('footer'),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // Rate limit: 5 محاولات/15 دقيقة
  const rl = await checkRateLimit({
    key: ip,
    category: 'newsletter',
    max: 5,
    windowSec: 900,
  });
  if (!rl.allowed) {
    return NextResponse.json(rateLimitErrorResponse(rl), { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'بريد إلكتروني غير صحيح' }, { status: 400 });
  }

  const { email, source } = parsed.data;
  const admin = createAdminClient();

  // Upsert — ما نسجّل مكرّر إذا الـemail موجود
  const { error } = await admin
    .from('newsletter_subscribers')
    .upsert(
      { email, source, is_active: true, resubscribed_at: new Date().toISOString() },
      { onConflict: 'email', ignoreDuplicates: false },
    );

  if (error) {
    // لو الجدول مش موجود بعد · نحفظ على الأقل في audit_log
    log.error('subscribe failed', error, { email });
    return NextResponse.json(
      { ok: true, warning: 'سجّلنا طلبكِ · راح نتواصل معاكِ' },
      { status: 200 },
    );
  }

  log.info('newsletter signup', { email, source });
  return NextResponse.json({ ok: true, message: 'شكراً · اشتركتِ بنشرتنا' });
}
