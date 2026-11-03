/**
 * GET /api/admin/templates — كل القوالب
 * PATCH                   — تعديل قالب
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { clearTemplateCache } from '@/lib/templates';

const updateSchema = z.object({
  id: z.string().uuid(),
  body_ar: z.string().min(5).max(4000).optional(),
  body_en: z.string().max(4000).nullable().optional(),
  is_active: z.boolean().optional(),
  name_ar: z.string().min(2).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});

async function requireManager() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'غير مصرح', code: 401 };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const role = (profile as { role: string } | null)?.role;
  if (!role || !['owner', 'manager'].includes(role)) {
    return { error: 'للمالكة والمديرة فقط', code: 403 };
  }
  return { error: null, code: 0 };
}

export async function GET() {
  const check = await requireManager();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const admin = createAdminClient();
  const { data } = await admin
    .from('message_templates')
    .select('*')
    .order('category', { ascending: true })
    .order('name_ar', { ascending: true });

  return NextResponse.json({ ok: true, items: data || [] });
}

export async function PATCH(req: NextRequest) {
  const check = await requireManager();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('message_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('code')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // إفراغ الـcache
  const code = (data as { code: string } | null)?.code;
  if (code) clearTemplateCache(code);

  return NextResponse.json({ ok: true });
}
