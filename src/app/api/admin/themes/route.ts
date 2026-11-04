/**
 * GET   /api/admin/themes — كل الثيمات (للإدارة)
 * POST                   — تفعيل ثيم (يلغي النشط الحالي تلقائياً)
 * PATCH                  — تعديل ثيم
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { invalidate, CACHE_TAGS } from '@/lib/cache';

const activateSchema = z.object({
  id: z.string().uuid(),
  is_active: z.boolean(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  name_ar: z.string().optional(),
  primary_color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  accent_color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  badge_text: z.string().max(50).nullable().optional(),
  badge_emoji: z.string().max(10).nullable().optional(),
  decoration: z.string().max(50).nullable().optional(),
  auto_start_date: z.string().nullable().optional(),
  auto_end_date: z.string().nullable().optional(),
});

async function requireManager() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'غير مصرح', code: 401 };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (!role || !['owner', 'manager'].includes(role)) return { error: 'للمالكة والمديرة فقط', code: 403 };
  return { error: null, code: 0 };
}

export async function GET() {
  const check = await requireManager();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const admin = createAdminClient();
  const { data } = await admin.from('site_themes').select('*').order('code');
  return NextResponse.json({ ok: true, items: data || [] });
}

export async function POST(req: NextRequest) {
  const check = await requireManager();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const body = await req.json();
  const parsed = activateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const admin = createAdminClient();

  // لو تفعيل · الـtrigger في الـDB يلغي الباقي تلقائياً
  const { error } = await admin
    .from('site_themes')
    .update({ is_active: parsed.data.is_active, updated_at: new Date().toISOString() })
    .eq('id', parsed.data.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidate(CACHE_TAGS.THEMES);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const check = await requireManager();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { id, ...updates } = parsed.data;
  const admin = createAdminClient();
  const { error } = await admin
    .from('site_themes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidate(CACHE_TAGS.THEMES);
  return NextResponse.json({ ok: true });
}
