// Haptics — uses browser Vibration API (silent fallback)
export type HapticStrength = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
export async function haptic(strength: HapticStrength = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(strength === 'heavy' ? 50 : strength === 'medium' ? 30 : 15);
  }
}
