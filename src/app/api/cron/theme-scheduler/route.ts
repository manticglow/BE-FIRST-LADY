/**
 * GET /api/cron/theme-scheduler
 * يشتغل يومياً الساعة 00:05 · يفعّل الثيم المناسب حسب التاريخ
 */
import { createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

const log = logger.scope('theme-cron');

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  // التاريخ الحالي بصيغة MM-DD
  const now = new Date();
  const today = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // جلب كل الثيمات اللي عندها auto schedule
  const { data: themes } = await admin
    .from('site_themes')
    .select('id, code, auto_start_date, auto_end_date, is_active');

  type T = { id: string; code: string; auto_start_date: string | null; auto_end_date: string | null; is_active: boolean };
  const list = (themes as T[] | null) || [];

  // الثيم اللي اليوم ضمن نطاقه
  const scheduledToActivate = list.find((t) => {
    if (!t.auto_start_date || !t.auto_end_date) return false;
    return today >= t.auto_start_date && today <= t.auto_end_date;
  });

  // لو مُوجد · فعّليه (الـtrigger راح يلغي الباقي)
  if (scheduledToActivate && !scheduledToActivate.is_active) {
    await admin.from('site_themes').update({ is_active: true }).eq('id', scheduledToActivate.id);
    log.info('activated scheduled theme', { code: scheduledToActivate.code, date: today });
    return NextResponse.json({ ok: true, activated: scheduledToActivate.code, date: today });
  }

  // لو مش في نطاق أي ثيم مجدول · رجّعي للـdefault
  if (!scheduledToActivate) {
    const anyScheduledActive = list.find((t) => t.is_active && t.auto_start_date);
    if (anyScheduledActive) {
      // الثيم المُجدَّل الحالي خرج من نطاقه · رجّعي default
      const defaultTheme = list.find((t) => t.code === 'default');
      if (defaultTheme) {
        await admin.from('site_themes').update({ is_active: true }).eq('id', defaultTheme.id);
        log.info('restored default theme', { date: today });
        return NextResponse.json({ ok: true, restored_default: true });
      }
    }
  }

  return NextResponse.json({ ok: true, no_change: true, date: today });
}
