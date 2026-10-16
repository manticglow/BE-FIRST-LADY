/**
 * GET  /api/admin/salon-location
 * PUT  /api/admin/salon-location — { latitude, longitude, radius_m, name, address }
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'غير مصرح', supabase: null };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return { error: 'ليس لديك صلاحية', supabase: null };
  }
  return { error: null, supabase };
}

export async function GET() {
  const { error, supabase } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });
  const { data } = await supabase!.from('salon_locations').select('*').eq('is_active', true).single();
  return NextResponse.json({ location: data });
}

export async function PUT(req: NextRequest) {
  const { error, supabase } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: 403 });
  const body = await req.json();

  const { data: existing } = await supabase!.from('salon_locations').select('id').eq('is_active', true).limit(1).single();

  const payload = {
    name: body.name || 'الصالون الرئيسي',
    address: body.address || null,
    latitude: body.latitude,
    longitude: body.longitude,
    radius_m: body.radius_m || 100,
  };

  if (existing) {
    const { error: err } = await supabase!.from('salon_locations').update(payload).eq('id', existing.id);
    if (err) return NextResponse.json({ error: err.message }, { status: 400 });
  } else {
    const { error: err } = await supabase!.from('salon_locations').insert({ ...payload, is_active: true });
    if (err) return NextResponse.json({ error: err.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
