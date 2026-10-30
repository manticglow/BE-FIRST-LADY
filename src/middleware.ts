/**
 * Next.js Middleware — حماية المسارات
 * ═══════════════════════════════════════════════════════════
 * - /admin         → owner/manager/staff
 * - /admin/users   → owner فقط
 * - /admin/reports → owner فقط
 * - /admin/settings → owner فقط
 * - /account       → مسجلين دخول
 * - /account/attendance → staff/manager/owner
 * - /api/admin/*   → owner/manager/staff (returns JSON 403 instead of redirect)
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const OWNER_ONLY = ['/admin/users', '/admin/reports', '/admin/settings'];
const STAFF_RESTRICTED = ['/admin/customers', '/admin/staff', '/admin/services', '/admin/packages', '/admin/coupons', '/admin/reviews', '/admin/gallery', '/admin/attendance'];
// API endpoints that mirror the owner-only pages
const API_OWNER_ONLY = ['/api/admin/users', '/api/admin/settings', '/api/admin/tax-settings', '/api/admin/salon-location'];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isApiAdmin = path.startsWith('/api/admin');

  // Helper: respond for API routes (JSON) vs pages (redirect)
  function unauthorized(reason: 'auth' | 'role', redirectTo?: string) {
    if (isApiAdmin) {
      return NextResponse.json(
        { error: reason === 'auth' ? 'تسجيل الدخول مطلوب' : 'ليس لديكِ صلاحية' },
        { status: reason === 'auth' ? 401 : 403 }
      );
    }
    return NextResponse.redirect(new URL(redirectTo || '/', request.url));
  }

  // ═══ حماية /admin و /api/admin ═══
  if (path.startsWith('/admin') || isApiAdmin) {
    if (!user) {
      return unauthorized('auth', `/login?redirect=${path}`);
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['owner', 'manager', 'staff'].includes(profile.role)) {
      return unauthorized('role', '/');
    }

    // صلاحيات دقيقة — المالكة فقط
    const needsOwner =
      OWNER_ONLY.some((p) => path.startsWith(p)) ||
      API_OWNER_ONLY.some((p) => path.startsWith(p));
    if (needsOwner && profile.role !== 'owner') {
      return unauthorized('role', '/admin');
    }

    // STAFF ممنوعة من بعض الصفحات
    if (STAFF_RESTRICTED.some((p) => path.startsWith(p)) && profile.role === 'staff') {
      return unauthorized('role', '/admin');
    }
  }

  // ═══ حماية /account/attendance و /account/leaves — للموظفات فقط ═══
  if (path.startsWith('/account/attendance') || path.startsWith('/account/leaves')) {
    if (!user) {
      return NextResponse.redirect(new URL(`/login?redirect=${path}`, request.url));
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['staff', 'manager', 'owner'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/account', request.url));
    }
  }
  // ═══ باقي /account/* — للعميلات فقط ═══
  else if (path.startsWith('/account')) {
    if (!user) {
      return NextResponse.redirect(new URL(`/login?redirect=${path}`, request.url));
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile && ['owner', 'manager', 'staff'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/api/admin/:path*'],
};
