/**
 * قالب إيميل بطاقة الهديّة · HTML فاخر
 * ═══════════════════════════════════════════════════════════
 * - RTL
 * - inline styles (توافق كل عملاء الإيميل)
 * - تصميم فاخر مع ألوان خاصّة بكل design
 */
export interface GiftCardEmailData {
  code: string;
  amount: number;
  recipient_name: string;
  purchaser_name?: string | null;
  message?: string | null;
  design: 'gold' | 'pink' | 'floral';
  expires_at?: string | null;
  qr_cid?: string;  // Content-ID للـQR المرفق (cid:qr-code)
}

const DESIGNS = {
  gold: {
    bgTop: '#1a1510',
    bgBottom: '#3a2a18',
    accent: '#d4b062',
    accentLight: '#e8c988',
    text: '#f5e8c8',
    sub: '#c9a85a',
  },
  pink: {
    bgTop: '#3a1a20',
    bgBottom: '#5a2838',
    accent: '#e8a4b4',
    accentLight: '#f0b8c6',
    text: '#faeef1',
    sub: '#d88a9c',
  },
  floral: {
    bgTop: '#2a2520',
    bgBottom: '#4a4530',
    accent: '#c4b588',
    accentLight: '#d8c99e',
    text: '#f8f4e8',
    sub: '#b0a070',
  },
};

export function buildGiftCardEmailHtml(data: GiftCardEmailData): string {
  const d = DESIGNS[data.design] || DESIGNS.gold;
  const qrImgSrc = data.qr_cid
    ? `cid:${data.qr_cid}`
    : `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data.code)}&margin=10`;

  const expiryText = data.expires_at
    ? new Date(data.expires_at).toLocaleDateString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : 'بلا تاريخ انتهاء';

  const fromLine = data.purchaser_name
    ? `<p style="margin:0 0 20px 0; font-size:14px; color:#8a7a68; line-height:1.6;">
         بطاقة مُهداة من <strong style="color:#5a4a38;">${escapeHtml(data.purchaser_name)}</strong>
       </p>`
    : '';

  const personalMessage = data.message
    ? `<div style="margin:24px 0; padding:16px 20px; background:#faf6ee; border-right:3px solid ${d.accent}; border-radius:8px;">
         <p style="margin:0; font-size:13px; color:#6a5a48; line-height:1.7; font-style:italic;">
           "${escapeHtml(data.message)}"
         </p>
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>بطاقة هديّة من Be First Lady</title>
</head>
<body style="margin:0; padding:0; background:#f8f4ec; font-family: -apple-system, 'Segoe UI', Tahoma, Arial, sans-serif;">

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8f4ec; padding:30px 15px;">
  <tr>
    <td align="center">

      <!-- ═══ Container ═══ -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="580" style="max-width:580px; width:100%; background:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 40px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="padding:28px 30px 20px; text-align:center; border-bottom:1px solid #f0e8d8;">
            <div style="font-size:11px; letter-spacing:4px; color:#a89668; text-transform:uppercase; font-weight:300; margin-bottom:6px;">
              BE FIRST LADY
            </div>
            <div style="font-size:22px; color:#3a2a18; font-weight:700; letter-spacing:1px;">
              💝 بطاقة هديّة فاخرة
            </div>
          </td>
        </tr>

        <!-- Gift Card Visual -->
        <tr>
          <td style="padding:30px 30px 10px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:linear-gradient(135deg, ${d.bgTop} 0%, ${d.bgBottom} 100%); border-radius:16px; overflow:hidden;">
              <tr>
                <td style="padding:30px 28px; position:relative;">

                  <!-- Top header -->
                  <div style="text-align:center; margin-bottom:16px;">
                    <div style="font-size:10px; letter-spacing:5px; color:${d.sub}; text-transform:uppercase;">
                      · LUXURY GIFT ·
                    </div>
                  </div>

                  <!-- Amount + QR row -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td valign="middle" width="60%">
                        <div style="font-size:10px; color:${d.sub}; margin-bottom:4px; letter-spacing:1px;">
                          قيمة البطاقة
                        </div>
                        <div style="font-size:52px; font-weight:700; color:${d.text}; line-height:1; letter-spacing:-1px; font-family:Georgia, 'Times New Roman', serif;">
                          ${data.amount.toLocaleString('ar-SA')}
                        </div>
                        <div style="font-size:12px; color:${d.accent}; margin-top:6px; letter-spacing:2px; font-weight:500;">
                          ر.س · SAR
                        </div>
                      </td>
                      <td valign="middle" width="40%" align="left">
                        <div style="background:#ffffff; padding:10px; border-radius:12px; display:inline-block; box-shadow:0 0 0 1px ${d.accent}60;">
                          <img src="${qrImgSrc}" alt="${escapeHtml(data.code)}" width="110" height="110" style="display:block; width:110px; height:110px;">
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Divider -->
                  <div style="height:1px; background:${d.accent}30; margin:20px 0 16px;"></div>

                  <!-- Recipient + Code -->
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td>
                        <div style="font-size:9px; color:${d.sub}; margin-bottom:3px; letter-spacing:1px;">
                          إلى
                        </div>
                        <div style="font-size:16px; color:${d.text}; font-weight:500;">
                          ${escapeHtml(data.recipient_name)}
                        </div>
                      </td>
                      <td align="left">
                        <div style="font-size:9px; color:${d.sub}; margin-bottom:3px; letter-spacing:1px;">
                          الكود
                        </div>
                        <div style="font-size:16px; color:${d.accentLight}; font-weight:600; font-family:'Courier New', monospace; letter-spacing:1.5px;">
                          ${escapeHtml(data.code)}
                        </div>
                      </td>
                    </tr>
                  </table>

                  <!-- Footer -->
                  <div style="font-size:9px; color:${d.sub}; text-align:center; margin-top:18px; padding-top:12px; border-top:1px solid ${d.accent}20; letter-spacing:1px;">
                    صالحة حتى ${expiryText}
                    <span style="color:${d.accent}; margin:0 8px;">·</span>
                    Madinah · Saudi Arabia
                  </div>

                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Personal Message -->
        <tr>
          <td style="padding:5px 30px 0;">
            ${fromLine}
            ${personalMessage}
          </td>
        </tr>

        <!-- Instructions -->
        <tr>
          <td style="padding:20px 30px 10px;">
            <h3 style="margin:0 0 12px 0; font-size:15px; color:#3a2a18; font-weight:700;">
              🌸 كيف تستخدمي البطاقة؟
            </h3>
            <ol style="margin:0; padding:0 20px 0 0; font-size:13px; color:#6a5a48; line-height:1.9;">
              <li>احجزي من موقعنا <a href="https://befirstlady.com" style="color:${d.accent}; text-decoration:none; font-weight:600;">befirstlady.com</a> أو مباشرة من الصالون</li>
              <li>عند الدفع · أدخلي كود البطاقة <strong style="color:#3a2a18; font-family:monospace;">${escapeHtml(data.code)}</strong></li>
              <li>أو أظهري كود QR أعلاه عند الاستقبال</li>
            </ol>
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td align="center" style="padding:24px 30px 30px;">
            <a href="https://befirstlady.com/book" style="display:inline-block; background:linear-gradient(135deg, ${d.bgTop} 0%, ${d.bgBottom} 100%); color:${d.text}; text-decoration:none; padding:14px 36px; border-radius:12px; font-size:14px; font-weight:700; letter-spacing:1px; box-shadow:0 4px 14px rgba(58,42,24,0.3);">
              احجزي الآن ✨
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 30px 24px; background:#faf6ee; text-align:center; border-top:1px solid #f0e8d8;">
            <div style="font-size:11px; color:#a89668; letter-spacing:1px; margin-bottom:6px;">
              Be First Lady · المدينة المنوّرة
            </div>
            <div style="font-size:10px; color:#b8a888;">
              📞 للاستفسار · 920000000 · بطاقة غير قابلة للاسترداد النقدي
            </div>
          </td>
        </tr>

      </table>

      <!-- Below card tip -->
      <div style="max-width:580px; margin:16px auto 0; font-size:11px; color:#8a7a68; text-align:center; line-height:1.6;">
        هذه رسالة مُؤتمتة من <strong>Be First Lady</strong> · لا تردّي على هذا الإيميل.
      </div>

    </td>
  </tr>
</table>

</body>
</html>`;
}

export function buildGiftCardEmailText(data: GiftCardEmailData): string {
  const expiryText = data.expires_at
    ? new Date(data.expires_at).toLocaleDateString('ar-SA')
    : 'بلا تاريخ انتهاء';
  return `🎁 بطاقة هديّة فاخرة من Be First Lady

عزيزتي ${data.recipient_name}،
${data.message ? `\n${data.message}\n` : ''}
💎 قيمة البطاقة: ${data.amount} ر.س
🔑 الكود: ${data.code}
📅 ${expiryText}

كيف تستخدمينها؟
1. احجزي من befirstlady.com أو مباشرة من الصالون
2. أدخلي الكود عند الدفع · أو أظهري QR عند الاستقبال

Be First Lady · المدينة المنوّرة`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
