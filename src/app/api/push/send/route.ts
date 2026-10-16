/**
 * POST /api/push/send
 * ═══════════════════════════════════════════════════════════
 * إرسال إشعار Push ناتيف
 * - للعميلة بالـ user_id
 * - أو جماعياً لكل مستخدم بدور معيّن
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendPushToUser, sendPushToAll } from '@/lib/integrations/push-sender';
import { z } from 'zod';

const schema = z.object({
  target: z.enum(['user', 'all']),
  user_id: z.string().uuid().optional(),
  role: z.enum(['customer', 'staff', 'manager', 'owner']).optional(),
  title: z.string().min(2).max(100),
  body: z.string().min(2).max(500),
  data: z.record(z.string()).optional(),
  image_url: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  // تحقّق من الدور (المالكة أو المديرة فقط)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'غير مصرّح' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return NextResponse.json({ error: 'الصلاحيّة للمالكة أو المديرة فقط' }, { status: 403 });
  }

  // تحقّق من البيانات
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'بيانات غير صحيحة', issues: parsed.error.issues }, { status: 400 });
  }

  const { target, user_id, role, ...payload } = parsed.data;

  // أرسلي
  let result;
  if (target === 'user') {
    if (!user_id) return NextResponse.json({ error: 'user_id مطلوب' }, { status: 400 });
    result = await sendPushToUser(user_id, {
      title: payload.title,
      body: payload.body,
      data: payload.data,
      imageUrl: payload.image_url,
    });
  } else {
    result = await sendPushToAll({
      title: payload.title,
      body: payload.body,
      data: payload.data,
      imageUrl: payload.image_url,
    }, role);
  }

  return NextResponse.json(result);
}
