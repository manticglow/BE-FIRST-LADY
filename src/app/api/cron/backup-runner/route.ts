/**
 * GET /api/cron/backup-runner
 * Vercel Cron · يشتغل يومياً الساعة 3 صباحاً (حسب الـschedule)
 */
import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getProvider, buildDatabaseBackup, type ProviderType } from '@/lib/backup/providers';
import { logger } from '@/lib/logger';

const log = logger.scope('backup-cron');

export async function GET(req: NextRequest) {
  // تحقّق من الـCron Secret
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: configs } = await admin.from('backup_configs').select('*').eq('is_active', true);
  const list = (configs as { id: string; provider: ProviderType; credentials: Record<string, unknown>; folder_path: string }[] | null) || [];

  const results: Array<{ provider: string; ok: boolean; error?: string }> = [];

  for (const cfg of list) {
    try {
      const { data: runRow } = await admin.from('backup_runs').insert({
        config_id: cfg.id,
        provider: cfg.provider,
        status: 'running',
        trigger_type: 'auto',
      }).select('id').single();
      const runId = (runRow as { id: string } | null)?.id;

      const data = await buildDatabaseBackup();
      const provider = getProvider(cfg.provider);
      const result = await provider.upload(cfg.credentials || {}, cfg.folder_path, data);

      if (!result.ok) throw new Error(result.error);

      await admin.from('backup_runs').update({
        status: 'success',
        completed_at: new Date().toISOString(),
        size_bytes: data.size,
        file_url: result.fileUrl,
      }).eq('id', runId);

      await admin.from('backup_configs').update({
        last_run_at: new Date().toISOString(),
        last_status: 'success',
        last_error: null,
      }).eq('id', cfg.id);

      results.push({ provider: cfg.provider, ok: true });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      log.error('backup failed', e, { provider: cfg.provider });
      results.push({ provider: cfg.provider, ok: false, error: msg });
    }
  }

  return NextResponse.json({ ok: true, ran: results.length, results });
}
