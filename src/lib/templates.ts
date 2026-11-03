/**
 * Templates — تحميل قالب من DB واستبدال المتغيّرات
 * ═══════════════════════════════════════════════════════════
 * - يدعم {{variable_name}} في النصّ
 * - لو القالب غير موجود · fallback للنصّ الافتراضي في الكود
 */
import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

const log = logger.scope('templates');

type TemplateRow = {
  id: string;
  code: string;
  body_ar: string;
  body_en: string | null;
  is_active: boolean;
  variables: string[] | null;
};

const cache = new Map<string, { body: string; at: number }>();
const CACHE_TTL_MS = 60_000;

/** يستبدل {{var}} بالقيم */
export function renderTemplate(body: string, vars: Record<string, string | number | null | undefined>): string {
  return body.replace(/\{\{\s*([a-z_][a-z0-9_]*)\s*\}\}/gi, (_m, key) => {
    const v = vars[key];
    return v === null || v === undefined ? '' : String(v);
  });
}

/** يجلب قالباً من DB · لو مش موجود يرجّع fallback */
export async function renderTemplateByCode(
  code: string,
  vars: Record<string, string | number | null | undefined>,
  fallback: string,
): Promise<string> {
  try {
    const cached = cache.get(code);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return renderTemplate(cached.body, vars);
    }

    const admin = createAdminClient();
    const { data } = await admin
      .from('message_templates')
      .select('body_ar, is_active')
      .eq('code', code)
      .maybeSingle();

    const row = data as Pick<TemplateRow, 'body_ar' | 'is_active'> | null;
    const body = row?.is_active ? row.body_ar : fallback;
    cache.set(code, { body, at: Date.now() });
    return renderTemplate(body, vars);
  } catch (e) {
    log.warn('render failed', { code, err: e });
    return renderTemplate(fallback, vars);
  }
}

/** إفراغ الـcache (نستخدمه بعد تعديل القوالب من admin) */
export function clearTemplateCache(code?: string) {
  if (code) cache.delete(code);
  else cache.clear();
}
