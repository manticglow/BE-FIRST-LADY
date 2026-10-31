/**
 * /api/admin/expenses
 * - GET: list expenses (filter by date/category)
 * - POST: new expense
 * - DELETE: ?id=xxx
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'غير مصرح', user: null };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['owner', 'manager'].includes((profile as any).role)) {
    return { error: 'ليس لديكِ صلاحية', user: null };
  }
  return { error: null, user };
}

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.enum(['rent', 'salaries', 'supplies', 'utilities', 'marketing', 'maintenance', 'equipment', 'other']),
  amount: z.number().positive().max(1000000),
  description: z.string().min(2).max(300),
  payment_method: z.enum(['cash', 'card', 'transfer', 'mada', 'other']).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

export async function GET(req: NextRequest) {
  const { error, user } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const url = new URL(req.url);
  const month = url.searchParams.get('month'); // YYYY-MM
  const category = url.searchParams.get('category');

  const admin = createAdminClient();
  let q = admin.from('expenses').select('*').order('date', { ascending: false }).limit(500);

  if (month) {
    const start = `${month}-01`;
    const [y, m] = month.split('-').map(Number);
    const nextMonth = new Date(y, m, 1);
    const end = nextMonth.toISOString().split('T')[0];
    q = q.gte('date', start).lt('date', end);
  }
  if (category) q = q.eq('category', category);

  const { data } = await q;

  // ملخّص · إجمالي حسب الفئة
  const summary: Record<string, number> = {};
  let total = 0;
  (data || []).forEach((e: any) => {
    summary[e.category] = (summary[e.category] || 0) + Number(e.amount);
    total += Number(e.amount);
  });

  return NextResponse.json({ expenses: data || [], summary, total });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'بيانات غير صحيحة' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error: insertErr } = await admin
    .from('expenses')
    .insert({
      ...parsed.data,
      recorded_by: user!.id,
    })
    .select()
    .single();

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, expense: data });
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

  const admin = createAdminClient();
  await admin.from('expenses').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}
