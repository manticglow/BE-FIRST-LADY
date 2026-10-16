/**
 * GET    /api/admin/users     — قائمة اليوزرات
 * POST   /api/admin/users     — إنشاء مستخدم (owner فقط)
 * PATCH  /api/admin/users     — تحديث دور/بيانات
 * DELETE /api/admin/users?id  — حذف يوزر
 */
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

async function requireOwner() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'غير مصرح', code: 403 };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'owner') {
    return { error: 'للمالكة فقط إدارة اليوزرات', code: 403 };
  }
  return { error: null, code: 0 };
}

export async function GET() {
  const check = await requireOwner();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const admin = createAdminClient();
  const { data: profiles } = await admin
    .from('profiles')
    .select('*')
    .in('role', ['owner', 'manager', 'staff'])
    .order('created_at', { ascending: false });

  return NextResponse.json({ users: profiles || [] });
}

export async function POST(req: NextRequest) {
  const check = await requireOwner();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const { email, password, full_name, phone, role } = await req.json();
  if (!email || !password || !full_name || !role) {
    return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 });
  }
  // العميلات يسجّلن بأنفسهن — من هنا ننشئ فريق العمل فقط
  if (!['owner', 'manager', 'staff'].includes(role)) {
    return NextResponse.json({ error: 'الدور المسموح: owner, manager, staff فقط. العميلات يسجّلن بأنفسهن' }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'كلمة المرور قصيرة جداً' }, { status: 400 });
  }

  const admin = createAdminClient();

  // أنشئ المستخدم في auth
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email, password,
    email_confirm: true,  // لا نحتاج تأكيد بريد
    user_metadata: { full_name, phone },
  });

  if (authErr || !authData.user) {
    return NextResponse.json({ error: authErr?.message || 'فشل إنشاء الحساب' }, { status: 400 });
  }

  // أنشئ profile
  const { error: profileErr } = await admin.from('profiles').insert({
    id: authData.user.id,
    full_name, email, phone, role,
  });

  if (profileErr) {
    // تنظيف — احذف المستخدم من auth
    await admin.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: profileErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, user_id: authData.user.id });
}

export async function PATCH(req: NextRequest) {
  const check = await requireOwner();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const { id, role, full_name, phone } = await req.json();
  if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

  const admin = createAdminClient();
  const updates: any = {};
  if (role) {
    if (!['owner', 'manager', 'staff'].includes(role)) {
      return NextResponse.json({ error: 'الدور المسموح: owner, manager, staff فقط' }, { status: 400 });
    }
    updates.role = role;
  }
  if (full_name) updates.full_name = full_name;
  if (phone !== undefined) updates.phone = phone;

  const { error } = await admin.from('profiles').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const check = await requireOwner();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id مطلوب' }, { status: 400 });

  const admin = createAdminClient();
  // احذف من auth (profiles ينحذف بالـ cascade)
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
