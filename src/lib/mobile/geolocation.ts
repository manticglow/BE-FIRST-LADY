// Geolocation — uses browser's navigator.geolocation (works on web + native via Capacitor wrapper)
interface Position {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}
export async function getCurrentPosition(): Promise<Position | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
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
