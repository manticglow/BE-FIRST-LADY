/**
 * POST /api/push/subscribe · تسجيل الجهاز للـpush
 * DELETE /api/push/subscribe · إلغاء التسجيل
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  device_label: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
  }

  const admin = createAdminClient();
  const ua = req.headers.get('user-agent') || null;
  const label = parsed.data.device_label || inferDevice(ua);

  const { error } = await admin
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
      user_agent: ua,
      device_label: label,
      last_used_at: new Date().toISOString(),
    }, { onConflict: 'endpoint' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });

  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: 'endpoint مطلوب' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

function inferDevice(ua: string | null): string {
  if (!ua) return 'جهاز غير معروف';
  if (/iPhone|iPad|iPod/.test(ua)) return 'آيفون/آيباد';
  if (/Android/.test(ua)) return 'أندرويد';
  if (/Mac/.test(ua)) return 'ماك';
  if (/Windows/.test(ua)) return 'ويندوز';
  return 'جهاز غير معروف';
}
