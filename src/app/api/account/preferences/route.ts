/**
 * GET  /api/account/preferences · جلب تفضيلات العميلة
 * PATCH /api/account/preferences · تحديثها
 *
 * Body (PATCH):
 * {
 *   preferred_staff_id?: string | null,
 *   preferences_notes?: string | null,
 * }
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  preferred_staff_id: z.string().uuid().nullable().optional(),
  preferences_notes: z.string().max(500).nullable().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('preferred_staff_id, preferences_notes')
    .eq('id', user.id)
    .single();

  let preferredStaff = null;
  if ((profile as any)?.preferred_staff_id) {
    const { data: staff } = await supabase
      .from('staff')
      .select('id, display_name, photo_url, specialties, rating')
      .eq('id', (profile as any).preferred_staff_id)
      .maybeSingle();
    preferredStaff = staff;
  }

  return NextResponse.json({
    ok: true,
    preferences_notes: (profile as any)?.preferences_notes || '',
    preferred_staff: preferredStaff,
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

  const updates: any = {};
  if (parsed.data.preferred_staff_id !== undefined) {
    updates.preferred_staff_id = parsed.data.preferred_staff_id;
  }
  if (parsed.data.preferences_notes !== undefined) {
    updates.preferences_notes = parsed.data.preferences_notes;
  }

  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
