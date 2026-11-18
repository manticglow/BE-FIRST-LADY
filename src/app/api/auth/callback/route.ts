/**
 * GET /api/auth/callback — رد نداء بعد تأكيد البريد (OAuth / Email confirmation)
 * 🔒 SECURITY: حماية من open-redirect عبر تحقّق next
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/** يسمح فقط بمسارات محليّة تبدأ بـ "/" وليست "//" أو "/\" */
function safeRelativePath(input: string | null): string {
  const fallback = '/account';
  if (!input) return fallback;
  // يجب أن يبدأ بـ "/" ولا يبدأ بـ "//" أو "/\" (schemeless + protocol-relative)
  if (!/^\/[^/\\]/.test(input)) return fallback;
  // لا يحتوي على protocol أو @
  if (/^https?:|^\/\/|@/i.test(input)) return fallback;
  return input;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeRelativePath(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
