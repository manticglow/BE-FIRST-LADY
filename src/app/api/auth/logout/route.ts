/**
 * POST /api/auth/logout — تسجيل خروج
 * ═══════════════════════════════════════════════════════════
 * - POST فقط (نحذف GET لمنع prefetch-logout + CSRF)
 * - يرجع JSON (ليس redirect) حتى UI يعرض toast الفراق قبل التحويل
 */
import { createClient } from '@/lib/supabase/server';
import { NextResponse, type NextRequest } from 'next/server';

export async function POST(_request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.json({ ok: true, message: 'نراكِ قريباً · حفظكِ الله 🤍' });
}
