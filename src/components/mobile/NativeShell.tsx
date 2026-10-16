/**
 * NativeShell — تهيئة التطبيق عند الإقلاع
 * ═══════════════════════════════════════════════════════════
 * - يسجّل الجهاز للـ Push Notifications
 * - يتابع الاتصال بالإنترنت
 * - يخفي Splash بعد التحميل
 * - يضبط Status Bar
 *
 * ✅ آمن: يرجّع null بدون كسر لو كنا على الويب
 */

'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { isNative, isIOS } from '@/lib/mobile/platform';
import { initPush } from '@/lib/mobile/push';
import { initNetworkListener } from '@/lib/mobile/network';

export default function NativeShell() {
  useEffect(() => {
    if (!isNative()) return;

    (async () => {
      // 1. أخفي Splash
      try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide({ fadeOutDuration: 300 });
      } catch {}

      // 2. اضبطي Status Bar
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Dark });
        if (!isIOS()) {
          await StatusBar.setBackgroundColor({ color: '#fbf7ef' });
        }
      } catch {}

      // 3. سجّلي الـ Push
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await initPush(user.id);
      }

      // 4. راقبي الاتصال
      await initNetworkListener((online) => {
        if (!online) {
          toast.warning('📴 لا يوجد اتصال — بعض الميزات قد لا تعمل', {
            duration: 5000,
          });
        }
      });

      // 5. أزرار الـ Hardware Back على Android
      try {
        const { App } = await import('@capacitor/app');
        App.addListener('backButton', ({ canGoBack }) => {
          if (!canGoBack) {
            App.exitApp();
          } else {
            window.history.back();
          }
        });
      } catch {}
    })();
  }, []);

  return null;
}
