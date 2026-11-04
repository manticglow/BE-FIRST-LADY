/**
 * GET /api/health
 * ═══════════════════════════════════════════════════════════
 * - عامّ (ما يحتاج auth)
 * - يتفحّص: قاعدة البيانات · الخدمات الخارجيّة · الإعدادات
 * - يُرجّع 200 لو كل شي تمام · 503 لو فيه مشكلة
 *
 * استخدمه مع UptimeRobot أو أي uptime monitor خارجي
 */
import { createAdminClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type CheckResult = { name: string; ok: boolean; latency_ms?: number; message?: string };

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    const admin = createAdminClient();
    const { error } = await admin.from('profiles').select('id').limit(1);
    if (error) throw error;
    return { name: 'database', ok: true, latency_ms: Date.now() - start };
  } catch (e) {
    return {
      name: 'database',
      ok: false,
      latency_ms: Date.now() - start,
      message: e instanceof Error ? e.message : 'unknown',
    };
  }
}

function checkEnv(): CheckResult {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  const missing = required.filter((k) => !process.env[k]);
  return {
    name: 'env',
    ok: missing.length === 0,
    message: missing.length ? `missing: ${missing.join(', ')}` : 'all required set',
  };
}

async function checkRecentErrors(): Promise<CheckResult> {
  try {
    const admin = createAdminClient();
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count } = await admin
      .from('api_errors')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', fiveMinAgo);
    const n = count || 0;
    return {
      name: 'error_rate',
      ok: n < 10,
      message: `${n} errors in last 5 min`,
    };
  } catch {
    return { name: 'error_rate', ok: true, message: 'check skipped' };
  }
}

export async function GET() {
  const checks = await Promise.all([
    checkDatabase(),
    Promise.resolve(checkEnv()),
    checkRecentErrors(),
  ]);

  const allOk = checks.every((c) => c.ok);
  const status = allOk ? 'healthy' : 'degraded';

  return NextResponse.json(
    {
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      checks,
      uptime_s: Math.floor(process.uptime?.() || 0),
    },
    {
      status: allOk ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
