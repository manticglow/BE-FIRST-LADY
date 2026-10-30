/**
 * POST /api/auth/logout — تسجيل خروج
 * يرجع للصفحة الرئيسية على نفس الدومين (مو localhost)
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // استخدم origin من الطلب بدلاً من env var — يشتغل على أي دومين
  return NextResponse.redirect(new URL('/', request.url), { status: 302 });
}

export async function GET(request: NextRequest) {
  // ندعم GET كمان عشان بعض المتصفحات والـprefetch
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL('/', request.url), { status: 302 });
}
