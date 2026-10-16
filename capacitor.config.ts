/**
 * Capacitor Config — Be First Lady Mobile App
 * ═══════════════════════════════════════════════════════════
 * الطريقة: Hybrid — يستضيف Next.js السيرفر، التطبيق يفتحه كـ WebView
 *
 * الوضعين:
 *   1. تطوير محلي: server.url = http://192.168.1.x:3000
 *   2. إنتاج: server.url = https://befirstlady.com
 *
 * بدّلي 'befirstlady.com' بالدومين الفعلي قبل البناء النهائي.
 */

import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.CAP_MODE === 'dev';

const config: CapacitorConfig = {
  appId: 'com.befirstlady.app',
  appName: 'Be First Lady',
  webDir: 'out',

  // ⚙️ وضع الاستضافة الحيّة (Live Reload / Production)
  server: {
    // في الإنتاج: الدومين الفعلي
    url: isDev ? 'http://192.168.1.10:3000' : 'https://befirstlady.com',
    cleartext: isDev,
    androidScheme: 'https',
    iosScheme: 'https',
    allowNavigation: [
      'befirstlady.com',
      '*.befirstlady.com',
      '*.supabase.co',
      'api.moyasar.com',
      'graph.facebook.com',
    ],
  },

  // 📱 إعدادات الـ WebView
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: isDev,
    backgroundColor: '#fbf7ef',
  },
  ios: {
    contentInset: 'always',
    scrollEnabled: true,
    allowsLinkPreview: false,
    backgroundColor: '#fbf7ef',
    preferredContentMode: 'mobile',
  },

  // 🎨 Splash Screen (شاشة البداية)
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#fbf7ef',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },

    StatusBar: {
      style: 'DARK',
      backgroundColor: '#fbf7ef',
      overlaysWebView: false,
    },

    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    Geolocation: {
      permissions: ['location'],
    },

    Camera: {
      // iOS Info.plist values تُضاف تلقائياً عبر cap sync
    },
  },
};

export default config;
