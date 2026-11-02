/**
 * GET /api/account/beauty-profile
 * PATCH /api/account/beauty-profile
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

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('beauty_profile')
    .eq('id', user.id)
    .single();

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

  // merge مع الموجود (نحفظ الحقول اللي ما تغيّرت)
  const { data: current } = await supabase
    .from('profiles')
    .select('beauty_profile')
    .eq('id', user.id)
    .single();

  const existing = (current as any)?.beauty_profile || {};
  const merged = { ...existing, ...parsed.data, updated_at: new Date().toISOString() };

  const { error } = await supabase
    .from('profiles')
    .update({ beauty_profile: merged })
    .eq('id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, profile: merged });
}
