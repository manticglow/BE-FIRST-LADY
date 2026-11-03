/**
 * GET   /api/admin/backup — إعدادات + سجلّ النسخ
 * POST                   — إنشاء/تحديث إعدادات
 * PUT                    — تشغيل نسخة احتياطيّة الآن (manual)
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getProvider, buildDatabaseBackup, type ProviderType } from '@/lib/backup/providers';
import { logger } from '@/lib/logger';

const log = logger.scope('backup-api');

const configSchema = z.object({
  provider: z.enum(['google_drive', 'onedrive', 'dropbox', 's3', 'manual']),
  is_active: z.boolean().default(false),
  schedule: z.enum(['daily', 'weekly', 'monthly', 'manual']).default('daily'),
  time_of_day: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).default('03:00'),
  credentials: z.record(z.string(), z.any()).optional(),
  folder_path: z.string().max(500).default('BeFirstLady/Backups'),
  include_db: z.boolean().default(true),
  include_uploads: z.boolean().default(true),
  retention_days: z.number().int().min(1).max(365).default(30),
});

async function requireOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'غير مصرح', code: 401, userId: null };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (role !== 'owner') return { error: 'للمالكة فقط', code: 403, userId: null };
  return { error: null, code: 0, userId: user.id };
}

export async function GET() {
  const check = await requireOwner();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const admin = createAdminClient();

  // إخفاء الـcredentials من الرد
  const { data: configs } = await admin
    .from('backup_configs')
    .select('id, provider, is_active, schedule, time_of_day, folder_path, include_db, include_uploads, retention_days, last_run_at, last_status, last_error, created_at')
    .order('created_at', { ascending: false });

  const { data: runs } = await admin
    .from('backup_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(20);

  return NextResponse.json({ ok: true, configs: configs || [], runs: runs || [] });
}

export async function POST(req: NextRequest) {
  const check = await requireOwner();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const body = await req.json();
  const parsed = configSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const admin = createAdminClient();

  // لو عندنا config بنفس الـprovider · نحدّثه · وإلا ننشئ جديد
  const { data: existing } = await admin
    .from('backup_configs')
    .select('id')
    .eq('provider', parsed.data.provider)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from('backup_configs')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', (existing as { id: string }).id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await admin.from('backup_configs').insert(parsed.data);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// تشغيل يدوي
export async function PUT(req: NextRequest) {
  const check = await requireOwner();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const body = await req.json().catch(() => ({}));
  const configId = body?.config_id as string | undefined;

  const admin = createAdminClient();

  const { data: config } = configId
    ? await admin.from('backup_configs').select('*').eq('id', configId).single()
    : await admin.from('backup_configs').select('*').eq('is_active', true).limit(1).maybeSingle();

  const cfg = config as {
    id: string; provider: ProviderType; credentials: Record<string, unknown>; folder_path: string;
  } | null;

  if (!cfg) {
    return NextResponse.json({ error: 'ما فيه إعدادات نسخ احتياطيّة مفعّلة' }, { status: 400 });
  }

  // سجّل بداية التشغيل
  const { data: runRow } = await admin.from('backup_runs').insert({
    config_id: cfg.id,
    provider: cfg.provider,
    status: 'running',
    trigger_type: 'manual',
    triggered_by: check.userId,
  }).select('id').single();
  const runId = (runRow as { id: string } | null)?.id;

  try {
    const data = await buildDatabaseBackup();
    const provider = getProvider(cfg.provider);
    const result = await provider.upload(cfg.credentials || {}, cfg.folder_path, data);

    if (!result.ok) throw new Error(result.error || 'upload failed');

    await admin.from('backup_runs').update({
      status: 'success',
      completed_at: new Date().toISOString(),
      size_bytes: data.size,
      file_url: result.fileUrl,
      stats: { filename: data.filename },
    }).eq('id', runId);

    await admin.from('backup_configs').update({
      last_run_at: new Date().toISOString(),
      last_status: 'success',
      last_error: null,
    }).eq('id', cfg.id);

    return NextResponse.json({ ok: true, file_url: result.fileUrl, size: data.size });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    log.error('backup run failed', e);
    await admin.from('backup_runs').update({
      status: 'failed',
      completed_at: new Date().toISOString(),
      error_message: msg,
    }).eq('id', runId);
    await admin.from('backup_configs').update({
      last_run_at: new Date().toISOString(),
      last_status: 'failed',
      last_error: msg,
    }).eq('id', cfg.id);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
