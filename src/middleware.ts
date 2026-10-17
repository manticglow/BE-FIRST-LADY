/**
 * Next.js Middleware — حماية المسارات
 * ═══════════════════════════════════════════════════════════
 * - /admin         → owner/manager/staff
 * - /admin/users   → owner فقط
 * - /admin/reports → owner فقط
 * - /admin/settings → owner فقط
 * - /account       → العميلات فقط (الإداريات تتحوّل لـ/admin)
 * - /account/attendance و /account/leaves → staff/manager/owner
 */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const OWNER_ONLY = ['/admin/users', '/admin/reports', '/admin/settings'];
const STAFF_RESTRICTED = ['/admin/customers', '/admin/staff', '/admin/services', '/admin/packages', '/admin/coupons', '/admin/reviews', '/admin/gallery', '/admin/attendance'];

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

  // حماية /admin ───────────
  if (path.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login?redirect=/admin', request.url));
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['owner', 'manager', 'staff'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    if (OWNER_ONLY.some((p) => path.startsWith(p)) && profile.role !== 'owner') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (STAFF_RESTRICTED.some((p) => path.startsWith(p)) && profile.role === 'staff') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // حماية /account/attendance — للموظفات/المديرات/المالكة فقط
  if (path.startsWith('/account/attendance')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login?redirect=/account/attendance', request.url));
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['staff', 'manager', 'owner'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/account', request.url));
    }
  }
  // حماية /account/leaves — للموظفات/المديرات/المالكة فقط
  else if (path.startsWith('/account/leaves')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login?redirect=/account/leaves', request.url));
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (!profile || !['staff', 'manager', 'owner'].includes(profile.role)) {
      return NextResponse.redirect(new URL('/account', request.url));
    }
  }
  // حماية باقي /account/* — للعميلات فقط · الإداريات تحوّل تلقائياً لـ/admin
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
  matcher: ['/admin/:path*', '/account/:path*'],
};
