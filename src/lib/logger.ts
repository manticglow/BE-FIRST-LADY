/**
 * Logger · Be First Lady
 * ═══════════════════════════════════════════════════════════
 * - في development: يطبع للـconsole مع prefix
 * - في production: الأخطاء ترسل تلقائياً لـSentry (إذا مفعّل)
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('user signed in', { userId });
 *   logger.warn('rate limit near', { count });
 *   logger.error('payment failed', err, { intentId });
 *
 * 🔌 Sentry Integration:
 *   أضيفي SENTRY_DSN في env variables لتفعيل تتبّع الأخطاء في production.
 */

type LogContext = Record<string, unknown>;

const isDev = process.env.NODE_ENV !== 'production';
const isServer = typeof window === 'undefined';

// 🔍 Sentry · dynamic import لتجنّب مشاكل bundling
let sentryCapture: ((err: unknown, ctx?: LogContext) => void) | null = null;
if (!isDev && (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)) {
  // Sentry يُفعّل تلقائياً إذا @sentry/nextjs مُثبّت و DSN موجود
  // الـcapture يحصل عبر Sentry.captureException في runtime
  sentryCapture = (err, ctx) => {
    try {
      // @ts-ignore · dynamic access to global Sentry
      const Sentry = (globalThis as any).Sentry;
      if (Sentry?.captureException) {
        Sentry.captureException(err, { extra: ctx });
      }
    } catch {
      // silent · Sentry غير متاح
    }
  };
}

function fmt(level: string, scope: string, msg: string): string {
  const ts = isServer ? new Date().toISOString().slice(11, 23) : '';
  return `[${level}${ts ? ` ${ts}` : ''}] ${scope}: ${msg}`;
}

function captureError(msg: string, err: unknown, ctx: LogContext | undefined, scope: string) {
  const errMeta =
    err instanceof Error
      ? { name: err.name, message: err.message, stack: err.stack }
      : err !== undefined
      ? { err }
      : {};
  console.error(fmt('ERROR', scope, msg), { ...errMeta, ...(ctx ?? {}) });

  // 🔍 أرسل لـSentry في production
  if (sentryCapture && err !== undefined) {
    sentryCapture(err, { ...(ctx ?? {}), scope, message: msg });
  }
}

export const logger = {
  /** Development-only informational log */
  info(msg: string, ctx?: LogContext) {
    if (!isDev) return;
    console.log(fmt('INFO', 'app', msg), ctx ?? '');
  },

  /** Development-only debug log (silent otherwise) */
  debug(msg: string, ctx?: LogContext) {
    if (!isDev) return;
    console.debug(fmt('DEBUG', 'app', msg), ctx ?? '');
  },

  /**
   * Warning · logged in dev + production (visible in Vercel logs).
   * Use for non-fatal issues that deserve attention.
   */
  warn(msg: string, ctx?: LogContext) {
    console.warn(fmt('WARN', 'app', msg), ctx ?? '');
  },

  /**
   * Error · always logged. In production: sent to Sentry if SENTRY_DSN is set.
   */
  error(msg: string, err?: unknown, ctx?: LogContext) {
    captureError(msg, err, ctx, 'app');
  },

  /** Create a scoped logger (e.g. for a route or module) */
  scope(scopeName: string) {
    return {
      info: (msg: string, ctx?: LogContext) => {
        if (isDev) console.log(fmt('INFO', scopeName, msg), ctx ?? '');
      },
      debug: (msg: string, ctx?: LogContext) => {
        if (isDev) console.debug(fmt('DEBUG', scopeName, msg), ctx ?? '');
      },
      warn: (msg: string, ctx?: LogContext) => {
        console.warn(fmt('WARN', scopeName, msg), ctx ?? '');
      },
      error: (msg: string, err?: unknown, ctx?: LogContext) => {
        captureError(msg, err, ctx, scopeName);
      },
    };
  },
};
