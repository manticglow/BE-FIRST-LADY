# 📱 دليل إعداد WhatsApp Business — Be First Lady

> دليل خطوة بخطوة لتفعيل:
> ✅ تسجيل الدخول برقم الجوال (OTP عبر واتساب)
> ✅ تأكيد الحجز تلقائياً بواتساب

**الوقت المتوقّع:** 2-3 أيام (أغلبه انتظار التحقّق من Meta)
**التكلفة:** مجاني · 1000 رسالة/شهر ضمن الباقة المجانية

---

## 📋 الخطوات · ملخّص

```
1. سجّلي في Meta Business Suite      → 15 دقيقة
2. أنشئي WhatsApp Business Account    → 10 دقيقة
3. أضيفي رقم جوال النشاط              → 5 دقائق
4. تحقّقي بالسجل التجاري              → 1-3 أيام (ينتظر Meta)
5. احصلي على: Phone Number ID + Token → 5 دقائق
6. أنشئي قوالب الرسائل                → 20 دقيقة
7. اضيفي البيانات في Vercel          → 5 دقائق
8. تختبرين → ينجح! 🎉
```

---

## 🚀 الخطوة 1 · Meta Business Suite

### 1.1 أنشئي حساب Business
1. افتحي: **https://business.facebook.com**
2. اضغطي **Create Account**
3. البيانات:
   - **Business Name:** `Be First Lady` أو `بي فيرست ليدي`
   - **Your Name:** اسمك الكامل
   - **Business Email:** إيميل العمل (الأفضل `info@befirstlady.com`)

### 1.2 أضيفي معلومات النشاط
- **Country:** Saudi Arabia
- **Website:** `https://befirstlady.com` (أو رابط Vercel حالياً)
- **Industry:** `Beauty, Cosmetics & Personal Care`
- **Description:** مركز نسائي متكامل للسبا والصالون في المدينة المنوّرة

---

## 💬 الخطوة 2 · WhatsApp Business Account

### 2.1 افتحي Meta for Developers
1. اذهبي لـ: **https://developers.facebook.com**
2. سجّلي الدخول بنفس حساب Facebook/Meta
3. اضغطي **My Apps** → **Create App**
4. اختاري:
   - **Use case:** `Other`
   - **App type:** `Business`
   - **App name:** `Be First Lady Backend`
   - **Business Account:** اختاري اللي أنشأتيه قبل

### 2.2 أضيفي WhatsApp
1. في App Dashboard → اضغطي **Add Product**
2. ابحثي عن **WhatsApp** → اضغطي **Set up**
3. اختاري **WhatsApp Business Account** اللي يناسبك
4. راح تنتقلين لـ WhatsApp Dashboard

---

## 📞 الخطوة 3 · إضافة رقم الجوال

### مهم: رقم مخصّص للنشاط · ما يصير شخصي!

### 3.1 الخيارات
**الخيار (أ) · رقم من Meta** (مجاني · أمريكي)
- Meta تعطيكِ رقم تجريبي · يشتغل من اليوم
- يصلح للاختبار قبل الإنتاج

**الخيار (ب) · رقمك السعودي** (الموصى به · 966xxx)
- لازم تحقّقين منه برسالة أو مكالمة
- الرقم ما يصير مستعمل في تطبيق واتساب العادي بعدها (ينفصل)
- **لا تستخدمي رقمك الشخصي · استخدمي رقم جديد للصالون**

### 3.2 الخطوات
1. في WhatsApp Dashboard → **Phone Numbers** → **Add Phone Number**
2. أدخلي الرقم (مع رمز الدولة): `+966504389329`
3. اختاري طريقة التحقّق: **SMS** أو **Voice call**
4. أدخلي الكود اللي وصلك

### 3.3 احصلي على `Phone Number ID`
بعد إضافة الرقم، راح يبان لك في الجدول:
```
Phone Number ID: 123456789012345   ← انسخيه (تحتاجينه)
WhatsApp Business Account ID: 987654321098765
```

---

## 🔑 الخطوة 4 · احصلي على Access Token

### 4.1 Token مؤقت (24 ساعة · للاختبار)
في Dashboard → **API Setup** → انسخي **Access Token**

### 4.2 Token دائم (للإنتاج) — موصى به
1. **Settings** → **System Users** → **Add**
2. **Name:** `befirstlady-api-user`
3. **Role:** `Admin`
4. بعد الإنشاء → **Generate Token**
5. اختاري:
   - **App:** تطبيقك
   - **Expiration:** `Never`
   - **Permissions:**
     - ✅ `whatsapp_business_messaging`
     - ✅ `whatsapp_business_management`
6. **Generate Token** → انسخيه فوراً (ما يبان ثانياً)

---

## 🏢 الخطوة 5 · التحقّق التجاري (الأهم)

> هذي الخطوة اللي تاخذ 1-3 أيام · ينتظر مراجعة Meta

### المستندات المطلوبة
- 📄 **السجل التجاري** (صورة واضحة PDF أو PNG)
- 📄 **فاتورة كهرباء/ماء** باسم النشاط (لإثبات العنوان)
- 📄 **موقع إلكتروني يعمل** (رابط Vercel يصلح)
- 📄 **ملف تعريفي**: اسم النشاط، العنوان، الهاتف، الإيميل

### الخطوات
1. **Meta Business Settings** → **Business Info**
2. أدخلي كل بيانات النشاط بدقّة (مطابقة للسجل)
3. **Verification** → **Start Verification**
4. ارفعي المستندات
5. أرسلي · انتظري الإيميل (عادة 24-72 ساعة)

### 💡 نصائح نجاح
- بيانات النشاط في Meta **لازم مطابقة** للسجل حرفياً
- الموقع لازم فيه: عن المركز، خدماتنا، تواصل معنا، سياسة خصوصية
- رقم الهاتف في الموقع لازم مطابق لرقم WhatsApp

---

## 📝 الخطوة 6 · إنشاء قوالب الرسائل

> **مهم:** رسائل OTP والتأكيدات لازم تكون من قالب معتمد.
> رسائل الدردشة بس تمشي بدون قالب.

### 6.1 افتحي Template Manager
Meta Business → **WhatsApp Manager** → **Templates** → **Create Template**

### 6.2 قالب OTP (لتسجيل الدخول)

| الحقل | القيمة |
|-------|--------|
| **Name** | `otp_login` |
| **Category** | `Authentication` |
| **Language** | `Arabic` |

**محتوى الرسالة:**
```
رمز الدخول لـ بي فيرست ليدي: {{1}}

ينتهي خلال 10 دقائق · لا تشاركيه مع أحد
```

**Footer:**
```
Be First Lady · المدينة المنوّرة
```

**Buttons:**
- **Type:** `Copy code`
- **Button text:** `نسخ الرمز`

### 6.3 قالب تأكيد الحجز

| الحقل | القيمة |
|-------|--------|
| **Name** | `booking_confirmation` |
| **Category** | `Utility` |
| **Language** | `Arabic` |

**محتوى الرسالة:**
```
✨ أهلاً {{1}} 💛

تم تأكيد حجزكِ في Be First Lady 🌸

📅 التاريخ: {{2}}
⏰ الوقت: {{3}}
🔖 رقم الحجز: {{4}}

نرحّب بكِ قبل 10 دقائق من موعدكِ · شكراً لثقتكِ 💐
```

**Footer:**
```
Be First Lady · 0504389329
```

### 6.4 قالب تذكير 24 ساعة قبل الموعد

| الحقل | القيمة |
|-------|--------|
| **Name** | `booking_reminder_24h` |
| **Category** | `Utility` |
| **Language** | `Arabic` |

```
💛 تذكير يا {{1}}

موعدكِ في Be First Lady غداً {{2}} الساعة {{3}}

نراكِ قريباً 🌸
```

> **الموافقة:** عادة بين دقيقة و24 ساعة · إشعار يوصل على إيميلك

---

## ⚙️ الخطوة 7 · إضافة البيانات في Vercel

### 7.1 افتحي إعدادات المشروع
1. Vercel Dashboard → مشروع `befirstlady`
2. **Settings** → **Environment Variables**

### 7.2 أضيفي هذي المتغيّرات

| Variable Name | القيمة | Environment |
|---------------|--------|-------------|
| `WHATSAPP_PHONE_NUMBER_ID` | من الخطوة 3.3 | Production + Preview |
| `WHATSAPP_ACCESS_TOKEN` | من الخطوة 4.2 | Production + Preview |
| `WHATSAPP_BUSINESS_ACCOUNT_ID` | من الخطوة 3.3 | Production |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `966504389329` | Production + Preview |

### 7.3 Redeploy
بعد إضافة المتغيّرات → **Deployments** → آخر deployment → **Redeploy** (بدون كاش)

---

## ✅ الخطوة 8 · الاختبار

### 8.1 اختبار تأكيد الحجز
1. ادخلي الموقع
2. احجزي خدمة بأي رقم جوال
3. راح يوصل رسالة واتساب تلقائياً

### 8.2 اختبار تسجيل الدخول
1. اذهبي لـ `/login`
2. اضغطي **تسجيل برقم الجوال**
3. أدخلي رقمك
4. راح يوصل OTP على واتساب
5. أدخليه → دخلت!

---

## 🆘 مشاكل شائعة وحلولها

| المشكلة | الحل |
|---------|------|
| "Template not approved" | انتظري حتى يوافق Meta (أو عدّلي القالب) |
| "Phone number not registered" | راجعي خطوة 3.2 · تحقّقي من الرقم |
| "Invalid token" | أعيدي توليد Token (خطوة 4.2) |
| ما يوصل OTP | راجعي: السجل التجاري معتمد؟ القالب معتمد؟ Token صحيح؟ |
| "Business not verified" | ارفعي المستندات (خطوة 5) |

---

## 💰 التكلفة بالتفصيل

### Meta WhatsApp — التسعير الحالي (2026)
| النوع | المجاني شهرياً | بعد المجاني |
|-------|-----------------|-------------|
| **محادثات العميلة البدأتها** | غير محدود | غير محدود |
| **محادثات أنتي بدأتيها (تذكيرات)** | 1000 شهرياً | ~0.19 ر.س/محادثة |

### مثال واقعي لصالون:
- 500 حجز شهرياً × 2 رسالة (تأكيد + تذكير) = 1000 رسالة = **مجاني**
- 1000 حجز = 2000 رسالة = 1000 مجانية + 1000 × 0.19 = **190 ر.س/شهر**

---

## 📞 دعم Meta

- **Help Center:** https://business.facebook.com/business/help
- **Status:** https://metastatus.com (لمعرفة إذا الخدمة متوقّفة)
- **Community:** https://developers.facebook.com/community

---

**آخر تحديث:** 2026-10-19
