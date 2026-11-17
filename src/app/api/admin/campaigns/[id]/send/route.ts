/**
 * POST /api/admin/campaigns/[id]/send
 * ═══════════════════════════════════════════════════════════
 * إرسال الحملة الآن · لكل الـrecipients
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { sendWhatsAppText, formatPhoneForWhatsApp } from '@/lib/integrations/whatsapp';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'غير مصرح', code: 401 };
  const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!p || !['owner', 'manager'].includes(p.role)) return { error: 'للمالكة/المديرة فقط', code: 403 };
  return { error: null, code: 0 };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.code });

  const { id } = await params;
  const admin = createAdminClient();

  // جلب الحملة
  const { data: campaign } = await admin.from('marketing_campaigns').select('*').eq('id', id).single();
  if (!campaign) return NextResponse.json({ error: 'الحملة غير موجودة' }, { status: 404 });
  if (campaign.status === 'sent') {
    return NextResponse.json({ error: 'الحملة مُرسلة مسبقاً' }, { status: 400 });
  }

  // جلب الـrecipients
  const { data: recipients } = await admin
    .from('campaign_recipients')
    .select('*')
    .eq('campaign_id', id)
    .eq('delivery_status', 'pending');

  await admin.from('marketing_campaigns').update({ status: 'sending' }).eq('id', id);

  let sent = 0;
  let failed = 0;

  // إرسال متتابع بتأخير بسيط عشان ما نحرق الـAPI
  for (const r of recipients || []) {
    const phone = formatPhoneForWhatsApp(r.phone);
    const result = await sendWhatsAppText(phone, campaign.message_ar);

    if (result.ok) {
      sent++;
      await admin
        .from('campaign_recipients')
        .update({
          delivery_status: 'sent',
          sent_at: new Date().toISOString(),
          message_id: result.messageId,
        })
        .eq('id', r.id);
    } else {
      failed++;
      await admin
        .from('campaign_recipients')
        .update({ delivery_status: 'failed' })
        .eq('id', r.id);
    }

    // تأخير 500ms بين الرسائل
    await new Promise((res) => setTimeout(res, 500));
  }

  // تحديث نهائي للحملة
  await admin
    .from('marketing_campaigns')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      total_delivered: sent,
    })
    .eq('id', id);

  return NextResponse.json({ ok: true, sent, failed, total: recipients?.length || 0 });
}
