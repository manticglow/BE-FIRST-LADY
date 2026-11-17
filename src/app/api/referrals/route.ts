/**
 * GET/POST /api/referrals
 * ═══════════════════════════════════════════════════════════
 * - GET: جلب كود الإحالة الخاصّ بالعميلة + إحصائيّاتها
 * - POST: تسجيل إحالة جديدة (قبل التسجيل) أو استخدامها
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

function generateCode(name: string): string {
  const prefix = (name || 'TFL').replace(/[^؀-ۿa-zA-Z]/g, '').slice(0, 3).toUpperCase();
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${prefix}${suffix}`;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'غير مصرح' }, { status: 401 });

  const admin = createAdminClient();

  // تحقّق من وجود الكود · لو ما فيه · ولّد واحد
  const { data: profile } = await admin
    .from('profiles')
    .select('referral_code, full_name, wallet_balance')
    .eq('id', user.id)
    .single();

  let code = profile?.referral_code;
  if (!code) {
    code = generateCode(profile?.full_name || '');
    await admin.from('profiles').update({ referral_code: code }).eq('id', user.id);
  }

  // جلب إحصائيّات الإحالات
  const { data: referrals } = await admin
    .from('referrals')
    .select('status, referrer_reward_amount, referred_phone, referred_email, created_at')
    .eq('referrer_id', user.id);

  const stats = {
    pending: 0,
    joined: 0,
    completed: 0,
    totalEarned: 0,
  };
  (referrals || []).forEach((r: any) => {
    if (r.status === 'pending') stats.pending++;
    else if (r.status === 'joined') stats.joined++;
    else if (r.status === 'completed_first_booking' || r.status === 'rewarded') {
      stats.completed++;
      if (r.status === 'rewarded') stats.totalEarned += Number(r.referrer_reward_amount || 0);
    }
  });

  return NextResponse.json({
    ok: true,
    code,
    walletBalance: profile?.wallet_balance || 0,
    stats,
    referrals: referrals || [],
    shareUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/signup?ref=${code}`,
    whatsappMessage: `🌸 جرّبي صالون السيّدة الأولى معي!\nاستخدمي كودي "${code}" عند التسجيل · تحصلين على خصم 15% على أوّل حجز.\n${process.env.NEXT_PUBLIC_SITE_URL}/signup?ref=${code}`,
  });
}

/** استخدام كود إحالة عند التسجيل */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, phone, email } = body;

  if (!code) return NextResponse.json({ ok: false, error: 'الكود مطلوب' }, { status: 400 });

  const admin = createAdminClient();

  // ابحث عن صاحب الكود
  const { data: referrer } = await admin
    .from('profiles')
    .select('id, full_name')
    .eq('referral_code', code.toUpperCase())
    .single();

  if (!referrer) {
    return NextResponse.json({ ok: false, error: 'كود الإحالة غير صحيح' }, { status: 404 });
  }

  // سجّل الإحالة pending
  const { error } = await admin.from('referrals').insert({
    referrer_id: referrer.id,
    referred_phone: phone,
    referred_email: email,
    referral_code: code.toUpperCase(),
    status: 'pending',
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: `تمّ قبول كود الإحالة من ${referrer.full_name} · ستحصلين على 15% على أوّل حجز 💕`,
    discount: 15,
  });
}
