/**
 * Supabase Client (Server)
 * للاستخدام في Server Components و Server Actions و API Routes
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components can't set cookies — ignored (handled by middleware)
          }
        },
      },
    }
  );
}

/**
 * Admin client (uses service_role key) — للعمليات التي تتجاوز RLS
 * استخدميه بحذر شديد في API routes فقط
 */
export function createAdminClient() {
  const { createClient: createSupabase } = require('@supabase/supabase-js');
  return createSupabase<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
