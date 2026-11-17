# 🎁 Mega Features · The First Lady

> 18 ميزة جديدة · أضيفت في دفعة واحدة · نوفمبر 2026

---

## 📋 قائمة الميّزات

### 🛡️ البنية التحتيّة

| # | الميزة | المسار | النوع |
|---|--------|--------|------|
| 22 | Audit Log الحسّاس | `/admin/audit-log` | 🟢 جاهز |
| 23 | Backup يومي | Supabase Pro + cron | 🟡 تحتاج Supabase Pro |
| 24 | Sentry Monitoring | `sentry.*.config.ts` | 🟡 تحتاج `@sentry/nextjs` + DSN |
| 9 | Face ID / بصمة | `/account/security` | 🟢 جاهز |

### 🌸 تجربة العميلة

| # | الميزة | المسار | النوع |
|---|--------|--------|------|
| 1 | تنبيهات الميلاد | Cron 6:00 AM يومياً | 🟢 جاهز (يحتاج WhatsApp) |
| 2 | قائمة الانتظار | API + Admin UI | 🟢 جاهز |
| 3 | الحجز المتكرّر | Cron 5:00 AM يومياً | 🟢 جاهز |
| 5 | تحدّيات الولاء | `/account/challenges` | 🟢 جاهز (5 تحدّيات seed) |
| 17 | التقويم البصري | Component جديد | 🟡 يحتاج تطبيق على صفحات الحجز |
| 18 | Referral | `/account/referrals` | 🟢 جاهز كامل |
| 20 | PWA + Push | موجود مسبقاً · تحسينات | 🟢 جاهز |

### 📊 ذكاء الأعمال

| # | الميزة | المسار | النوع |
|---|--------|--------|------|
| 11 | التقارير المتقدّمة | 6 SQL Views | 🟢 جاهز |
| 12 | حملات تسويقيّة | `/admin/campaigns` | 🟢 جاهز |
| 15 | Analytics Dashboard | `/admin/analytics` | 🟢 جاهز |
| 7 | Mix & Match Packages | جدول `packages` موجود | 🟡 يحتاج UI builder |

### 🚀 التوسّعات

| # | الميزة | المسار | النوع |
|---|--------|--------|------|
| 25 | فروع متعدّدة | `salon_locations` + `branch_id` | 🟢 الـschema جاهز |
| 26 | متجر منتجات | `/shop` + `/admin/products` | 🟢 جاهز العرض · يحتاج Checkout |
| 28 | Call Center | `/admin/calls` | 🟢 جاهز كامل |

---

## 🗄️ الجداول الجديدة

### WebAuthn
```
webauthn_credentials  → الأجهزة المسجّلة (Face ID, بصمة, YubiKey)
webauthn_challenges   → تحدّيات مؤقّتة (5 دقائق)
```

### Birthday + Recurring
```
birthday_messages     → تتبّع رسائل الميلاد المرسلة
recurring_bookings    → الحجوزات المتكرّرة (أسبوعي · شهري)
```

### Waitlist
```
waitlist_entries      → قائمة الانتظار
```

### Loyalty
```
loyalty_challenges            → التحدّيات النشطة
loyalty_challenge_progress    → تقدّم كل عميلة
```

### Referrals + Wallet
```
referrals             → الإحالات
wallet_transactions   → حركات محفظة العميلة
+ profiles.wallet_balance
+ profiles.referral_code
```

### Marketing
```
marketing_campaigns   → الحملات
campaign_recipients   → المستقبلات
```

### Shop
```
product_categories    → فئات المنتجات (5 seeded)
products              → المنتجات
carts                 → عربات التسوّق
cart_items            → عناصر العربة
orders                → الطلبات
order_items           → عناصر الطلب
```

### Call Center
```
phone_calls           → سجلّ المكالمات
```

### Reporting Views
```
v_top_customers       → أعلى العميلات إنفاقاً
v_service_revenue     → إيرادات كل خدمة
v_staff_performance   → أداء الموظّفات
v_monthly_revenue     → الإيرادات الشهريّة
v_peak_hours          → heatmap الأوقات المزدحمة
v_lost_customers      → العميلات اللي ما زرن >60 يوم
```

---

## 🚀 خطوات التفعيل

### 1. تشغيل Migration في Supabase

```sql
-- شغّلي محتوى: supabase/apply/mega-features.sql
-- يُنشئ كل الجداول + Views + Seed Data
```

### 2. Environment Variables في Vercel

```bash
# Sentry (اختياري)
NEXT_PUBLIC_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# Cron Secret (مطلوب لحماية Cron Endpoints)
CRON_SECRET=أي_نصّ_طويل_عشوائي_64_حرف

# Base URL (مطلوب للـWebAuthn والـReferral links)
NEXT_PUBLIC_SITE_URL=https://thefirstlady.sa
```

### 3. Vercel Cron Jobs تلقائياً

الـ`vercel.json` يُشغّل:
- `/api/cron/birthday-messages` · يومياً 6 AM UTC (9 AM السعوديّة)
- `/api/cron/recurring-bookings` · يومياً 5 AM UTC (8 AM السعوديّة)

### 4. Sentry (اختياري)

```bash
npm install @sentry/nextjs
```

ثمّ شغّلي:
```bash
npx @sentry/wizard@latest -i nextjs
```

### 5. Backup (يحتاج Supabase Pro)

في Supabase Dashboard → Settings → Database → Backups
- 🔵 Point-in-Time Recovery (7 أيّام) · $25/شهر
- 🔵 Daily Scheduled Backups · مُفعّل افتراضياً

---

## 🔗 الروابط الجديدة

### للمالكة
```
/admin/analytics          ← لوحة التحليلات الشاملة
/admin/campaigns          ← الحملات التسويقيّة
/admin/audit-log          ← سجلّ الأمان (owner only)
/admin/calls              ← سجلّ المكالمات
/admin/waitlist           ← قائمة الانتظار (أنشئي الصفحة)
/admin/products           ← إدارة منتجات المتجر (أنشئي الصفحة)
```

### للعميلة
```
/account/referrals        ← ادعي صديقاتكِ
/account/challenges       ← تحدّيات الولاء
/account/security         ← Face ID + أجهزتي
/shop                     ← المتجر
```

---

## 📈 الإضافات الهيكليّة

- `src/lib/utils.ts` → `SAUDI_TZ`, `saudiToday()`, `saudiHour()`, `shiftIsoDate()`
- `src/lib/webauthn.ts` → helpers للـFace ID
- `src/lib/audit-log.ts` → types جديدة (webauthn, waitlist, referral, campaign, challenge, order)
- `sentry.client.config.ts` · `sentry.server.config.ts` → Sentry init
- `vercel.json` → 2 crons جديدة

---

## 📦 الحزم المضافة

```json
"@simplewebauthn/browser": "^13.1.0",
"@simplewebauthn/server":  "^13.1.1"
```

---

## 💡 خطوات لاحقة مقترحة

### قصيرة المدى (أسبوع):
- [ ] صفحة `/admin/waitlist` لإدارة قائمة الانتظار
- [ ] صفحة `/admin/products` لإدارة المنتجات (CRUD)
- [ ] صفحة `/admin/challenges` لإنشاء تحدّيات مخصّصة
- [ ] صفحة `/shop/cart` و `/shop/checkout`
- [ ] Visual Calendar component في صفحة الحجز
- [ ] Mix & Match package builder

### متوسّطة المدى (أسبوعين):
- [ ] تكامل Moyasar مع الطلبات (`orders`)
- [ ] اختيار الفرع في صفحة الحجز (`branch_id`)
- [ ] إشعارات Push عند إضافة عميلة للـwaitlist · ثمّ توفّر وقت

### طويلة المدى (شهر):
- [ ] تطبيق Face ID على صفحة `/login`
- [ ] AI Beauty Advisor باستخدام Claude API
- [ ] A/B Testing للـcampaigns
- [ ] تكامل مع Salla/Zid كبديل للـshop

---

## 🎯 ملاحظات أمنيّة

### 🛡 Rate Limits
جميع الـAPI الحسّاسة محميّة بـRate Limits:
- `webauthn/register-options`: 5/10min لكل user
- `waitlist`: 3/5min لكل user
- `referrals`: 20/day لكل user
- `campaigns/send`: 1/hour لكل admin

### 🔐 RLS Policies
جميع الجداول الجديدة محميّة بـRLS صارمة:
- `webauthn_*`: service_role فقط
- `waitlist_entries`: العميلة ترى حجزها فقط · admin ترى الكل
- `recurring_bookings`: العميلة ترى حجوزاتها فقط

### 📝 Audit Logging
كل عمليّة حسّاسة تُسجّل في `audit_logs`:
- تسجيل جهاز WebAuthn جديد
- إنشاء/إرسال حملة تسويقيّة
- طلب إحالة جديد
- إنشاء طلب متجر

---

**Updated:** 2026-11-18 · Night Build  
**Stack:** Next.js 15 · React 19 · Supabase · TypeScript
