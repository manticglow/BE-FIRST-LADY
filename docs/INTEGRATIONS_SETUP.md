# 🔌 دليل تفعيل التكاملات الخارجية

> **Be First Lady v2** — Group B External Integrations
> كل الملفات جاهزة. فعّلي بإضافة مفاتيح البيئة فقط.

---

## 🟢 1. WhatsApp Cloud API (مجاني — من Meta)

### الاستخدام:
- تأكيد الحجوزات تلقائياً
- تذكير قبل 24 ساعة + ساعتين
- شكر بعد الزيارة + طلب تقييم
- عرض عيد الميلاد
- استرجاع العميلات الغائبات

### الإعداد (مرة واحدة):
1. اذهبي إلى [developers.facebook.com](https://developers.facebook.com)
2. أنشئي **Business Account** (مجاناً)
3. أضيفي **WhatsApp Product**
4. احصلي على:
   - `Phone Number ID` (رقم جوال الأعمال)
   - `Permanent Access Token`
5. أضيفي في `.env.local`:

```bash
WHATSAPP_PHONE_NUMBER_ID=xxxxxxxxxxxxxx
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxx...
```

### التحقق:
```typescript
import { sendWhatsAppMessage } from '@/lib/integrations/whatsapp';
await sendWhatsAppMessage('0501234567', 'تجربة');
```

### القوالب الجاهزة:
- `bookingConfirmation(name, date, time, bookingNumber)`
- `reminder24h(name, time)`
- `reminder2h(name)`
- `thankYou(name, reviewLink)`
- `birthday(name, discountCode)`
- `winBack(name, discountCode)`

### 💰 التسعير:
- أول 1,000 محادثة مجاناً شهرياً
- بعدها: 0.03 ر.س لكل رسالة تقريباً

---

## 💳 2. Moyasar Payment Gateway (سعودية)

### المدعومة:
- 💳 مدى (البنوك السعودية)
- 💳 فيزا / ماستر كارد
- 📱 Apple Pay
- 📱 STC Pay

### الإعداد:
1. سجّلي في [moyasar.com](https://moyasar.com)
2. يُطلب منكِ:
   - 📋 السجل التجاري
   - 🏦 رقم IBAN
3. احصلي على:
   - `Publishable Key` (للعميلة)
   - `Secret Key` (للسيرفر)
   - `Webhook Secret` (للتأكيد)
4. أضيفي في `.env.local`:

```bash
NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY=pk_test_xxxxx
MOYASAR_SECRET_KEY=sk_test_xxxxx
MOYASAR_WEBHOOK_SECRET=whsec_xxxxx
```

### الاستخدام:
```typescript
import { createPayment } from '@/lib/integrations/moyasar';

const payment = await createPayment({
  amount: 350,                        // بالريال
  description: 'حجز #B-20241015-001',
  bookingId: booking.id,
  callbackUrl: 'https://befirstlady.com/payment/callback',
  source: { type: 'creditcard', ... },
});

// بعد النجاح:
if (payment.ok) {
  window.location.href = payment.transactionUrl!;
}
```

### 💰 الرسوم:
- 2.5% + 1 ر.س لكل عملية (بطاقات ائتمان)
- 1% لمدى
- STC Pay: 1%

---

## 📧 3. Resend Email (مجاني — 3000 بريد/شهر)

### الاستخدام:
- تأكيد الحجز بالبريد
- إعادة تعيين كلمة المرور
- إشعارات مخصصة

### الإعداد:
1. سجّلي في [resend.com](https://resend.com)
2. أضيفي دومينكِ:
   - `befirstlady.com`
3. أثبتيه عبر:
   - **SPF** record
   - **DKIM** record
4. احصلي على `API Key`
5. أضيفي في `.env.local`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM=noreply@befirstlady.com
```

### الاستخدام:
```typescript
import { sendEmail, EmailTemplates } from '@/lib/integrations/email';

const template = EmailTemplates.bookingConfirmation(
  'سارة',
  '15 أكتوبر 2024',
  '5:00 مساءً',
  'B-20241015-001',
  350
);

await sendEmail({
  to: 'customer@example.com',
  subject: template.subject,
  html: template.html,
});
```

### 💰 التسعير:
- 3,000 بريد مجاناً/شهر
- بعدها: 0.0004 دولار لكل بريد

---

## ⚡ الملخص السريع

| التكامل | الأولوية | المجاني | التكلفة الشهرية التقديرية |
|---------|---------|---------|---------------------------|
| 💚 WhatsApp | **عالية جداً** | 1000 رسالة | ~100-300 ر.س |
| 💳 Moyasar | عالية | — | % من المبيعات فقط |
| 📧 Email | متوسطة | 3000 بريد | 0 ر.س (كافٍ) |

---

## 🎯 خطوات التفعيل الموصى بها

### المرحلة 1 (الآن):
- [ ] Resend (مجاني — ابدئي)
- [ ] WhatsApp (مهم جداً للعميلات)

### المرحلة 2 (قريباً):
- [ ] Moyasar (يحتاج سجل تجاري)
- [ ] ربط Webhooks للتأكيد التلقائي

### المرحلة 3 (اختياري):
- [ ] SMS Fallback (في حال WhatsApp معطّلة)
- [ ] Push Notifications عبر PWA

---

## 🧪 اختبار بدون تفعيل حقيقي

كل الدوال ترجع `{ ok: false, error: '...غير مُفعّلة' }` إذا ما ضفتِ المفاتيح.
النظام ما يكسر — يسجّل تحذير فقط.

```typescript
// في أي مكان:
const result = await sendWhatsAppMessage(phone, text);
if (!result.ok) {
  console.warn('WhatsApp:', result.error);
  // كملي عادي — الحجز نجح
}
```

---

**Be First Lady** · نظام متكامل من Shaheen Design 🌸
