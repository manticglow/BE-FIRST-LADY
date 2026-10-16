# 🎁 Be First Lady — ما الجديد في حزمة A+B

> آخر تحديث · أكتوبر 2026

---

## 🅰️ المجموعة A — الذهبيّة الداخليّة

### 1️⃣ بطاقات الهدية في الحجز 🎁
- حقل جديد في خطوة التأكيد
- التحقق التلقائي من الرصيد
- خصم تلقائي من رصيد البطاقة
- دعم استخدام جزئي (باقي الرصيد للمرة القادمة)

**الملف:**
- `src/components/booking/GiftCardField.tsx` ✨ جديد
- `src/components/booking/BookingWizard.tsx` ✏️ محدّث
- `src/app/api/bookings/route.ts` ✏️ محدّث

---

### 2️⃣ نظام المخزون 📦
- إدارة منتجات (كريمات، أدوات، مستهلكات)
- تتبّع الكمية مع تنبيه عند الوصول للحد الأدنى
- حركات المخزون (شراء، تعديل، استخدام)
- حساب القيمة الإجمالية للمخزون
- SKU + Barcode + التكلفة والسعر

**الملفات:**
- `src/app/admin/inventory/page.tsx` ✨ جديد
- `src/components/admin/InventoryManager.tsx` ✨ جديد
- `src/app/api/inventory/route.ts` ✨ جديد
- جداول: `inventory_items`, `inventory_movements`

---

### 3️⃣ نظام الرواتب 💰
- حساب تلقائي من ساعات الحضور
- دعم:
  - 🕐 **بالساعة**: `hourly_rate × ساعات`
  - 📅 **شهري ثابت**: `monthly_salary`
- إضافة بونص / خصومات
- وضع "مدفوع" مع تاريخ الدفع
- فلترة بالشهر والسنة

**الملفات:**
- `src/app/admin/payroll/page.tsx` ✨ جديد
- `src/components/admin/PayrollManager.tsx` ✨ جديد
- `src/app/api/payroll/route.ts` ✨ جديد
- جدول: `payroll_records`
- حقول جديدة في `profiles`: `hourly_rate`, `monthly_salary`

---

### 4️⃣ نظام الإحالة 🤝
- كل عميلة لها كود إحالة فريد (تلقائي عند التسجيل)
- خصم 50 ر.س للجديدة + 50 ر.س رصيد للموصية
- عرض الكود + روابط مشاركة مباشرة (واتساب + مشاركة النظام)

**الملفات:**
- `src/app/account/referral/page.tsx` ✨ جديد
- `src/components/account/ReferralCard.tsx` ✨ جديد
- حقول جديدة في `profiles`: `referral_code`, `referred_by`, `referral_credit`
- زر جديد في `/account`

---

### 5️⃣ الصفحات القانونيّة ⚖️
- 📜 الشروط والأحكام
- 🔒 سياسة الخصوصية
- 💵 سياسة الإلغاء والاسترداد
- روابط في Footer

**الملفات:**
- `src/app/legal/terms/page.tsx` ✨ جديد
- `src/app/legal/privacy/page.tsx` ✨ جديد
- `src/app/legal/refund/page.tsx` ✨ جديد
- `src/components/layout/Footer.tsx` ✏️ محدّث

---

## 🅱️ المجموعة B — التكاملات الخارجيّة

### 1️⃣ WhatsApp Cloud API 💚
- إرسال رسائل تأكيد + تذكير تلقائي
- 6 قوالب جاهزة بالعربي
- 1000 رسالة مجانيّة شهرياً

**الملف:** `src/lib/integrations/whatsapp.ts` ✨ جديد

---

### 2️⃣ Moyasar Payments 💳
- بوابة دفع سعوديّة
- مدى + فيزا + ماستر + Apple Pay + STC Pay
- دعم الاسترداد التلقائي

**الملف:** `src/lib/integrations/moyasar.ts` ✨ جديد

---

### 3️⃣ Resend Email 📧
- بريد إلكتروني فاخر بالهوية
- 3000 بريد مجاني شهرياً
- 2 قالب HTML جاهز

**الملف:** `src/lib/integrations/email.ts` ✨ جديد

---

## 📋 خطوات التفعيل بعد الاستلام

### 1. شغّلي الهجرة الجديدة:
```sql
-- في Supabase SQL Editor
-- شغّلي: supabase/migrations/009_gift_cards_referral_inventory.sql
```

### 2. أضيفي مفاتيح البيئة في `.env.local`:
```bash
# (كله اختياري — النظام يعمل بدونه)

# WhatsApp
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=

# Moyasar
MOYASAR_SECRET_KEY=
NEXT_PUBLIC_MOYASAR_PUBLISHABLE_KEY=
MOYASAR_WEBHOOK_SECRET=

# Resend
RESEND_API_KEY=
RESEND_FROM=noreply@befirstlady.com
```

### 3. راجعي دليل التكاملات:
📖 `docs/INTEGRATIONS_SETUP.md`

---

## 🎯 الخطوات التالية الموصى بها

- [ ] شغّلي الهجرة 009 في Supabase
- [ ] جرّبي بطاقات هدية + مخزون + رواتب في `admin/`
- [ ] شجّعي العميلات على استخدام نظام الإحالة
- [ ] فعّلي WhatsApp (أولوية قصوى)
- [ ] فعّلي Resend (مجاني ومباشر)
- [ ] جمّعي أوراق Moyasar (سجل تجاري)

---

**مجموع الملفات في هذه الحزمة:** 20+ ملف جديد / محدّث  
**مجموع الأسطر:** ~2,500 سطر إنتاج  
**تاريخ الإصدار:** أكتوبر 2026

🌸 Shaheen Design · Be First Lady
