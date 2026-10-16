/**
 * Haptics — اهتزاز لمسي للأزرار المهمّة
 * ═══════════════════════════════════════════════════════════
 */

'use client';

import { isNative } from './platform';

export type HapticStrength = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export async function haptic(strength: HapticStrength = 'light') {
  if (!isNative()) {
    // ويب: Vibration API
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(strength === 'heavy' ? 50 : strength === 'medium' ? 30 : 15);
    }
    return;
  }

  try {
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');

    if (strength === 'success' || strength === 'warning' || strength === 'error') {
      const type = strength === 'success' ? NotificationType.Success
        : strength === 'warning' ? NotificationType.Warning
        : NotificationType.Error;
      await Haptics.notification({ type });
    } else {
      const style = strength === 'heavy' ? ImpactStyle.Heavy
        : strength === 'medium' ? ImpactStyle.Medium
        : ImpactStyle.Light;
      await Haptics.impact({ style });
    }
  } catch {}
}
