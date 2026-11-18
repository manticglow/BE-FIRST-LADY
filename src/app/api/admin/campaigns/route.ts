/**
 * GET/POST /api/admin/campaigns
 * ═══════════════════════════════════════════════════════════
 * إدارة الحملات التسويقيّة · بناء جمهور + إرسال
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, error: 'غير مصرح', code: 401 };
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!p || !['owner', 'manager'].includes(p.role)) return { user, error: 'للمالكة/المديرة فقط', code: 403 };
  return { user, error: null, code: 0 };
}

export async function GET() {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const admin = createAdminClient();
  const { data } = await admin
    .from('marketing_campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  return NextResponse.json({ ok: true, campaigns: data || [] });
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const body = await req.json();
  const admin = createAdminClient();

  // بناء جمهور الحملة حسب الـsegment
  const audience = await buildAudience(admin, body.target_segment);

  const { data: campaign, error } = await admin
    .from('marketing_campaigns')
    .insert({
      name: body.name,
      message_ar: body.message_ar,
      target_segment: body.target_segment,
      custom_filter: body.custom_filter || null,
      coupon_code: body.coupon_code || null,
      discount_percent: body.discount_percent || null,
      status: body.schedule ? 'scheduled' : 'draft',
      scheduled_for: body.scheduled_for || null,
      total_recipients: audience.length,
      created_by: check.user!.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });

  // إضافة الجمهور
  if (audience.length > 0) {
    await admin.from('campaign_recipients').insert(
      audience.map((c) => ({
        campaign_id: campaign.id,
        customer_id: c.id,
        phone: c.phone,
        delivery_status: 'pending' as const,
      })),
    );
  }

  return NextResponse.json({ ok: true, campaign, audienceCount: audience.length });
}

/* ═══════════════════════════════════════════════════════════ */

async function buildAudience(admin: any, segment: string): Promise<any[]> {
  // 🔒 PDPL: لا نرسل حملات تسويقيّة إلا لمن منحت marketing_consent صريح
  let query = admin
    .from('profiles')
    .select('id, phone, full_name, birthday, loyalty_tier')
    .eq('role', 'customer')
    .eq('marketing_consent', true)
    .not('phone', 'is', null);

  switch (segment) {
    case 'inactive_60d':
    case 'inactive_90d':
    case 'inactive_180d': {
      const days = segment === 'inactive_60d' ? 60 : segment === 'inactive_90d' ? 90 : 180;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().slice(0, 10);

      const { data: active } = await admin
        .from('bookings')
        .select('customer_id')
        .gte('booking_date', cutoffStr);
      const activeIds = (active || []).map((b: any) => b.customer_id).filter(Boolean);

      // العميلات اللي ما حجزن في المدّة
      const { data: all } = await query;
      return (all || []).filter((c: any) => !activeIds.includes(c.id));
    }

    case 'vip': {
      const { data } = await query.in('loyalty_tier', ['gold', 'platinum']);
      return data || [];
    }

    case 'birthdays_this_month': {
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const { data } = await query.not('birthday', 'is', null);
      return (data || []).filter((c: any) => c.birthday?.split('-')[1] === month);
    }

    case 'new_customers': {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      const { data } = await admin.from('profiles')
        .select('id, phone, full_name')
        .eq('role', 'customer')
        .not('phone', 'is', null)
        .gte('created_at', monthAgo.toISOString());
      return data || [];
    }

    case 'all':
    default: {
      const { data } = await query;
      return data || [];
    }
  }
}
