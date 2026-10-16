/**
 * GET /api/admin/export/bookings?from=&to=
 * - تصدير الحجوزات كـ CSV (يفتح في Excel)
 */
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response('غير مصرح', { status: 401 });
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['owner', 'manager'].includes(profile.role)) {
    return new Response('ليس لديك صلاحية', { status: 403 });
  }

  const from = req.nextUrl.searchParams.get('from');
  const to = req.nextUrl.searchParams.get('to');

  let query = supabase.from('bookings').select('*, items:booking_items(service_name, price)').order('booking_date', { ascending: false });
  if (from) query = query.gte('booking_date', from);
  if (to) query = query.lte('booking_date', to);

  const { data: bookings } = await query;

  // CSV with UTF-8 BOM لعربي صحيح في Excel
  const BOM = '﻿';
  const headers = [
    'رقم الحجز', 'العميلة', 'الجوال', 'التاريخ', 'الوقت', 'المدة (دقيقة)',
    'الخدمات', 'المجموع', 'الخصم', 'الإجمالي', 'الحالة', 'الدفع',
    'هدية', 'المرسِلة', 'تاريخ الإنشاء',
  ];

  const rows = (bookings || []).map((b: any) => {
    const services = b.items?.map((i: any) => i.service_name).join(' + ') || '';
    const statusMap: Record<string, string> = {
      pending: 'معلّق', confirmed: 'مؤكّد', in_progress: 'جاري',
      completed: 'مكتمل', cancelled: 'ملغي', no_show: 'لم تحضر',
    };
    const payMap: Record<string, string> = {
      unpaid: 'غير مدفوع', paid: 'مدفوع', partial: 'جزئي', refunded: 'مُستردّ',
    };
    return [
      b.booking_number || '',
      b.customer_name,
      b.customer_phone,
      b.booking_date,
      b.booking_time?.slice(0, 5) || '',
      b.duration_min,
      services,
      b.subtotal,
      b.discount,
      b.total,
      statusMap[b.status] || b.status,
      payMap[b.payment_status] || b.payment_status,
      b.is_gift ? 'نعم' : 'لا',
      b.gift_from_name || '',
      new Date(b.created_at).toLocaleString('en-GB'),
    ];
  });

  const escape = (v: any) => {
    const s = String(v ?? '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const csv = BOM + headers.map(escape).join(',') + '\n' +
    rows.map((r) => r.map(escape).join(',')).join('\n');

  const filename = `bookings-${new Date().toISOString().split('T')[0]}.csv`;

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
