# 🚀 Quick Start — تطبيق الموبايل

> من صفر إلى تطبيق على جهازكِ · 15 دقيقة

---

## ⚡ البدء السريع (5 أوامر)

```bash
# 1. ثبّتي كل شيء
cd befirstlady-v2
npm install --legacy-peer-deps

# 2. أضيفي منصّات (مرة واحدة)
npm run mobile:add:android      # Android (أي نظام)
npm run mobile:add:ios          # iOS (Mac فقط)

# 3. ولّدي الأيقونات والـ splash
npm run mobile:assets

# 4. افتحي في Android Studio أو Xcode
npm run mobile:open:android     # ← افتحي Android Studio
npm run mobile:open:ios         # ← افتحي Xcode

# 5. شغّلي على جهازكِ المتّصل بـ USB
npm run mobile:run:android
npm run mobile:run:ios
```

---

## 📂 الملفات الجديدة في المشروع

### تكامل مع الكود الحالي:
```
src/lib/mobile/
├── platform.ts       ← isNative(), isIOS(), isAndroid()
├── push.ts           ← Push Notifications
├── geolocation.ts    ← GPS ناتيف
├── barcode.ts        ← QR Scanner
├── haptics.ts        ← الاهتزاز اللمسي
├── share.ts          ← مشاركة ناتيف
└── network.ts        ← مراقبة الاتصال

src/components/mobile/
├── NativeShell.tsx       ← يُقلع التطبيق
└── MobileBottomNav.tsx   ← شريط التنقّل السفلي

src/lib/integrations/
└── push-sender.ts    ← إرسال من السيرفر (FCM)

src/app/api/push/send/
└── route.ts          ← API لإرسال الإشعارات

src/app/admin/push/
└── page.tsx          ← لوحة إدارة الإشعارات
```

### Capacitor:
```
capacitor.config.ts   ← الإعدادات
resources/
├── icon.svg + icon.png
├── splash.svg + splash.png
└── splash-dark.png

android/              ← يُنشأ بعد: npm run mobile:add:android
ios/                  ← يُنشأ بعد: npm run mobile:add:ios
```

---

## 🧪 اختبار بدون نشر

### Android:
1. فعّلي **Developer Mode** في جوّالكِ
2. وصّليه بـ USB
3. `npm run mobile:run:android` → يُركّب التطبيق مباشرة

### iOS:
1. وصّلي الآيفون بـ Mac
2. افتحي Xcode → اختاري الجهاز
3. Trust the device
4. `npm run mobile:run:ios`

**ملاحظة iOS:** تطبيقك سيعمل 7 أيام ثم ينتهي (بدون حساب Developer). مع حساب Developer: سنة كاملة.

---

## 🔑 التكاملات المطلوبة قبل النشر

### 1. Firebase (Push Notifications) — مجاني
→ [console.firebase.google.com](https://console.firebase.google.com)

**لـ Android:**
- حمّلي `google-services.json`
- ضعيه في `android/app/`

**لـ iOS:**
- حمّلي `GoogleService-Info.plist`
- في Xcode، drag-drop لمجلّد App

**في `.env.local` على السيرفر:**
```bash
FCM_PROJECT_ID=...
FCM_SERVICE_ACCOUNT_JSON=...
```

### 2. Apple Developer — $99/سنة
→ [developer.apple.com](https://developer.apple.com)

**لـ Push على iOS:**
- أنشئي APNs Key (.p8)
- ارفعيها في Firebase Console

### 3. Google Play Console — $25 لمرّة واحدة
→ [play.google.com/console](https://play.google.com/console)

---

## 💡 ميزات التطبيق الناتيف

| الميزة | الحالة | الملف |
|-------|--------|------|
| 🔔 Push Notifications | ✅ جاهز | `src/lib/mobile/push.ts` |
| 📍 GPS للحضور | ✅ جاهز | `src/lib/mobile/geolocation.ts` |
| 📷 QR Scanner | ✅ جاهز | `src/lib/mobile/barcode.ts` |
| 📳 Haptics | ✅ جاهز | `src/lib/mobile/haptics.ts` |
| 📤 Native Share | ✅ جاهز | `src/lib/mobile/share.ts` |
| 📵 Offline Detection | ✅ جاهز | `src/lib/mobile/network.ts` |
| ⬇️ Bottom Nav | ✅ جاهز | `src/components/mobile/` |
| 🎨 Splash + Icon | ✅ جاهز | `resources/` |
| 🔒 Deep Linking | ⏳ لاحقاً | — |
| 🔐 Face ID / Touch ID | ⏳ لاحقاً | — |

---

## 📞 الدعم

للنشر على المتاجر:
📖 اقرئي: `docs/MOBILE_APP_PUBLISHING.md`

للتكاملات الخارجيّة:
📖 اقرئي: `docs/INTEGRATIONS_SETUP.md`

**Shaheen Design** 🌸
