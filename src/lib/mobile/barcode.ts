// Barcode scanner — no-op on web (requires native app with Capacitor)
export async function scanBarcode(): Promise<string | null> {
  return null;
}
