/**
 * GET /api/admin/search?q=xxx
 * - بحث شامل في: الحجوزات، العميلات، الخدمات، الموظفات، الكوبونات
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ results: [] });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['owner', 'manager', 'staff'].includes(profile.role)) {
    return NextResponse.json({ results: [] });
  }

  const likeQ = `%${q}%`;

  const [
    { data: bookings },
    { data: customers },
    { data: services },
    { data: staff },
    { data: coupons },
  ] = await Promise.all([
    supabase.from('bookings').select('id, booking_number, customer_name, customer_phone, booking_date')
      .or(`customer_name.ilike.${likeQ},customer_phone.ilike.${likeQ},booking_number.ilike.${likeQ}`)
      .limit(5),
    supabase.from('profiles').select('id, full_name, phone, email').eq('role', 'customer')
      .or(`full_name.ilike.${likeQ},phone.ilike.${likeQ},email.ilike.${likeQ}`)
      .limit(5),
    supabase.from('services').select('id, name_ar, name_en, price')
      .or(`name_ar.ilike.${likeQ},name_en.ilike.${likeQ}`).eq('is_active', true)
      .limit(5),
    supabase.from('staff').select('id, name, job_title')
      .or(`name.ilike.${likeQ},job_title.ilike.${likeQ}`).eq('is_active', true)
      .limit(5),
    supabase.from('coupons').select('id, code, description, discount_value, discount_type')
      .ilike('code', likeQ).eq('is_active', true)
      .limit(5),
  ]);

  const results = [
    ...(bookings || []).map((b) => ({
      type: 'booking',
      icon: '📅',
      title: `حجز #${b.booking_number}`,
      subtitle: `${b.customer_name} · ${b.booking_date}`,
      href: `/admin/bookings/${b.id}/invoice`,
    })),
    ...(customers || []).map((c) => ({
      type: 'customer',
      icon: '👤',
      title: c.full_name,
      subtitle: `${c.phone || ''} ${c.email || ''}`.trim(),
      href: `/admin/customers`,
    })),
    ...(services || []).map((s) => ({
      type: 'service',
      icon: '✂️',
      title: s.name_ar,
      subtitle: `${s.price} ر.س`,
      href: `/admin/services`,
    })),
    ...(staff || []).map((s) => ({
      type: 'staff',
      icon: '👩‍💼',
      title: s.name,
      subtitle: s.job_title,
      href: `/admin/staff`,
    })),
    ...(coupons || []).map((c) => ({
      type: 'coupon',
      icon: '🏷️',
      title: c.code,
      subtitle: `${c.discount_value}${c.discount_type === 'percentage' ? '%' : ' ر.س'}`,
      href: `/admin/coupons`,
    })),
  ];

  return NextResponse.json({ results });
}
