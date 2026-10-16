/**
 * دوال الموقع الجغرافي
 */

// حساب المسافة بين نقطتين بالأمتار (Haversine)
export function distanceBetween(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000; // نصف قطر الأرض بالأمتار
  const toRad = (d: number) => d * Math.PI / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function isWithinRadius(
  userLat: number, userLng: number,
  centerLat: number, centerLng: number,
  radiusM: number
): { inside: boolean; distance: number } {
  const distance = distanceBetween(userLat, userLng, centerLat, centerLng);
  return { inside: distance <= radiusM, distance };
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} م`;
  return `${(meters / 1000).toFixed(1)} كم`;
}
