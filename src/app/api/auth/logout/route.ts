/**
 * POST /api/auth/logout — تسجيل خروج
 * ═══════════════════════════════════════════════════════════
 * - POST فقط (نحذف GET لمنع prefetch-logout + CSRF)
 * - يرجع JSON لو العميل طلب JSON (Accept: application/json)
 * - يحوّل للصفحة الرئيسيّة لو العميل Form عادي (fallback آمن)
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // Form POST بدون Accept: application/json → redirect عشان ما تطلع JSON على الشاشة
  const accept = request.headers.get('accept') || '';
  const wantsJson = accept.includes('application/json');

  if (!wantsJson) {
    const url = new URL('/', request.url);
    return NextResponse.redirect(url, { status: 303 });
  }

  return NextResponse.json({ ok: true, message: 'نراكِ قريباً · حفظكِ الله 🤍' });
}
