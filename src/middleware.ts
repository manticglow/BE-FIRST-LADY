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

const OWNER_ONLY = ['/admin/users', '/admin/reports', '/admin/settings', '/admin/backup', '/admin/health'];
const STAFF_RESTRICTED = ['/admin/customers', '/admin/staff', '/admin/services', '/admin/packages', '/admin/coupons', '/admin/reviews', '/admin/gallery', '/admin/attendance'];
// API endpoints that mirror the owner-only pages
const API_OWNER_ONLY = ['/api/admin/users', '/api/admin/settings', '/api/admin/tax-settings', '/api/admin/salon-location', '/api/admin/backup', '/api/admin/errors'];

// ─── Rate Limiting ───────────────────────────────────────
// in-memory map (OK for single-instance · لو multi-instance نحتاج Redis/Supabase)
const RATE_BUCKETS = new Map<string, { count: number; reset: number }>();

// حدود مختلفة حسب نوع المسار
function getRateLimitFor(path: string): { max: number; windowMs: number } | null {
  // auth endpoints · صارم
  if (path.startsWith('/api/auth/otp/send'))   return { max: 3,   windowMs: 60_000 };
  if (path.startsWith('/api/auth/otp/verify')) return { max: 10,  windowMs: 60_000 };
  if (path.startsWith('/api/auth/'))           return { max: 15,  windowMs: 60_000 };

  // payment · حرج
  if (path.startsWith('/api/payments/create')) return { max: 10,  windowMs: 60_000 };
  if (path.startsWith('/api/payments/'))       return { max: 30,  windowMs: 60_000 };

  // bookings
  if (path === '/api/bookings' && path.length === 13) return { max: 10, windowMs: 60_000 };

  // newsletter · spam prevention
  if (path.startsWith('/api/newsletter/'))     return { max: 5,   windowMs: 900_000 };

  // admin APIs · أقل تشدّداً لأنّ فيها auth
  if (path.startsWith('/api/admin/'))          return { max: 120, windowMs: 60_000 };

  // عام
  if (path.startsWith('/api/'))                return { max: 60,  windowMs: 60_000 };

  return null; // ما نحدّد صفحات regular
}

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real;
  return 'unknown';
}

function checkRate(key: string, max: number, windowMs: number): { ok: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  let bucket = RATE_BUCKETS.get(key);

  // نظّفي القديم كل مرّة
  if (RATE_BUCKETS.size > 10000) {
    for (const [k, v] of RATE_BUCKETS.entries()) {
      if (v.reset < now) RATE_BUCKETS.delete(k);
    }
  }

  if (!bucket || bucket.reset < now) {
    bucket = { count: 0, reset: now + windowMs };
    RATE_BUCKETS.set(key, bucket);
  }

  bucket.count++;
  const remaining = Math.max(0, max - bucket.count);
  const resetIn = Math.max(0, Math.ceil((bucket.reset - now) / 1000));

  return { ok: bucket.count <= max, remaining, resetIn };
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // ═══ Rate Limiting (قبل كل شي) ═══
  const limit = getRateLimitFor(path);
  if (limit) {
    const ip = getClientIp(request);
    const key = `${ip}:${path.split('?')[0]}`;
    const rl = checkRate(key, limit.max, limit.windowMs);
    if (!rl.ok) {
      return NextResponse.json(
        {
          error: 'محاولات كثيرة · حاولي بعد قليل',
          code: 'rate_limited',
          retry_after: rl.resetIn,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rl.resetIn),
            'X-RateLimit-Limit': String(limit.max),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(rl.resetIn),
          },
        },
      );
    }
    // headers معلوماتيّة
    if (path.startsWith('/api/')) {
      // سنضيفها للـresponse بعدين
    }
  }

  let response = NextResponse.next({ request });

  // headers معلوماتيّة (لو rate limit مُفعّل)
  if (limit) {
    const ip = getClientIp(request);
    const key = `${ip}:${path.split('?')[0]}`;
    const bucket = RATE_BUCKETS.get(key);
    if (bucket) {
      response.headers.set('X-RateLimit-Limit', String(limit.max));
      response.headers.set('X-RateLimit-Remaining', String(Math.max(0, limit.max - bucket.count)));
    }
  }

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
  matcher: [
    '/admin/:path*',
    '/account/:path*',
    '/api/:path*',
  ],
};
