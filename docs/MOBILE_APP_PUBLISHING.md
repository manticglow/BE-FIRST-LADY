# 📱 دليل نشر Be First Lady على App Store و Google Play

> **من البداية للنهاية** · خطوة بخطوة بالعربي

---

## 🎯 الطريقة المختارة: Capacitor

**Capacitor** (من صنّاع Ionic) يحوّل موقع Next.js حقك إلى تطبيق iOS + Android حقيقي، مع:
- ✅ **إشعارات ناتيف** (Firebase + APNs)
- ✅ **كاميرا + GPS + Haptics + Share**
- ✅ **ماسح QR**
- ✅ **تطبيق واحد** في المتجرين
- ❌ **بدون إعادة كتابة** الكود — نفس Next.js حقك

---

## 📋 ما تحتاجينه (مرة واحدة)

### الحسابات:
| الحساب | التكلفة | ضروري لـ |
|--------|---------|---------|
| 🍎 **Apple Developer Program** | $99/سنة | App Store |
| 🤖 **Google Play Console** | $25 لمرّة واحدة | Google Play |
| 🔥 **Firebase** (مجاني) | 0 ر.س | Push Notifications |

### الأجهزة والبرامج:
- 💻 **Mac** (ضروري لـ iOS فقط) — أو خدمة Mac سحابيّة مثل MacStadium
- 🤖 **Android Studio** (مجاني — Windows/Mac/Linux)
- 🍎 **Xcode** (مجاني — Mac فقط)

---

## 🚀 المرحلة 1: الإعداد الأوّلي (دقائق)

### 1.1 ثبّتي الحزم:
```bash
cd befirstlady-v2
npm install --legacy-peer-deps
```

### 1.2 شغّلي الهجرة الجديدة:
في Supabase SQL Editor:
```sql
-- شغّلي: supabase/migrations/010_mobile_app.sql
```

### 1.3 تحقّقي من الدومين في `capacitor.config.ts`:
```typescript
server: {
  url: 'https://befirstlady.com', // ← بدّلي بالدومين الفعلي
  ...
}
```

### 1.4 أضيفي منصّة Android:
```bash
npm run mobile:add:android
```

### 1.5 أضيفي منصّة iOS (على Mac فقط):
```bash
npm run mobile:add:ios
```

### 1.6 ولّدي الأيقونات وشاشة البداية:
```bash
npm run mobile:assets
```

---

## 🤖 المرحلة 2: نشر على Google Play Store

### الخطوة 1: افتحي Android Studio
```bash
npm run mobile:open:android
```

### الخطوة 2: ضبط التوقيع
في Android Studio:
1. **Build → Generate Signed Bundle / APK**
2. اختاري **Android App Bundle** (مطلوب للستور)
3. **Create new keystore:**
   - احفظي الملف في مكان آمن (⚠️ **احتفظي بنسخة احتياطية — لو ضاع ما تقدرين تحدّثين التطبيق أبداً**)
   - ضعي كلمة مرور قويّة
   - صلاحية 25 سنة
4. اضبطي **Build Type:** `release`

### الخطوة 3: افتحي Google Play Console
🔗 [play.google.com/console](https://play.google.com/console)

1. **Create app** → أدخلي:
   - **اسم التطبيق:** Be First Lady · صالون
   - **اللغة الافتراضيّة:** العربيّة (المملكة العربيّة السعوديّة)
   - **التصنيف:** تطبيق
   - **مجاني / مدفوع:** مجاني
2. **App content** (أكملي كل الأقسام):
   - ⚖️ **Privacy Policy URL:** `https://befirstlady.com/legal/privacy`
   - 🔞 **التقييم:** استبيان قصير → تختار "عام (Everyone)"
   - 📍 **البلد المستهدف:** السعوديّة
   - 📱 **فئة التطبيق:** جمال وموضة
3. **Store listing:**
   - **اسم التطبيق:** Be First Lady
   - **وصف قصير:** صالون نسائي فاخر في المدينة المنوّرة — احجزي بسهولة
   - **الوصف الكامل:** (انظري النموذج أدناه)
   - **الأيقونة:** `public/icons/icon-512.png`
   - **صورة البانر 1024×500**
   - **لقطات شاشة** (الحد الأدنى 2 — صور الهاتف)

### الخطوة 4: ارفعي الـ AAB
1. **Testing → Internal testing → Create new release**
2. ارفعي ملف `.aab` اللي ولّدتيه
3. أضيفي **ما الجديد:** "الإصدار الأوّل 🌸"
4. **Review → Start rollout**

### الخطوة 5: اختبار داخلي → ثم Production
1. أضيفي 1-5 إيميلات اختبار داخلي
2. تأكّدي من كل شيء يشتغل
3. **Promote to Production** لمّا تجهزين

⏱ **مدة المراجعة:** 1-7 أيام

---

## 🍎 المرحلة 3: نشر على App Store

### الخطوة 1: افتحي Xcode (على Mac)
```bash
npm run mobile:open:ios
```

### الخطوة 2: ضبط التوقيع
في Xcode:
1. اختاري **Be First Lady** في الـ sidebar
2. **Signing & Capabilities:**
   - **Team:** حسابك الـ Apple Developer
   - **Bundle Identifier:** `com.befirstlady.app`
   - ✅ أضيفي **Push Notifications**
   - ✅ أضيفي **Background Modes** → Remote notifications

### الخطوة 3: ارفعي للـ App Store Connect
1. اختاري **Any iOS Device** في شريط التشغيل
2. **Product → Archive**
3. **Distribute App → App Store Connect → Upload**
4. انتظري البناء ينتهي (10-20 دقيقة)

### الخطوة 4: افتحي App Store Connect
🔗 [appstoreconnect.apple.com](https://appstoreconnect.apple.com)

1. **My Apps → + → New App:**
   - **Platform:** iOS
   - **Name:** Be First Lady
   - **Primary Language:** Arabic (Saudi Arabia)
   - **Bundle ID:** `com.befirstlady.app`
   - **SKU:** `BFL-001`
2. **App Information:**
   - **Category:** Lifestyle (الأولى) + Health & Fitness (الثانية)
   - **Content Rights:** Yes
3. **Pricing:** Free
4. **App Privacy:** أكملي الاستبيان
   - ✅ تجمعين: بريد، جوال، اسم (للحجز)
   - ❌ لا تتعقّبين عبر تطبيقات أخرى
5. **Prepare for Submission:**
   - **Screenshots:** 6.7" + 6.5" + 5.5" (بالعربي)
   - **Description** (نموذج أدناه)
   - **Keywords:** صالون,سبا,المدينة,حجز,مساج,تنظيف بشرة
   - **Support URL:** https://befirstlady.com/support
   - **Privacy Policy:** https://befirstlady.com/legal/privacy

### الخطوة 5: اختاري البناء وأرسلي
1. **Build → +** → اختاري البناء المرفوع
2. **Add for Review**
3. **Submit for Review**

⏱ **مدة المراجعة:** 24-48 ساعة (أحياناً أقل)

---

## 🔔 المرحلة 4: تفعيل Push Notifications

### Firebase Setup (مرة واحدة):
1. [console.firebase.google.com](https://console.firebase.google.com)
2. **Create project:** Be First Lady
3. **Add app:**
   - 🤖 **Android:** package = `com.befirstlady.app` → حمّلي `google-services.json` → ضعيه في `android/app/`
   - 🍎 **iOS:** bundle = `com.befirstlady.app` → حمّلي `GoogleService-Info.plist` → في Xcode ضعيه في مجلد App
4. **Project Settings → Service Accounts → Generate new private key** → حمّلي JSON

### أضيفي في `.env.local` على سيرفر الإنتاج:
```bash
FCM_PROJECT_ID=befirstlady-xxxxx
FCM_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

### APNs لـ iOS (مرّة واحدة):
1. **Apple Developer → Certificates:** أنشئي **APNs Authentication Key** (`.p8`)
2. ارفعيه في Firebase → **Project Settings → Cloud Messaging → Apple App configuration**

---

## 📝 نموذج وصف التطبيق (العربي)

```
✨ Be First Lady — صالون السيدة الأولى

مركز نسائي متكامل في قلب المدينة المنوّرة.
ترفٌ يليق بكِ، وجمالٌ يُحكى عنه.

📱 احجزي بثلاث نقرات:
• اختاري الخدمة
• حدّدي اليوم والوقت
• أكّدي الحجز

💛 المزايا:
• 15+ خدمة مختارة (مساج، حمّام مغربي، تنظيف بشرة، شعر، مكياج)
• نظام نقاط ولاء حصري
• بطاقات هديّة
• نظام إحالة الصديقات
• ذكّركِ قبل الموعد

🌸 عن المركز:
صالون نسائي فاخر، فريق محترف من الأخصّائيات،
بيئة آمنة ومُطمئنة، مواعيد مرنة.

نعتني بكِ لتُزهري.

📍 المدينة المنوّرة
📞 0504389329
🌐 befirstlady.com
```

### Keywords (iOS - 100 حرف فقط):
```
صالون,سبا,المدينة,حجز,مساج,حمام مغربي,تنظيف بشرة,مكياج,شعر,نسائي
```

### نموذج Promotional Text (170 حرف):
```
احجزي بسهولة في Be First Lady · صالون نسائي فاخر في المدينة المنوّرة. مواعيد مرنة، خدمات مميّزة، ونظام نقاط ولاء خاص.
```

---

## 🧪 المرحلة 5: الاختبار قبل النشر

### على جهازكِ:
```bash
# Android
npm run mobile:run:android

# iOS (Mac)
npm run mobile:run:ios
```

### قائمة فحص قبل الإرسال:
- [ ] التطبيق يفتح بدون كراش
- [ ] تسجيل الدخول يشتغل
- [ ] الحجز الكامل يشتغل
- [ ] الإشعارات تصل
- [ ] الكاميرا تفتح للـ QR
- [ ] GPS يشتغل في صفحة الحضور
- [ ] الـ Back button على Android صحيح
- [ ] الـ Status Bar لونه مظبوط
- [ ] الـ Splash Screen يظهر 1.5 ثانية
- [ ] لا توجد روابط خارجيّة مكسورة
- [ ] أيقونة التطبيق واضحة
- [ ] يشتغل بدون إنترنت (الصفحات الأساسيّة)

---

## 🔄 المرحلة 6: التحديثات اللاحقة

### تحديث صغير (محتوى + UI فقط):
فقط ارفعي للسيرفر — التطبيق يسحب التحديث تلقائياً (لأن server.url يشير للموقع).

### تحديث يحتاج نسخة جديدة من التطبيق (ناتيف):
```bash
# زيدي رقم الإصدار في package.json
# ثم:
npm run mobile:sync
npm run mobile:open:android  # ← ابني من Build > Generate Bundle
npm run mobile:open:ios      # ← Archive > Upload
```

---

## ❗ مشاكل شائعة وحلولها

### "App rejected: Missing Privacy Policy"
➜ تأكّدي من الرابط `/legal/privacy` يفتح بدون تسجيل دخول

### "App crashes on launch"
➜ تحقّقي من `capacitor.config.ts` → `server.url` صحيح

### "Push notifications لا تصل"
➜ تأكّدي من:
1. `google-services.json` موجود في `android/app/`
2. APNs key مرفوع في Firebase
3. `FCM_PROJECT_ID` و `FCM_SERVICE_ACCOUNT_JSON` في البيئة

### "Guideline 4.2 — Design — Minimum Functionality" (iOS)
➜ Apple يرفض تطبيقات تكون مجرد ويب رابر. تأكّدي من إضافة ميزة ناتيف واضحة:
- ✅ عندنا: Push + GPS + Camera + Share → نقول هذا في المراجعة

### "In-App Purchase required" (iOS)
➜ خدمات الحجز الحضوري **لا تحتاج** IAP — Apple يقبل Moyasar (دفع لخدمات خارج التطبيق)

---

## 🎁 نصائح للمراجعة الناجحة من المرّة الأولى

1. **ارفعي فيديو تجربة** (30 ثانية) في App Store Connect
2. **اذكري أن هناك ميزات ناتيف:** Push + GPS للحضور + Camera للـ QR
3. **اختبري على جهاز حقيقي** قبل الإرسال
4. **لا تخفي محتوى** خلف تسجيل الدخول (Apple يرفض بسبب هذا كثيراً)
5. **اكتبي ملاحظة للمراجع:** حساب تجريبي + كلمة مرور

```
Test account: tester@befirstlady.com / Pass1234!
Guest booking works without login.
Features: Native Push, GPS attendance (staff), QR scanner.
```

---

## 📊 التكلفة النهائيّة التقديريّة

| البند | التكلفة |
|------|---------|
| Apple Developer (سنوي) | 371 ر.س |
| Google Play (مرّة) | 94 ر.س |
| Firebase (10K إشعار/شهر) | مجاني |
| Server (Vercel/Hetzner) | 0-180 ر.س/شهر |
| **إجمالي السنة الأولى** | **~500 ر.س** |

---

**Shaheen Design** · طوّرته لـ Be First Lady 🌸
