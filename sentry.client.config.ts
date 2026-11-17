/**
 * Sentry · Client Configuration
 * ═══════════════════════════════════════════════════════════
 * يُحمّل في الـbrowser لرصد أخطاء المستخدمات
 *
 * التفعيل:
 *   1. سجّلي في sentry.io وأنشئي project
 *   2. انسخي الـDSN
 *   3. أضيفي في Vercel env: NEXT_PUBLIC_SENTRY_DSN=https://...@...ingest.sentry.io/...
 *   4. ثبّتي الـSDK: npm install @sentry/nextjs
 */

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  // Dynamic import · ما يفشل إذا @sentry/nextjs مش مُثبّت
  // @ts-ignore
  import('@sentry/nextjs').then((Sentry: any) => {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 1.0,
      beforeSend(event: any) {
        if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) return null;
        return event;
      },
    });
  }).catch(() => {
    console.warn('[Sentry] @sentry/nextjs غير مُثبّت · تخطّى التفعيل');
  });
}
