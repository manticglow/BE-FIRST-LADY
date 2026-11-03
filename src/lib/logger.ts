/**
 * Logger · Be First Lady
 * ═══════════════════════════════════════════════════════════
 * - في development: يطبع للـconsole مع prefix
 * - في production: يصمت (أو يرسل لـsentry/vercel logs لاحقاً)
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('user signed in', { userId });
 *   logger.warn('rate limit near', { count });
 *   logger.error('payment failed', err, { intentId });
 */

type LogContext = Record<string, unknown>;

const isDev = process.env.NODE_ENV !== 'production';
const isServer = typeof window === 'undefined';

function fmt(level: string, scope: string, msg: string): string {
  const ts = isServer ? new Date().toISOString().slice(11, 23) : '';
  return `[${level}${ts ? ` ${ts}` : ''}] ${scope}: ${msg}`;
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
   * Error · always logged.
   * Captures Error objects correctly. Add external reporter here (sentry, etc.).
   */
  error(msg: string, err?: unknown, ctx?: LogContext) {
    const errMeta =
      err instanceof Error
        ? { name: err.name, message: err.message, stack: err.stack }
        : err !== undefined
        ? { err }
        : {};
    console.error(fmt('ERROR', 'app', msg), { ...errMeta, ...(ctx ?? {}) });
    // TODO: hook up Sentry/Logtail here when a provider is picked
  },

  /** Create a scoped logger (e.g. for a route or module) */
  scope(scope: string) {
    return {
      info: (msg: string, ctx?: LogContext) => {
        if (isDev) console.log(fmt('INFO', scope, msg), ctx ?? '');
      },
      debug: (msg: string, ctx?: LogContext) => {
        if (isDev) console.debug(fmt('DEBUG', scope, msg), ctx ?? '');
      },
      warn: (msg: string, ctx?: LogContext) => {
        console.warn(fmt('WARN', scope, msg), ctx ?? '');
      },
      error: (msg: string, err?: unknown, ctx?: LogContext) => {
        const errMeta =
          err instanceof Error
            ? { name: err.name, message: err.message, stack: err.stack }
            : err !== undefined
            ? { err }
            : {};
        console.error(fmt('ERROR', scope, msg), { ...errMeta, ...(ctx ?? {}) });
      },
    };
  },
};
