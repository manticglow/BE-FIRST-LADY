/**
 * API Wrapper — غلاف موحّد لحماية API routes
 * ═══════════════════════════════════════════════════════════
 * - يمسك كل errors (ما تسرّب لـ500)
 * - رسائل عربيّة ودّية للعميلة
 * - logging لأي error حقيقي
 * - timing info في headers
 * - يمنع تسريب معلومات حسّاسة في production
 */
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from './logger';
import { createAdminClient } from './supabase/server';

const log = logger.scope('api');
const isDev = process.env.NODE_ENV !== 'production';

export type ApiHandler = (req: NextRequest, ctx?: unknown) => Promise<NextResponse | Response>;

export interface ApiErrorInfo {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
}

/** errors معروفة — نرجّعها بدون logging مزعج */
export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(info: ApiErrorInfo) {
    super(info.message);
    this.status = info.status;
    this.code = info.code;
    this.details = info.details;
  }
}

/** Shortcut للأخطاء الشائعة */
export const ApiErrors = {
  unauthorized: () => new ApiError({ message: 'يرجى تسجيل الدخول', status: 401, code: 'unauthorized' }),
  forbidden: () => new ApiError({ message: 'ما عندك صلاحية', status: 403, code: 'forbidden' }),
  notFound: (what = 'المورد') => new ApiError({ message: `${what} غير موجود`, status: 404, code: 'not_found' }),
  badRequest: (msg: string) => new ApiError({ message: msg, status: 400, code: 'bad_request' }),
  tooManyRequests: (retryAfter?: number) => new ApiError({
    message: 'محاولات كثيرة · حاولي بعد قليل',
    status: 429,
    code: 'rate_limited',
    details: retryAfter ? { retry_after: retryAfter } : undefined,
  }),
  conflict: (msg: string) => new ApiError({ message: msg, status: 409, code: 'conflict' }),
};

/**
 * يلفّ API route · يمسك كل الـerrors ويرجّع رد موحّد
 *
 * Usage:
 *   export const POST = withApi(async (req) => {
 *     const data = await processRequest(req);
 *     return NextResponse.json({ ok: true, data });
 *   });
 */
export function withApi(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, ctx?: unknown) => {
    const start = Date.now();
    const path = new URL(req.url).pathname;

    try {
      const res = await handler(req, ctx);
      // أضيفي timing header مفيد للتشخيص
      if (res instanceof NextResponse || res instanceof Response) {
        (res as NextResponse).headers.set('X-Response-Time', `${Date.now() - start}ms`);
      }
      return res;
    } catch (err) {
      const duration = Date.now() - start;

      // ApiError معروف — رد نظيف
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: err.message, code: err.code, ...(isDev && err.details ? { details: err.details } : {}) },
          { status: err.status },
        );
      }

      // Zod validation error
      if (err instanceof ZodError) {
        const first = err.issues[0];
        return NextResponse.json(
          {
            error: translateZodMessage(first?.message || 'بيانات غير صحيحة'),
            code: 'validation_error',
            field: first?.path?.join('.'),
          },
          { status: 400 },
        );
      }

      // غير متوقّع — سجّليه + رد ودّي
      const errMsg = err instanceof Error ? err.message : String(err);
      const errStack = err instanceof Error ? err.stack : undefined;

      log.error(`API crash: ${path}`, err, { duration, path });

      // سجّلي في DB للـmonitoring page
      recordError({
        path,
        message: errMsg,
        stack: errStack,
        duration,
        method: req.method,
      }).catch(() => {});

      // رد نظيف للعميلة
      return NextResponse.json(
        {
          error: isDev ? errMsg : 'حدث خطأ غير متوقّع · حاولي مرة ثانية',
          code: 'internal_error',
          ...(isDev ? { stack: errStack } : {}),
        },
        { status: 500 },
      );
    }
  };
}

/** يترجم رسائل Zod الإنجليزيّة لعربي */
function translateZodMessage(msg: string): string {
  const map: Record<string, string> = {
    'Required': 'حقل مطلوب',
    'Invalid email': 'بريد إلكتروني غير صحيح',
    'Invalid url': 'رابط غير صحيح',
    'Invalid uuid': 'معرّف غير صحيح',
    'String must contain at least': 'النصّ قصير جداً',
    'Number must be greater than': 'الرقم أقلّ من المسموح',
  };
  for (const [en, ar] of Object.entries(map)) {
    if (msg.startsWith(en)) return ar;
  }
  return msg;
}

/** يسجّل الخطأ في جدول api_errors للـmonitoring */
async function recordError(info: {
  path: string;
  message: string;
  stack?: string;
  duration: number;
  method: string;
}) {
  try {
    const admin = createAdminClient();
    await admin.from('api_errors').insert({
      path: info.path,
      method: info.method,
      message: info.message.slice(0, 1000),
      stack: info.stack?.slice(0, 5000) || null,
      duration_ms: info.duration,
    });
  } catch {
    // ما نرجع · هذي best-effort
  }
}
