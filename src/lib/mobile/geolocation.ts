/**
 * Native Geolocation — GPS ناتيف للحضور
 * ═══════════════════════════════════════════════════════════
 * يستخدم Capacitor Geolocation بدلاً من navigator.geolocation
 * (أدق وأسرع على الموبايل، ويطلب الإذن بشكل أنيق)
 */

'use client';

import { isNative } from './platform';

interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export async function getCurrentPosition(): Promise<Position | null> {
  // ناتيف: Capacitor
  if (isNative()) {
    try {
      const { Geolocation } = await import('@capacitor/geolocation');

      const perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted') {
        const req = await Geolocation.requestPermissions();
        if (req.location !== 'granted') return null;
      }

      const pos = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });

      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: pos.timestamp,
      };
    } catch {
      return null;
    }
  }

  // ويب: navigator
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({
        latitude: p.coords.latitude,
        longitude: p.coords.longitude,
        accuracy: p.coords.accuracy,
        timestamp: p.timestamp,
      }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}
