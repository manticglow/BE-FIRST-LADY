# 🇸🇦 دليل التوطين السعودي · Be First Lady

> كل الخدمات والاستضافة والرسائل والتوثيق من داخل المملكة العربيّة السعوديّة  
> آخر تحديث: 2026-11-05

---

## 📋 ملخّص تنفيذي

| الخدمة | الحالي | البديل السعودي الموصى به | الأولويّة |
|---|---|---|---|
| الاستضافة (Hosting) | Vercel (US) | **Vercel + Riyadh Edge** أو **STC Cloud** | متوسطة |
| قاعدة البيانات | Supabase | **Supabase – Bahrain** (أقرب منطقة، نفس المنطقة القانونيّة) | عالية ⚠️ |
| الواتساب | Meta مباشرة | **Unifonic** / **Yamamah** (موزّعين سعوديّين) | متوسطة |
| الإيميل | Resend | **Taqnyat** أو **AWS SES Bahrain** | متوسطة |
| SMS | — | **Taqnyat.sa** (السعر الأفضل) | عالية |
| النطاق (Domain) | `.com` | **`.sa`** عبر SaudiNIC | عالية |
| المدفوعات | Moyasar/Tabby/Tamara | ✅ سعوديّة بالفعل | مكتمل ✅ |
| تسجيل ZATCA | — | **ZATCA Phase 1** | عالية ⚠️ |
| تسجيل PDPL | — | **سدايا – البيانات الشخصيّة** | عالية ⚠️ |
| تصريح تجاري | — | **تصريح التسويق الإلكتروني – وزارة التجارة** | عالية ⚠️ |

---

## 🏢 1. الاستضافة (Hosting)

### الخيار الموصى به: البقاء على Vercel ✅

**الأسباب:**
- Vercel Edge Network يخدم المملكة من **Riyadh Edge PoP** (منذ 2024) — السرعة ممتازة.
- Next.js يعمل عليه بشكل native بدون أي تعقيد.
- التكلفة بسيطة مقارنة بأي سحابة سعوديّة.
- البيانات الفعليّة تظلّ في Supabase (الذي يمكن ضبطه لـBahrain).

### البدائل السعوديّة (لو احتجتِ Saudi-only hosting):

| المزوّد | المناطق | المميّزات | العيوب |
|---|---|---|---|
| **STC Cloud** (takamol.sa) | Riyadh | محليّ 100%، فواتير SAR، PDPL ready | أغلى، لا يوجد Next.js managed |
| **AWS KSA (Riyadh Region)** | Riyadh ME-CENTRAL-1 | أدوات AWS الكاملة، متوافق مع PDPL | يحتاج DevOps |
| **Oracle Cloud Jeddah** | Jeddah ME-JEDDAH-1 | مجاني Always Free tier مُحترم | أقل انتشاراً |
| **Google Cloud Dammam** | Dammam ME-CENTRAL-2 | قريب جداً، أدوات حديثة | يحتاج DevOps |
| **Microsoft Azure Riyadh** | Riyadh KSA-CENTRAL | تكامل Microsoft 365 | أغلى |
| **Mobily Cloud** | Riyadh | محلّي، شركة سعوديّة | أدوات محدودة |

### 💡 التوصية العمليّة:
```
Vercel للـFrontend/Serverless   +   Supabase Bahrain للبيانات
= سرعة عالميّة + امتثال PDPL كامل
```

---

## 🗄️ 2. قاعدة البيانات (Supabase)

### Supabase Bahrain Region 🎯

**الوصول:** عند إنشاء المشروع في Supabase، اختاري:
- **Region**: `Middle East (Bahrain)` – `me-south-1`
- أقرب منطقة فيزيائيّاً للسعوديّة (latency ~15ms من الرياض)
- داخل نطاق مجلس التعاون الخليجي — مقبول ضمن PDPL

### كيف تنقلي قاعدة البيانات الحاليّة إلى Bahrain؟

```bash
# 1. من Supabase Dashboard
# Project Settings → General → Transfer Project
# غير متاح مباشرة · أفضل حلّ:

# 2. Dump القاعدة الحاليّة
pg_dump $DATABASE_URL > backup.sql

# 3. أنشئي مشروع جديد في Supabase (region: Bahrain)
# 4. ارفعي الـschema والبيانات
psql $NEW_DATABASE_URL < backup.sql

# 5. حدّثي .env على Vercel
```

### بديل: Self-hosted Supabase على سحابة سعوديّة

لو ابغيتِ **البيانات 100% داخل السعوديّة**:
- شغّلي Supabase على **AWS Riyadh** أو **STC Cloud**
- استخدمي docker-compose من supabase/supabase repo
- التكلفة الشهريّة: ~200-500 SAR (VPS صغير)
- العيب: تحتاجين DevOps للصيانة

---

## 💬 3. الواتساب (WhatsApp Business)

### الوضع الحالي
المشروع يستخدم Meta WhatsApp Business Cloud API مباشرة.

### البدائل السعوديّة (BSPs - Business Solution Providers المعتمدون):

| المزوّد | الموقع | المميّزات |
|---|---|---|
| **Unifonic** 🏆 | unifonic.com | أكبر BSP سعودي، فواتير SAR، دعم عربي |
| **Yamamah** | yamamah.sa | واجهة عربيّة كاملة |
| **Taqnyat** | taqnyat.sa | أسعار منافسة، تكامل مع SMS |
| **Ebla** | ebla.sa | شركة سعوديّة ناشئة |

### خطوات الانتقال من Meta إلى BSP سعودي:

```
1. سجّلي مع Unifonic (unifonic.com) — تحقّق هويّة بالسجل التجاري / وثيقة العمل الحر
2. اطلبي "WhatsApp Business API" من حسابك
3. تحقّق رقم الواتساب (OTP → verification call)
4. انتظري اعتماد الـTemplates (نفس قوالب Meta)
5. استخرجي الـAPI Key من لوحة التحكم
6. حدّثي .env:
   WHATSAPP_PROVIDER=unifonic
   UNIFONIC_API_KEY=xxx
   UNIFONIC_APP_SID=xxx
```

> **الكود جاهز للتبديل:** `src/lib/whatsapp.ts` يحتاج wrapper واحد يختار بين Meta و Unifonic.

---

## 📧 4. الإيميل (Email)

### البدائل السعوديّة لـ Resend:

| المزوّد | الموقع | الاستخدام الأمثل |
|---|---|---|
| **Taqnyat Email** | taqnyat.sa | مرفق مع حزمة SMS |
| **Unifonic Email** | unifonic.com | متكامل مع الواتساب |
| **AWS SES (Bahrain)** | aws.amazon.com | الأرخص للكميّات الكبيرة |
| **STC Ocean** | ocean.sa | محليّ 100% |

### التبديل:
```typescript
// src/lib/email.ts — جاهز للتبديل
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'resend';

if (EMAIL_PROVIDER === 'ses') {
  // AWS SES Bahrain region
  const client = new SESClient({ region: 'me-south-1' });
}
```

---

## 📱 5. SMS

### Taqnyat.sa 🏆 (الموصى به)

**لماذا:**
- شركة سعوديّة بالكامل (مرخّصة من هيئة الاتصالات CITC)
- أسعار ممتازة: ~0.10 SAR / رسالة
- يدعم Sender ID مُخصّص (بعد اعتماد CITC)
- API بسيط وعربي

### خطوات التفعيل:
```
1. سجّلي في taqnyat.sa
2. أرفقي السجل التجاري / وثيقة العمل الحر
3. اطلبي Sender ID: "BeFirstLady" أو "BFL" (يحتاج موافقة CITC — ~3 أيام)
4. اشتري رصيد SAR عبر Mada
5. استخدمي API:
```

```typescript
// src/lib/sms.ts
await fetch('https://api.taqnyat.sa/v1/messages', {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.TAQNYAT_KEY}` },
  body: JSON.stringify({
    recipients: ['966501234567'],
    body: 'حجزكِ تم بنجاح · Be First Lady',
    sender: 'BeFirstLady',
  }),
});
```

---

## 🌐 6. النطاق `.sa` (Domain Registration)

### SaudiNIC (nic.sa) — الهيئة الرسميّة

**المتطلّبات:**
- ✅ وثيقة العمل الحر (عندكِ بالفعل)
- أو السجل التجاري

**الخطوات:**
```
1. زوري: register.nic.sa
2. اختاري النطاق: befirstlady.sa  أو  bfl.com.sa
3. ارفعي:
   - صورة الهويّة الوطنيّة
   - وثيقة العمل الحر (freelancer license)
4. ادفعي: 100 SAR / سنة (للـ.sa) · أقل للـ.com.sa
5. التفعيل: 1-3 أيام عمل
6. حدّثي DNS لـVercel:
   CNAME www → cname.vercel-dns.com
   A @ → 76.76.21.21
```

### الأنواع المتاحة:
- `befirstlady.sa` — الأفخم والأحدث
- `befirstlady.com.sa` — التقليدي التجاري
- `befirstlady.net.sa` — للشبكات
- `بي-فيرست-ليدي.السعودية` — IDN عربي (ميزة تنافسيّة!)

---

## 📊 7. تسجيل ZATCA (الزكاة والضريبة والجمارك)

### المتطلّبات الحاليّة ✅
- النظام يُصدر فواتير **ZATCA Phase 1 compliant** بالفعل
- فيها: QR Code، رقم ضريبي، تاريخ، المبلغ، VAT

### Phase 2 (الفوترة الإلكترونيّة المتكاملة)
إلزامي للشركات فوق 3 مليون ر.س سنوياً. **غير ملزم لكِ حالياً**، لكن للمستقبل:

```
1. سجّلي في: zatca.gov.sa
2. أضيفي نشاطك
3. احصلي على CSR (Certificate Signing Request)
4. فعّلي تكامل Phase 2 (webhook + e-invoice signed JSON)
5. الكود جاهز — يحتاج فقط الـcertificate
```

---

## 🛡️ 8. PDPL — قانون حماية البيانات الشخصيّة

### الوضع الحالي
السعوديّة أطلقت PDPL (Personal Data Protection Law) في سبتمبر 2023.  
نافذ بالكامل منذ **14 سبتمبر 2024**.

### المتطلّبات لنظامكِ:

| المتطلّب | الوضع | ما يلزم |
|---|---|---|
| **تسجيل مُسؤولة البيانات** | ❌ | سجّلي عبر sdaia.gov.sa |
| **سياسة خصوصيّة** | ⚠️ موجودة · تحتاج تحديث | أضيفي: PDPL rights |
| **موافقة صريحة للعميلات** | ✅ موجودة | تأكّدي من checkbox opt-in |
| **تخزين داخل الخليج** | ⚠️ Supabase US حاليّاً | انقلي لـBahrain region |
| **حقّ الحذف (Right to Erasure)** | ⚠️ يدوي | أضيفي زر "حذف حسابي" في /account |
| **تشفير البيانات الحسّاسة** | ✅ Supabase RLS | ✅ |
| **سجل الوصول (Audit Log)** | ✅ `api_request_log` | ✅ |
| **إخطار الاختراق خلال 72 ساعة** | ❌ | أضيفي إجراء داخلي |

### الخطوات:
```
1. سجّلي في sdaia.gov.sa → "مسؤولة البيانات الشخصيّة"
2. عيّني نفسكِ أو موظّفة كـData Protection Officer (DPO)
3. حدّثي /privacy في الموقع (نضيفها لك)
4. أضيفي صفحة /account/data-rights:
   - تصدير بياناتي
   - حذف حسابي
   - تعديل موافقاتي
```

---

## 🏪 9. تصريح التسويق الإلكتروني — وزارة التجارة

### المتطلّبات لأي متجر إلكتروني في السعوديّة:

| المتطلّب | التفاصيل |
|---|---|
| **السجل التجاري** | أو وثيقة العمل الحر ✅ (عندكِ) |
| **تصريح مزاولة التجارة الإلكترونيّة** | mc.gov.sa → خدمات الكترونيّة |
| **عرض الشروط والأحكام** | ✅ موجودة |
| **سياسة الاسترجاع** | ⚠️ تحتاج إضافة |
| **معلومات التواصل الواضحة** | ✅ موجودة |
| **رقم مدينة الخدمات** | اختياري |

### الخطوات:
```
1. ادخلي: https://mc.gov.sa
2. "تصريح ممارسة التجارة الإلكترونيّة"
3. ارفعي وثيقة العمل الحر
4. ادفعي الرسوم: 100 SAR / سنة
5. التصريح يصل خلال 2-5 أيام
6. أضيفي الرقم في footer الموقع
```

---

## 🎯 خطّة التنفيذ الموصى بها

### الأسبوع الأوّل (ضروري قبل الإطلاق):
1. ✅ شراء نطاق `.sa` من SaudiNIC
2. ✅ تسجيل PDPL في SDAIA
3. ✅ تصريح التجارة الإلكترونيّة من وزارة التجارة
4. ✅ تسجيل Taqnyat للـSMS

### الأسبوع الثاني:
5. ✅ نقل Supabase إلى Bahrain region
6. ✅ تسجيل Unifonic للواتساب (موازي لـMeta)
7. ✅ تحديث سياسة الخصوصيّة لـPDPL
8. ✅ إضافة صفحة /account/data-rights

### الشهر الأوّل بعد الإطلاق:
9. ✅ ZATCA Phase 1 (إلزامي إذا تعدّى الدخل الحد)

### اختياري (المستقبل):
- نقل كامل للـhosting على AWS Riyadh
- Sender ID مخصّص للـSMS من CITC
- ZATCA Phase 2

---

## 💰 التكاليف التقديريّة (سنويّة)

| البند | SAR |
|---|---|
| نطاق `.sa` | 100 |
| تصريح التجارة الإلكترونيّة | 100 |
| Taqnyat SMS (1000 رسالة) | ~100 |
| Unifonic WhatsApp (500 رسالة) | ~50 |
| Supabase Pro (Bahrain) | ~1,100 (25 USD × 12) |
| Vercel Pro (اختياري) | ~1,000 |
| **المجموع التقديري** | **~2,450 SAR** |

---

## 📞 جهات الاتصال المفيدة

| الجهة | الرابط | الهدف |
|---|---|---|
| SaudiNIC | nic.sa | النطاقات |
| SDAIA | sdaia.gov.sa | PDPL |
| وزارة التجارة | mc.gov.sa | التصاريح |
| ZATCA | zatca.gov.sa | الضرائب |
| CITC | citc.gov.sa | الاتصالات / Sender ID |
| Unifonic | unifonic.com | واتساب + إيميل |
| Taqnyat | taqnyat.sa | SMS |
| STC Cloud | takamol.sa | استضافة |

---

## ✅ الخلاصة التنفيذيّة

**الحد الأدنى للسعودة الكاملة (ضروري):**
1. نطاق `.sa`
2. تصريح التجارة الإلكترونيّة
3. تسجيل PDPL في SDAIA
4. نقل Supabase لـBahrain region
5. تسجيل Taqnyat للـSMS

**تستطيعين البقاء على Vercel + Meta WhatsApp** مع الخطوات أعلاه، لأنّ:
- Vercel يخدم من Riyadh Edge (سريع جداً)
- البيانات الفعليّة في Supabase Bahrain (ضمن الخليج = مقبول PDPL)
- Meta WhatsApp مُعتمد عالمياً

**الترقية التدريجيّة** للـBSPs السعوديّين والاستضافة المحليّة يمكن تأجيلها حتى يكبر النظام.
