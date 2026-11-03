/**
 * GET /api/account/beauty-profile
 * PATCH /api/account/beauty-profile
 * ═══════════════════════════════════════════════════════════
 * - resilient لو عمود beauty_profile لم يُضف بعد في DB
 * - يرجّع رسالة واضحة بدل crash
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  skin_type: z.enum(['normal', 'dry', 'oily', 'combo', 'sensitive']).nullable().optional(),
  hair_type: z.enum(['straight', 'wavy', 'curly', 'coily']).nullable().optional(),
  hair_treated: z.boolean().nullable().optional(),
  allergies: z.array(z.string().max(100)).max(20).optional(),
  medical_notes: z.string().max(1000).nullable().optional(),
  pregnancy_status: z.enum(['none', 'pregnant', 'nursing']).nullable().optional(),
  favorite_fragrances: z.array(z.string().max(100)).max(10).optional(),
  skin_concerns: z.array(z.string().max(100)).max(10).optional(),
});

function isMissingColumnError(err: any): boolean {
  const msg = (err?.message || '').toLowerCase();
  return msg.includes('beauty_profile') && (
    msg.includes('column') || msg.includes('schema cache') || msg.includes('does not exist')
  );
}

const MIGRATION_HELP = `
العمود beauty_profile لم يُضَف بعد في قاعدة البيانات.
افتحي Supabase SQL Editor والصقي:

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS beauty_profile JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS preferred_staff_id UUID,
  ADD COLUMN IF NOT EXISTS preferences_notes TEXT,
  ADD COLUMN IF NOT EXISTS staff_notes TEXT;

NOTIFY pgrst, 'reload schema';
`.trim();

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('beauty_profile')
    .eq('id', user.id)
    .single();

  if (error && isMissingColumnError(error)) {
    // رجّعي profile فاضي · بدون crash
    return NextResponse.json({
      ok: true,
      profile: {},
      _warning: 'migration_pending',
      _help: MIGRATION_HELP,
    });
  }

  return NextResponse.json({
    ok: true,
    profile: (profile as any)?.beauty_profile || {},
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  // merge مع الموجود
  const { data: current, error: readErr } = await supabase
    .from('profiles')
    .select('beauty_profile')
    .eq('id', user.id)
    .single();

  if (readErr && isMissingColumnError(readErr)) {
    return NextResponse.json({
      error: 'ملف الجمال لم يُفعّل بعد في قاعدة البيانات · اطلبي من المدير تشغيل migration',
      _help: MIGRATION_HELP,
    }, { status: 503 });
  }

  const existing = (current as any)?.beauty_profile || {};
  const merged = { ...existing, ...parsed.data, updated_at: new Date().toISOString() };

  const { error } = await supabase
    .from('profiles')
    .update({ beauty_profile: merged })
    .eq('id', user.id);

  if (error && isMissingColumnError(error)) {
    return NextResponse.json({
      error: 'ملف الجمال لم يُفعّل بعد · شغّلي migration أولاً',
      _help: MIGRATION_HELP,
    }, { status: 503 });
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, profile: merged });
}
