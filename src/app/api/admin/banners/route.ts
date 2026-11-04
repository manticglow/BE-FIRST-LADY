/**
 * GET    /api/admin/banners — كل البنرات (admin)
 * POST                     — إنشاء بنر جديد
 * PATCH                    — تعديل
 * DELETE                   — حذف
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { invalidate, CACHE_TAGS } from '@/lib/cache';

const createSchema = z.object({
  title: z.string().min(2).max(200),
  subtitle: z.string().max(300).nullable().optional(),
  cta_text: z.string().max(50).optional(),
  cta_href: z.string().max(500).optional(),
  banner_type: z.enum(['theme', 'image', 'html']).default('theme'),
  theme_id: z.number().int().min(1).max(5).nullable().optional(),
  image_url: z.string().url().max(1000).nullable().optional(),
  image_alt: z.string().max(200).nullable().optional(),
  html_content: z.string().max(10000).nullable().optional(),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
});

const updateSchema = createSchema.partial().extend({ id: z.string().uuid() });

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
  const { data } = await admin.from('banners').select('*').order('display_order').order('created_at', { ascending: false });
  return NextResponse.json({ ok: true, items: data || [] });
}

export async function POST(req: NextRequest) {
  const check = await requireManager();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from('banners').insert(parsed.data).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidate(CACHE_TAGS.BANNERS);
  return NextResponse.json({ ok: true, item: data });
}

export async function PATCH(req: NextRequest) {
  const check = await requireManager();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const { id, ...updates } = parsed.data;
  const admin = createAdminClient();
  const { error } = await admin.from('banners').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidate(CACHE_TAGS.BANNERS);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const check = await requireManager();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from('banners').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  invalidate(CACHE_TAGS.BANNERS);
  return NextResponse.json({ ok: true });
}
