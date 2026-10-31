/**
 * Rate Limiting — حماية ضد الـbrute force
 * ═══════════════════════════════════════════════════════════
 * - يستخدم جدول rate_limits في Supabase (persistent)
 * - آمن ضد server restarts
 * - يدعم windows + max attempts
 */
import { createAdminClient } from '@/lib/supabase/server';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt?: Date;
  retryAfter?: number;
}

interface Options {
  /** مفتاح مميّز (IP · phone · user_id · إلخ) */
  key: string;
  /** الحد الأقصى للمحاولات في النافذة */
  max: number;
  /** نافذة الوقت بالثواني */
  windowSec: number;
  /** تصنيف · مثلاً 'otp' · 'login' */
  category: string;
}

/**
 * فحص · هل العمليّة مسموحة؟
 * ترجع {allowed:false} لو تجاوز الحدّ
 */
export async function checkRateLimit(opts: Options): Promise<RateLimitResult> {
  const admin = createAdminClient();
  const now = new Date();
  const windowStart = new Date(now.getTime() - opts.windowSec * 1000);

  // عدّ المحاولات في النافذة
  const { count } = await admin
    .from('rate_limits')
    .select('*', { count: 'exact', head: true })
    .eq('key', opts.key)
    .eq('category', opts.category)
    .gte('created_at', windowStart.toISOString());

  const current = count || 0;

  if (current >= opts.max) {
    // اجلبي أول محاولة في النافذة لحساب reset time
    const { data: first } = await admin
      .from('rate_limits')
      .select('created_at')
      .eq('key', opts.key)
      .eq('category', opts.category)
      .gte('created_at', windowStart.toISOString())
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    const firstTime = (first as any)?.created_at ? new Date((first as any).created_at) : now;
    const resetAt = new Date(firstTime.getTime() + opts.windowSec * 1000);
    const retryAfter = Math.max(0, Math.ceil((resetAt.getTime() - now.getTime()) / 1000));

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter,
    };
  }

  // سجّلي المحاولة
  await admin.from('rate_limits').insert({
    key: opts.key,
    category: opts.category,
  });

  return {
    allowed: true,
    remaining: opts.max - current - 1,
  };
}

/**
 * الحصول على IP من الـrequest headers
 * (Vercel · Cloudflare · عادي)
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;
  return 'unknown';
}

/**
 * رسالة خطأ موحّدة
 */
export function rateLimitErrorResponse(result: RateLimitResult) {
  return {
    error: `⛔ عدد محاولات كثيرة · حاولي بعد ${result.retryAfter} ثانية`,
    retry_after: result.retryAfter,
    reset_at: result.resetAt?.toISOString(),
  };
}
