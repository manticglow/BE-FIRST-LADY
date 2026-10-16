/**
 * Email Integration — Resend
 * ═══════════════════════════════════════════════════════════
 * ⚙️ SETUP:
 *   1. سجّلي في resend.com (مجاني 3000 بريد/شهر)
 *   2. أضيفي الدومين (SPF + DKIM)
 *   3. احصلي على API Key
 *   4. أضيفي في .env.local:
 *      RESEND_API_KEY=re_xxxxx
 *      RESEND_FROM=noreply@befirstlady.com
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

interface EmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'noreply@befirstlady.com';

  if (!apiKey) return { ok: false, error: 'Resend غير مُفعّل' };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `Be First Lady <${from}>`,
        to: params.to,
        subject: params.subject,
        html: params.html,
      }),
    });

    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.message || 'فشل الإرسال' };
    return { ok: true, id: data.id };
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

// قوالب HTML بالهوية ─────────────────────────────────
export const EmailTemplates = {
  bookingConfirmation: (name: string, date: string, time: string, bookingNumber: string, total: number) => ({
    subject: `✨ تأكيد حجزكِ · Be First Lady`,
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><style>
  body { font-family: 'Cairo', Arial, sans-serif; background: #fbf7ef; padding: 20px; color: #2a1c10; }
  .card { max-width: 540px; margin: auto; background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(125,97,59,.12); }
  .header { background: linear-gradient(to left, #7d613b, #2a1c10); color: #fbf7ef; padding: 40px 30px; text-align: center; }
  .content { padding: 30px; }
  .divider { height: 1px; background: #ece1cc; margin: 20px 0; }
  .btn { display: inline-block; background: #7d613b; color: #fbf7ef !important; padding: 12px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; }
  .info { background: #fbf7ef; border-right: 4px solid #c9a96e; padding: 15px; margin: 10px 0; border-radius: 12px; }
</style></head>
<body>
  <div class="card">
    <div class="header">
      <div style="font-size: 32px; font-style: italic; font-family: 'Cormorant Garamond', serif;">Be First Lady</div>
      <div style="font-size: 10px; letter-spacing: 4px; margin-top: 10px;">SPA & SALON</div>
    </div>
    <div class="content">
      <h2 style="color: #7d613b; margin-top: 0;">أهلاً ${name} 💛</h2>
      <p>تم تأكيد حجزكِ معنا — نرحّب بكِ 🌸</p>

      <div class="info">
        <div style="font-size: 11px; color: #6b5a42; margin-bottom: 5px;">تفاصيل الحجز</div>
        <div><strong>📅 التاريخ:</strong> ${date}</div>
        <div><strong>⏰ الوقت:</strong> ${time}</div>
        <div><strong>🔖 الرقم:</strong> ${bookingNumber}</div>
        <div><strong>💰 المبلغ:</strong> ${total} ر.س</div>
      </div>

      <p style="font-size: 13px; color: #6b5a42;">
        نرجو الوصول قبل 10 دقائق من موعدكِ.<br>
        للتعديل أو الإلغاء، تواصلي معنا على الواتساب.
      </p>

      <div class="divider"></div>

      <p style="text-align: center; font-style: italic; color: #7d613b;">
        نعتني بكِ لتُزهري
      </p>
    </div>
  </div>
</body></html>`,
  }),

  passwordReset: (resetLink: string) => ({
    subject: 'إعادة تعيين كلمة المرور · Be First Lady',
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Cairo', Arial, sans-serif; background: #fbf7ef; padding: 30px; text-align: center;">
  <div style="max-width: 400px; margin: auto; background: white; padding: 40px 30px; border-radius: 24px;">
    <div style="font-size: 28px; color: #7d613b; font-style: italic; font-family: serif;">Be First Lady</div>
    <h2 style="color: #2a1c10;">إعادة تعيين كلمة المرور</h2>
    <p style="color: #6b5a42; font-size: 14px;">اضغطي الزر لتعيين كلمة مرور جديدة. الرابط صالح لـ 15 دقيقة فقط.</p>
    <a href="${resetLink}" style="display: inline-block; background: #7d613b; color: #fbf7ef; padding: 14px 36px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 20px 0;">إعادة التعيين</a>
    <p style="font-size: 11px; color: #6b5a42;">لو ما طلبتِ هذا، تجاهلي هذي الرسالة.</p>
  </div>
</body></html>`,
  }),
};
